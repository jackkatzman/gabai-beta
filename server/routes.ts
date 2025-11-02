import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { storage } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { generatePersonalizedResponse, transcribeAudio, extractTextFromImage, generateSmartListName } from "./services/openai";
import { learnFromInteraction, generateProactiveSuggestions } from "./services/pattern-recognition";
import OpenAI from "openai";
import { speechService } from "./services/speech";
import { generateVCard, extractContactFromText } from "./services/vcard";
import { createShortLink, getLongUrl, getLinkStats } from "./services/linkShortener";
import { sendMagicLink } from "./services/email";
import { sendMagicLinkSMS, sendCodeSMS, sendReminderSMS, generateVerificationCode, verifyCodeSMS, normalizePhoneNumber } from "./services/sms";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

// Function to process URLs in content and add affiliate shortening
async function processUrlsInContent(content: string): Promise<string> {
  // Regex to find URLs in the content - improved to handle punctuation properly
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let processedContent = content;
  
  const matches = content.match(urlRegex);
  if (matches) {
    for (const url of matches) {
      try {
        // Clean the URL - remove trailing punctuation that shouldn't be part of the URL
        let cleanUrl = url.replace(/[.,;:!?)\]}]+$/, '');
        
        // Check if it's a supported affiliate domain
        const urlObj = new URL(cleanUrl);
        const domain = urlObj.hostname.replace(/^www\./, '');
        
        if (['amazon.com', 'booking.com', 'expedia.com', 'kayak.com', 'hotels.com', 'vrbo.com'].includes(domain)) {
          console.log(`🔗 Processing affiliate URL: ${cleanUrl}`);
          const { shortUrl } = await createShortLink(cleanUrl);
          processedContent = processedContent.replace(url, shortUrl);
          console.log(`✅ Replaced with: ${shortUrl}`);
        }
      } catch (error) {
        console.error('Error processing URL:', url, error);
      }
    }
  }
  
  return processedContent;
}
import { nanoid } from "nanoid";
import { categorizeItem } from './categorization';
import { 
  insertUserSchema, 
  insertConversationSchema, 
  insertMessageSchema,
  insertSmartListSchema,
  insertListItemSchema,
  insertReminderSchema
} from "@shared/schema";
import multer from "multer";
import ical from "ical-generator";

// Mobile auth callback route - serves the mobile auth callback page
function addMobileAuthRoute(app: Express) {
  app.get('/mobile-auth-callback', (req, res) => {
    console.log('📱 Mobile auth callback route accessed');
    console.log('🔍 Query params:', req.query);
    
    const token = req.query.token;
    const success = req.query.success;
    
    if (token && success === 'true') {
      console.log('✅ Valid mobile auth callback with token');
      // Serve the mobile auth callback page
      res.sendFile(path.join(__dirname, '../dist/public/mobile-auth-callback.html'));
    } else {
      console.log('❌ Invalid mobile auth callback - redirecting to home');
      res.redirect('/?error=mobile_auth_failed');
    }
  });
}

// Authentication middleware with mobile token verification
const isAuthenticated = async (req: any, res: any, next: any) => {
  console.log('🔐 Checking authentication...');
  console.log('🍪 Session ID:', req.sessionID);
  console.log('👤 Session user:', req.session?.passport?.user);
  console.log('🔑 Request user:', req.user?.id);
  
  // Check for session-based authentication first (for web users)
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    console.log('✅ Session authenticated user:', (req.user as any).id);
    return next();
  }
  
  // Check for mobile token-based authentication
  // Check both Authorization header AND cookies
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.gabai_token;
  
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    console.log('🔑 Token found in Authorization header');
  } else if (cookieToken) {
    token = cookieToken;
    console.log('🍪 Token found in cookie for mobile auth');
  }
  
  if (token) {
    console.log('🔑 Mobile token authentication attempt');
    console.log('🔍 Token debug:', { 
      length: token.length, 
      hasJWTDots: token.includes('.'), 
      firstChars: token.substring(0, 20) + '...',
      lastChars: '...' + token.substring(token.length - 10)
    });
    
    try {
      let decoded: any;
      let userId: string;
      
      // ARCHITECT FIX: Handle multiple token formats
      if (token.includes('.')) {
        // JWT format (3 parts separated by dots)
        console.log('🔑 Attempting JWT decode...');
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode JWT payload (middle part)
          let payloadB64 = parts[1];
          // Handle base64url padding
          while (payloadB64.length % 4) payloadB64 += '=';
          payloadB64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
          
          const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
          userId = payload.sub || payload.userId || payload.uid;
          console.log('✅ JWT decoded, userId:', userId, 'payload keys:', Object.keys(payload));
        } else {
          throw new Error('Invalid JWT format - expected 3 parts');
        }
      } else {
        // Legacy base64 JSON format
        console.log('🔑 Attempting base64 JSON decode...');
        
        // Normalize base64url to base64 (handle URL-safe base64)
        let normalizedToken = token.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if missing
        while (normalizedToken.length % 4) {
          normalizedToken += '=';
        }
        
        console.log('🔍 Base64 normalization:', { 
          original: token.length, 
          normalized: normalizedToken.length,
          paddingAdded: normalizedToken.length - token.length 
        });
        
        decoded = JSON.parse(Buffer.from(normalizedToken, 'base64').toString());
        userId = decoded.userId;
        
        console.log('✅ Legacy token decoded:', {
          userId,
          timestamp: decoded.timestamp,
          keys: Object.keys(decoded)
        });
        
        // Check token age for legacy tokens
        if (decoded.timestamp) {
          const tokenAge = Date.now() - decoded.timestamp;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          console.log('🕒 Token age check:', { 
            ageHours: Math.round(tokenAge / (1000 * 60 * 60)), 
            maxAgeHours: Math.round(maxAge / (1000 * 60 * 60)) 
          });
          
          if (tokenAge > maxAge) {
            console.log('❌ Legacy token expired');
            return res.status(401).json({ error: 'Token expired' });
          }
        }
      }
      
      if (!userId) {
        console.log('❌ Token missing userId, decoded:', decoded || 'N/A');
        return res.status(401).json({ error: 'Invalid token: missing userId' });
      }
      
      console.log('🔍 Looking up user:', userId);
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('❌ User not found for userId:', userId);
        return res.status(401).json({ error: 'User not found' });
      }
      
      console.log('✅ Token verified for user:', (user as any).id, 'email:', (user as any).email);
      req.user = user as any;
      return next();
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      console.error('❌ Token details for debugging:', { 
        tokenLength: token.length, 
        tokenStart: token.substring(0, 30),
        tokenEnd: token.substring(token.length - 10),
        hasJWTDots: token.includes('.'),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack'
      });
      return res.status(401).json({ error: 'Invalid token format' });
    }
  }

  // Note: Mobile app bypass removed - require proper authentication
  
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('✅ Session authenticated user found');
    return next();
  }
  
  console.log('❌ No authentication found');
  res.status(401).json({ message: 'Not authenticated' });
};

import elevenlabsRouter from './routes/elevenlabs';
import { registerApkRoutes } from "./apk-routes";

const upload = multer({ storage: multer.memoryStorage() });

// Helper functions for smart list management
function isPaymentItem(itemName: string): boolean {
  const paymentKeywords = [
    'payment', 'pay', 'bill', 'invoice', 'contractor', 'vendor', 'service', 'rent', 'mortgage', 
    'utilities', 'subscription', 'fee', '$', 'dollar', 'cost', 'expense', 'owe', 'due', 'electric',
    'gas', 'water', 'internet', 'phone', 'insurance', 'taxes', 'credit card', 'loan', 'installment'
  ];
  return paymentKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
}

function isShoppingItem(itemName: string): boolean {
  const shoppingKeywords = [
    // Food items
    'milk', 'bread', 'cheese', 'meat', 'fruit', 'vegetable', 'grocery', 'food', 'snack', 'drink', 
    'pastrami', 'deli', 'produce', 'chocolate', 'candy', 'sugar', 'flour', 'eggs', 'butter',
    'coffee', 'tea', 'juice', 'soda', 'water', 'beer', 'wine', 'alcohol', 'cereal', 'pasta',
    'rice', 'beans', 'nuts', 'oil', 'spice', 'sauce', 'condiment', 'frozen', 'canned', 'fresh',
    'organic', 'apple', 'banana', 'orange', 'chicken', 'beef', 'fish', 'yogurt',
    // Shopping actions
    'buy', 'purchase', 'get', 'need', 'want', 'shop', 'store', 'shopping', 'groceries', 'grocery',
    'pick up', 'grab', 'supermarket', 'market'
  ];
  return shoppingKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
}

function isPunchListItem(itemName: string): boolean {
  const punchKeywords = ['fix', 'repair', 'install', 'paint', 'replace', 'maintenance', 'contractor', 'plumber', 'electrician'];
  return punchKeywords.some(keyword => itemName.includes(keyword));
}

function isWaitingListItem(itemName: string): boolean {
  const waitingKeywords = ['wait', 'queue', 'table', 'restaurant'];
  return waitingKeywords.some(keyword => itemName.includes(keyword));
}

// Helper function to calculate string similarity (fuzzy matching)
function calculateSimilarity(str1: string, str2: string): number {
  // Remove spaces and normalize
  const s1 = str1.replace(/\s+/g, '').toLowerCase();
  const s2 = str2.replace(/\s+/g, '').toLowerCase();
  
  // If one contains the other after space removal, high similarity
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Levenshtein distance calculation
  const matrix = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + indicator // substitution
      );
    }
  }
  
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1 : (maxLen - matrix[s1.length][s2.length]) / maxLen;
}

function isAppointmentItem(itemName: string): boolean {
  const appointmentKeywords = ['appointment', 'meeting', 'call', 'visit', 'consultation', 'dentist', 'doctor', 'interview'];
  return appointmentKeywords.some(keyword => itemName.includes(keyword));
}

function isBooksItem(itemName: string): boolean {
  const bookKeywords = ['book', 'read', 'novel', 'author', 'fiction', 'biography', 'textbook', 'manual', 'guide', 'literature'];
  return bookKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
}

function isMoviesItem(itemName: string): boolean {
  const movieKeywords = ['movie', 'film', 'watch', 'cinema', 'netflix', 'streaming', 'series', 'episode', 'documentary', 'show'];
  return movieKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
}

function isTravelItem(itemName: string): boolean {
  const travelKeywords = ['travel', 'trip', 'vacation', 'hotel', 'flight', 'destination', 'visit', 'tour', 'booking', 'reservation'];
  return travelKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
}

function isGiftsItem(itemName: string): boolean {
  const giftKeywords = ['gift', 'present', 'birthday', 'holiday', 'christmas', 'anniversary', 'wedding', 'graduation', 'baby shower'];
  return giftKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
}

// Profession-based automatic list creation
async function createProfessionLists(userId: string, profession: string) {
  const professionLower = profession.toLowerCase();
  
  const professionListsMap = {
    // Teachers & Education
    teacher: [
      { type: "shopping", name: "School Supplies", categories: ["Classroom Materials", "Art Supplies", "Office Supplies", "Educational Tools"] },
      { type: "todo", name: "Teaching Tasks", categories: ["Lesson Plans", "Grading", "Parent Meetings", "Professional Development"] },
      { type: "books", name: "Educational Reading", categories: ["Curriculum", "Teaching Methods", "Student Resources", "Professional Growth"] }
    ],
    educator: [
      { type: "shopping", name: "Educational Supplies", categories: ["Learning Materials", "Technology", "Books", "Equipment"] },
      { type: "todo", name: "Education Tasks", categories: ["Curriculum", "Assessment", "Training", "Administration"] }
    ],
    
    // Contractors & Construction
    contractor: [
      { type: "punch_list", name: "Project Punch List", categories: ["Electrical", "Plumbing", "Painting", "General", "Final Inspection"] },
      { type: "shopping", name: "Tools & Materials", categories: ["Hardware", "Tools", "Safety Equipment", "Supplies"] },
      { type: "todo", name: "Business Tasks", categories: ["Quotes", "Permits", "Scheduling", "Client Follow-up"] }
    ],
    builder: [
      { type: "punch_list", name: "Construction Tasks", categories: ["Foundation", "Framing", "Electrical", "Plumbing", "Finishing"] },
      { type: "shopping", name: "Building Materials", categories: ["Lumber", "Hardware", "Tools", "Safety Gear"] }
    ],
    
    // Real Estate
    realtor: [
      { type: "todo", name: "Real Estate Tasks", categories: ["Listings", "Showings", "Client Meetings", "Paperwork"] },
      { type: "travel", name: "Property Visits", categories: ["Open Houses", "Client Tours", "Inspections", "Appraisals"] },
      { type: "gifts", name: "Client Appreciation", categories: ["Closing Gifts", "Holiday Cards", "Referral Thanks", "New Home"] }
    ],
    
    // Healthcare
    doctor: [
      { type: "todo", name: "Patient Care", categories: ["Appointments", "Follow-ups", "Documentation", "Continuing Education"] },
      { type: "books", name: "Medical Reading", categories: ["Research", "Journals", "Guidelines", "Professional Development"] }
    ],
    nurse: [
      { type: "todo", name: "Nursing Tasks", categories: ["Patient Care", "Medications", "Documentation", "Training"] },
      { type: "shopping", name: "Medical Supplies", categories: ["Personal Protective Equipment", "Stethoscope", "Supplies", "Uniforms"] }
    ],
    
    // Technology
    developer: [
      { type: "todo", name: "Development Tasks", categories: ["Features", "Bug Fixes", "Testing", "Code Review"] },
      { type: "books", name: "Tech Reading", categories: ["Programming", "Architecture", "DevOps", "Industry Trends"] }
    ],
    programmer: [
      { type: "todo", name: "Programming Tasks", categories: ["Coding", "Debugging", "Documentation", "Learning"] },
      { type: "books", name: "Programming Books", categories: ["Languages", "Frameworks", "Best Practices", "Algorithms"] }
    ],
    
    // Creative & Design
    designer: [
      { type: "todo", name: "Design Projects", categories: ["Client Work", "Concepts", "Revisions", "Portfolio"] },
      { type: "shopping", name: "Design Supplies", categories: ["Software", "Hardware", "Inspiration", "Tools"] }
    ],
    
    // Business & Finance
    manager: [
      { type: "todo", name: "Management Tasks", categories: ["Team Meetings", "Reports", "Planning", "Reviews"] },
      { type: "books", name: "Leadership Reading", categories: ["Management", "Strategy", "Leadership", "Industry"] }
    ],
    
    // Sales & Marketing
    salesperson: [
      { type: "todo", name: "Sales Activities", categories: ["Leads", "Follow-ups", "Presentations", "Networking"] },
      { type: "travel", name: "Client Visits", categories: ["Meetings", "Conferences", "Trade Shows", "Presentations"] }
    ],
    
    // Food Service
    chef: [
      { type: "shopping", name: "Kitchen Supplies", categories: ["Ingredients", "Equipment", "Utensils", "Uniforms"] },
      { type: "todo", name: "Kitchen Tasks", categories: ["Menu Planning", "Prep Work", "Inventory", "Staff Training"] }
    ],
    cook: [
      { type: "shopping", name: "Cooking Supplies", categories: ["Ingredients", "Spices", "Tools", "Equipment"] },
      { type: "todo", name: "Meal Planning", categories: ["Recipes", "Prep", "Shopping", "Special Diets"] }
    ]
  };
  
  // Find matching profession (check for partial matches)
  let listsToCreate: any[] = [];
  for (const [prof, lists] of Object.entries(professionListsMap)) {
    if (professionLower.includes(prof) || prof.includes(professionLower)) {
      listsToCreate = lists;
      break;
    }
  }
  
  // If no specific profession match, create basic professional lists
  if (listsToCreate.length === 0) {
    listsToCreate = [
      { type: "todo", name: "Work Tasks", categories: ["Projects", "Meetings", "Deadlines", "Follow-ups"] },
      { type: "shopping", name: "Office Supplies", categories: ["Stationery", "Technology", "Equipment", "Supplies"] }
    ];
  }
  
  // Create the lists
  for (const listConfig of listsToCreate) {
    try {
      await storage.createSmartList({
        userId,
        name: listConfig.name,
        type: listConfig.type,
        categories: listConfig.categories,
        description: `Automatically created for ${profession}`,
        isShared: false
      });
      console.log(`✅ Created ${listConfig.type} list: ${listConfig.name}`);
    } catch (error) {
      console.error(`❌ Failed to create list ${listConfig.name}:`, error);
    }
  }
}

function getListConfig(type: string) {
  const configs = {
    shopping: {
      name: "Shopping List",
      type: "shopping" as const,
      categories: ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Beverages", "Household"]
    },
    punch_list: {
      name: "Punch List",
      type: "punch_list" as const,
      categories: ["Plumbing", "Electrical", "Painting", "Flooring", "HVAC", "Roofing", "General"]
    },
    waiting_list: {
      name: "Waiting List",
      type: "waiting_list" as const,
      categories: ["Restaurant", "Appointment", "Service", "Event"]
    },
    todo: {
      name: "To-Do List", 
      type: "todo" as const,
      categories: ["Work", "Personal", "Urgent", "Later"]
    },
    closing_list: {
      name: "Closing List",
      type: "closing_list" as const,
      categories: ["Inspection", "Financing", "Legal", "Insurance", "Documentation", "Final Walkthrough"]
    },
    patient_list: {
      name: "Patient Care List",
      type: "patient_list" as const,
      categories: ["Appointments", "Follow-ups", "Prescriptions", "Tests", "Consultations"]
    },
    case_list: {
      name: "Case Management",
      type: "case_list" as const,
      categories: ["Research", "Documentation", "Court Dates", "Client Meetings", "Filing"]
    },
    lesson_list: {
      name: "Teaching Tasks",
      type: "lesson_list" as const,
      categories: ["Lesson Plans", "Grading", "Parent Meetings", "Supplies", "Field Trips"]
    },
    menu_list: {
      name: "Kitchen/Menu Tasks",
      type: "menu_list" as const,
      categories: ["Ingredients", "Equipment", "Staff", "Menu Items", "Supplies", "Vendors"]
    },
    books: {
      name: "Reading List",
      type: "books" as const,
      categories: ["Fiction", "Non-Fiction", "Biographies", "Technical", "Self-Help", "To Read"]
    },
    movies: {
      name: "Movie Watchlist",
      type: "movies" as const,
      categories: ["Action", "Comedy", "Drama", "Sci-Fi", "Documentary", "To Watch"]
    },
    travel: {
      name: "Travel Plans",
      type: "travel" as const,
      categories: ["Destinations", "Hotels", "Activities", "Restaurants", "Packing", "Bookings"]
    },
    gifts: {
      name: "Gift Ideas",
      type: "gifts" as const,
      categories: ["Birthday", "Holiday", "Anniversary", "Wedding", "Baby Shower", "Graduation"]
    },
    payments: {
      name: "Payment Schedule",
      type: "payments" as const,
      categories: ["Bills", "Invoices", "Contractors", "Services", "Recurring"]
    },
    budget: {
      name: "Budget Tracker",
      type: "budget" as const,
      categories: ["Housing", "Transportation", "Food", "Utilities", "Entertainment", "Healthcare"]
    }
  };
  
  return configs[type as keyof typeof configs] || configs.shopping;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add JSON parsing middleware for non-multipart routes
  const jsonParser = express.json();
  const urlencodedParser = express.urlencoded({ extended: false });
  
  // Version endpoint for debugging deployment
  app.get('/api/version', (req, res) => {
    console.log('🔍 Version check requested');
    res.json({ 
      version: '1.0.55',
      buildDate: new Date().toISOString(),
      buildTime: Date.now(),
      features: {
        sms: 'Hash routing fix',
        camera: 'Integrated in chat',
        vision: 'AI-powered item identification', 
        mic: 'Permission handling added',
        theme: 'Purple gradient - orange removed',
        deployment: 'Fresh build with SDK 35'
      }
    });
  });
  
  // CRITICAL: Direct ZIP download route (bypass static middleware issues)
  app.get('/download-package/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.resolve(__dirname, '..', 'public', filename);
    
    console.log(`📦 Direct package download: ${filename}`);
    console.log(`📁 File path: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Package not found: ${filePath}`);
      return res.status(404).json({ error: 'Package not found' });
    }
    
    const stat = fs.statSync(filePath);
    console.log(`📊 Package size: ${stat.size} bytes`);
    
    // Force download with proper headers
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Stream the file directly
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
    
    readStream.on('error', (err) => {
      console.error('❌ Package stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
    
    readStream.on('end', () => {
      console.log(`✅ Package download completed: ${filename} (${stat.size} bytes)`);
    });
  });
  console.log('🔧 Registering application routes...');
  
  // Add mobile auth callback route
  addMobileAuthRoute(app);
  
  // NOTE: OAuth routes are handled in auth.ts via Passport.js - no duplicate routes here

  // Static file download route for public folder
  app.get("/public/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'public', filename);
    
    console.log(`📁 File download request for: ${filename}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return res.status(404).json({ 
        error: "File not found",
        message: `The requested file ${filename} is not available.`
      });
    }
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.zip') {
      contentType = 'application/zip';
    } else if (ext === '.apk') {
      contentType = 'application/vnd.android.package-archive';
    } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      contentType = `image/${ext.substring(1)}`;
    }
    
    // Set proper headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    console.log(`✅ Serving file: ${filename} (${contentType})`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('File download error:', err);
      res.status(500).json({ error: "File download failed" });
    });
  });
  
  // VoltBuilder package download endpoint (legacy route for compatibility)
  app.get("/download/voltbuilder", (req, res) => {
    const filePath = path.join(__dirname, '..', 'public', 'gabai-voltbuilder-FINAL.zip');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: "VoltBuilder package not found",
        message: "The APK build package is not available. Please rebuild the package first."
      });
    }
    
    // Set proper headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="gabai-voltbuilder-FINAL.zip"');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('File download error:', err);
      res.status(500).json({ error: "File download failed" });
    });
  });

  // Firebase-enabled VoltBuilder package download endpoint (stable crash-resistant version)
  app.get("/download/voltbuilder-firebase", (req, res) => {
    const filePath = path.join(__dirname, '..', 'public', 'gabai-mobile-NATIVE-FIREBASE.zip');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: "Firebase VoltBuilder package not found",
        message: "The Firebase-enabled APK build package is not available."
      });
    }
    
    // Set proper headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="gabai-mobile-NATIVE-FIREBASE.zip"');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('Firebase package download error:', err);
      res.status(500).json({ error: "File download failed" });
    });
  });

  // Auth check endpoint (using Passport.js session data)

  app.get("/api/auth/user", async (req, res) => {
    try {
      console.log('🔍 Auth check - Session auth:', req.isAuthenticated?.());
      console.log('🔍 Auth check - Bearer token:', req.headers.authorization ? 'Present' : 'None');
      console.log('🍪 Auth check - Cookies:', req.cookies);
      console.log('🍪 Auth check - gabai_token cookie:', req.cookies?.gabai_token ? 'Present' : 'None');
      
      // First try Bearer token authentication (for SMS/mobile users)
      // Check both Authorization header AND cookies
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.gabai_token;
      
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
        console.log('🔑 Token found in Authorization header');
      } else if (cookieToken) {
        token = cookieToken;
        console.log('🍪 Token found in cookie:', cookieToken.substring(0, 20) + '...');
      }
      
      if (token) {
        try {
          console.log('🔑 Decoding Bearer token for SMS user');
          
          // Decode the Base64 token (same format as SMS verification creates)
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
          const { userId, timestamp, phone, authMethod } = decoded;
          
          if (!userId) {
            console.log('❌ Invalid Bearer token: missing userId');
            return res.status(401).json({ message: "Invalid token" });
          }
          
          // CRITICAL: Enforce strict token expiry for SMS auth (24 hours max)
          const tokenAge = Date.now() - timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours - force re-authentication daily
          if (tokenAge > maxAge) {
            console.log('❌ Bearer token expired - must re-authenticate via SMS');
            // Clear the expired token from cookies
            res.clearCookie('gabai_token');
            return res.status(401).json({ message: "Session expired. Please sign in again with SMS." });
          }
          
          // Get user from database
          const user = await storage.getUser(userId);
          if (!user) {
            console.log('❌ Bearer token user not found:', userId);
            return res.status(401).json({ message: "User not found" });
          }
          
          // Validate that this is a phone-verified user (not a demo/test user)
          // Must have either phone in token OR authMethod = 'sms' for new tokens
          if (authMethod !== 'sms' && !(user as any).phone && !phone) {
            console.log('❌ Token does not have valid SMS authentication');
            return res.status(401).json({ message: "SMS authentication required. Please sign in with your phone number." });
          }
          
          console.log('✅ User authenticated via Bearer token:', (user as any).email || (user as any).phone);
          return res.json(user);
        } catch (tokenError) {
          console.error('❌ Bearer token decode error:', tokenError);
          return res.status(401).json({ message: "Invalid token format" });
        }
      }
      
      // Fallback to Passport session authentication
      console.log('🔍 Checking Passport session auth...');
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        console.log('❌ No valid authentication found');
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Passport.js stores the user in req.user after deserialization
      const user = req.user as any;
      console.log('✅ User authenticated via Passport session:', user.email);
      res.json(user);
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  // Native Firebase authentication endpoint for mobile apps
  app.post("/api/auth/native-login", jsonParser, async (req, res) => {
    try {
      const { id, email, name, avatar } = req.body;
      
      if (!id || !email || !name) {
        return res.status(400).json({ error: "User ID, email, and name are required" });
      }

      console.log('🔥 Native Firebase login for user:', email);

      // Create or get user with Firebase ID
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          email,
          name,
        });
        console.log('✅ Created new user from native Firebase auth');
      } else {
        console.log('✅ Found existing user from native Firebase auth');
      }

      // Set up session properly
      (req.session as any).passport = { user: user.id };
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res.status(500).json({ error: "Session creation failed" });
        }
        console.log('✅ Native Firebase session created');
        res.json({ user, message: "Native authentication successful" });
      });
    } catch (error) {
      console.error("❌ Native Firebase login error:", error);
      res.status(500).json({ error: "Native authentication failed" });
    }
  });

  // Simple login endpoint (dev/testing only)
  app.post("/api/simple-login", jsonParser, async (req, res) => {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ message: "Not available in production" });
    }
    
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          name: name.trim(),
          email: email.trim(),
          preferences: {},
          onboardingCompleted: false
        });
      }

      // Login user using Passport (simulate OAuth)
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ user, message: "Login successful" });
      });
    } catch (error: any) {
      console.error("Simple login error:", error);
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  });

  // Firebase authentication endpoint
  app.post("/api/auth/firebase-login", jsonParser, async (req, res) => {
    try {
      console.log('🔥 Firebase login request received');
      const { uid, email, name, photoURL } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ error: 'Missing required Firebase user data' });
      }
      
      console.log('🔍 Firebase user:', { uid, email, name });
      
      // Check if user exists by email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log('➕ Creating new user from Firebase data');
        user = await storage.createUser({
          name: name || 'User',
          email: email,
          preferences: {},
          onboardingCompleted: false
        });
        console.log('✅ New user created:', user.id);
      } else {
        console.log('✅ Existing user found:', user.id);
      }
      
      // Login user using Passport session
      req.logIn(user, (err) => {
        if (err) {
          console.error('❌ Firebase login session error:', err);
          return res.status(500).json({ error: 'Session creation failed' });
        }
        
        console.log('✅ Firebase user logged in successfully:', user.id);
        res.json({ 
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            preferences: user.preferences,
            onboardingCompleted: user.onboardingCompleted
          }
        });
      });
      
    } catch (error: any) {
      console.error('❌ Firebase login error:', error);
      res.status(500).json({ error: 'Firebase login failed', message: error.message });
    }
  });

  // Mobile authentication endpoint - sends secure magic link
  app.post('/api/auth/mobile-login', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email required' });
      }
      
      console.log('📧 Magic link request for:', email);
      
      // Generate secure token
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const deviceFingerprint = req.headers['user-agent'] || 'Unknown device';
      
      // Store the token
      console.log('💾 Attempting to store magic link token for:', email);
      try {
        await storage.createMagicLinkToken({
          email,
          token,
          used: false,
          expiresAt,
          deviceFingerprint
        });
        console.log('✅ Magic link token stored successfully');
      } catch (tokenError) {
        console.error('❌ Failed to store magic link token:', tokenError);
        throw new Error('Failed to store authentication token');
      }
      
      // Send magic link email with current host
      const requestHost = req.get('host');
      const emailResult = await sendMagicLink(email, token, deviceFingerprint, requestHost);
      
      if (emailResult.success) {
        console.log('✅ Magic link sent successfully to:', email);
        res.json({ 
          success: true, 
          message: 'Magic link sent! Check your email to sign in.',
          email: email,
          devMode: emailResult.devMode,
          magicLink: emailResult.magicLink,
          backupCode: emailResult.backupCode
        });
      } else {
        console.error('❌ Failed to send magic link:', emailResult.error);
        res.status(500).json({ error: 'Failed to send magic link. Please try again.' });
      }
      
    } catch (error) {
      console.error('❌ Magic link creation error:', error);
      res.status(500).json({ error: 'Failed to send magic link. Please try again.' });
    }
  });

  // SMS authentication endpoint - sends magic link via SMS
  app.post('/api/auth/sms-login', jsonParser, async (req, res) => {
    try {
      const { phone, name } = req.body;
      
      if (!phone || phone.length < 10) {
        return res.status(400).json({ error: 'Valid phone number required' });
      }
      
      console.log('📱 SMS magic link request for:', phone);
      
      // Generate secure token
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const deviceFingerprint = req.headers['user-agent'] || 'Unknown device';
      
      // Use phone as identifier in database
      const email = `${phone.replace(/[^\d]/g, '')}@sms.gabaiapp.com`; // Convert phone to email format for storage
      
      // Store the token
      console.log('💾 Attempting to store SMS magic link token for:', phone);
      try {
        await storage.createMagicLinkToken({
          email,
          token,
          used: false,
          expiresAt,
          deviceFingerprint
        });
        console.log('✅ SMS magic link token stored successfully');
      } catch (tokenError) {
        console.error('❌ Failed to store SMS magic link token:', tokenError);
        throw new Error('Failed to store authentication token');
      }
      
      // Send magic link SMS with current host
      const requestHost = req.get('host');
      const smsResult = await sendMagicLinkSMS(phone, token, deviceFingerprint, requestHost);
      
      if (smsResult.success) {
        console.log('✅ Magic link SMS sent successfully to:', phone);
        res.json({ 
          success: true, 
          message: 'Magic link sent! Check your text messages to sign in.',
          phone: phone,
          devMode: smsResult.devMode,
          magicLink: smsResult.magicLink,
          backupCode: smsResult.backupCode
        });
      } else {
        console.error('❌ Failed to send magic link SMS:', smsResult.error);
        res.status(500).json({ error: 'Failed to send SMS. Please try again.' });
      }
      
    } catch (error) {
      console.error('❌ SMS magic link creation error:', error);
      res.status(500).json({ error: 'Failed to send SMS. Please try again.' });
    }
  });

  // SMS verification code endpoint - sends short code via SMS
  app.post('/api/auth/sms-code', jsonParser, async (req, res) => {
    console.log('🔍 SMS Code Endpoint Hit (legacy)!', {
      method: req.method,
      url: req.url,
      body: req.body,
      contentType: req.headers['content-type']
    });
    
    try {
      const { phone } = req.body;
      
      if (!phone || phone.length < 10) {
        console.log('❌ Invalid phone number:', phone);
        return res.status(400).json({ error: 'Valid phone number required' });
      }
      
      console.log('📱 SMS verification code request for:', phone);
      
      // Use the proper SMS send verification endpoint
      const smsResult = await sendCodeSMS(phone);
      
      if (smsResult.success) {
        console.log('✅ Verification code SMS sent successfully to:', phone);
        
        // Store phone number in session for fallback verification
        const normalizedPhone = phone.replace(/[^\d+]/g, '');
        res.cookie('last_sms_phone', normalizedPhone, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 10 * 60 * 1000 // 10 minutes
        });
        
        if (req.session) {
          (req.session as any).lastPhoneNumber = normalizedPhone;
        }
        
        res.json({ 
          success: true, 
          message: 'Verification code sent! Check your text messages.',
          phone: phone,
          verificationSid: smsResult.verificationSid,  // Include verificationSid
          devMode: smsResult.devMode,
          backupCode: smsResult.backupCode
        });
      } else {
        console.error('❌ Failed to send verification code SMS:', smsResult.error);
        res.status(500).json({ error: 'Failed to send SMS. Please try again.' });
      }
      
    } catch (error) {
      console.error('❌ SMS verification code creation error:', error);
      res.status(500).json({ error: 'Failed to send SMS. Please try again.' });
    }
  });


  // Link phone number to existing account
  app.post('/api/auth/link-phone', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const { phone } = req.body;
      
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ error: 'Phone number is required' });
      }
      
      // Clean phone number (remove non-digits)
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Update user's phone number
      await storage.updateUser((req.user as any).id, { phone: cleanPhone });
      
      console.log('✅ Phone number linked to account:', (req.user as any).email, cleanPhone);
      
      res.json({ 
        success: true, 
        message: 'Phone number linked to your account',
        phone: cleanPhone
      });
    } catch (error) {
      console.error('❌ Phone linking error:', error);
      res.status(500).json({ error: 'Failed to link phone number' });
    }
  });

  // Save SMS consent to user preferences
  app.post('/api/auth/sms-consent', jsonParser, async (req, res) => {
    try {
      console.log('📝 SMS consent request received');
      
      let userId = null;
      
      // First try Bearer token authentication (for SMS/mobile users)
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.gabai_token;
      
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
        console.log('🔑 SMS consent: Token found in Authorization header');
      } else if (cookieToken) {
        token = cookieToken;
        console.log('🍪 SMS consent: Token found in cookie');
      }
      
      if (token) {
        try {
          console.log('🔑 Decoding Bearer token for SMS consent');
          
          // Decode the Base64 token (same format as SMS verification creates)
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
          const { userId: tokenUserId, timestamp } = decoded;
          
          if (!tokenUserId) {
            console.log('❌ Invalid Bearer token: missing userId');
            return res.status(401).json({ error: 'Invalid token' });
          }
          
          // Check token age (optional - tokens don't expire for now)
          const tokenAge = Date.now() - timestamp;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          if (tokenAge > maxAge) {
            console.log('❌ Bearer token expired');
            return res.status(401).json({ error: 'Token expired' });
          }
          
          userId = tokenUserId;
          console.log('✅ SMS consent: User authenticated via Bearer token:', userId);
        } catch (tokenError) {
          console.error('❌ Bearer token decode error:', tokenError);
          return res.status(401).json({ error: 'Invalid token format' });
        }
      }
      
      // Fallback to session-based authentication
      if (!userId && req.user) {
        userId = (req.user as any).id;
        console.log('✅ SMS consent: User authenticated via session:', userId);
      }
      
      // Check if user is authenticated via any method
      if (!userId) {
        console.log('❌ SMS consent: No valid authentication found');
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const { consent, phone } = req.body;
      
      // Get current user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update preferences with SMS consent
      const updatedPreferences = {
        ...(user.preferences || {}),
        smsConsent: consent === true,
        smsConsentDate: consent ? new Date().toISOString() : null,
        smsConsentPhone: consent ? phone : null
      };
      
      // Also update phone number if provided
      const updateData: any = { preferences: updatedPreferences };
      if (phone) {
        updateData.phone = phone.replace(/\D/g, ''); // Clean phone number
      }
      
      await storage.updateUser(userId, updateData);
      
      console.log(`✅ SMS consent ${consent ? 'granted' : 'revoked'} for user:`, userId);
      
      res.json({ 
        success: true, 
        message: consent ? 'SMS consent granted' : 'SMS consent revoked',
        consent
      });
    } catch (error) {
      console.error('❌ SMS consent update error:', error);
      res.status(500).json({ error: 'Failed to update SMS consent' });
    }
  });

  // Debug endpoint to test database connection
  app.get('/api/auth/debug-tokens', async (req, res) => {
    try {
      const tokens = await storage.getAllMagicLinkTokens();
      res.json({ tokens, count: tokens.length });
    } catch (error) {
      console.error('Debug tokens error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // POST endpoint to send magic link via email
  app.post('/api/auth/magic-link', async (req, res) => {
    try {
      const { email } = req.body;
      
      console.log('📧 Magic link request for:', email);
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Generate a secure token
      const token = nanoid();
      
      // Get device fingerprint for security
      const deviceFingerprint = req.get('user-agent') || 'unknown';
      
      // Store token in database with 15-minute expiry
      await storage.createMagicLinkToken({
        email,
        token,
        used: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        deviceFingerprint
      });
      
      console.log('✅ Magic link token created');
      
      // Send email with magic link
      const emailResult = await sendMagicLink(email, token, deviceFingerprint);
      
      // Check if we have fallback data (devMode provides magic link even on failure)
      if (emailResult.magicLink && emailResult.backupCode) {
        console.log(emailResult.success ? '✅ Magic link email sent successfully to:' : '⚠️ Email service unavailable for:', email);
        res.json({ 
          success: true, 
          message: emailResult.success ? 'Magic link sent! Check your email.' : 'Development mode - check console for link',
          devMode: true,
          magicLink: emailResult.magicLink,
          backupCode: emailResult.backupCode
        });
      } else if (emailResult.success) {
        // Production mode success
        console.log('✅ Magic link email sent successfully to:', email);
        res.json({ 
          success: true, 
          message: 'Magic link sent! Check your email.',
          devMode: false
        });
      } else {
        throw new Error(emailResult.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('❌ Magic link error:', error);
      res.status(500).json({ error: 'Failed to send magic link. Please try again.' });
    }
  });

  // GET endpoint for magic link verification (when clicking the link)
  app.get('/api/auth/magic-link', async (req, res) => {
    try {
      const { token } = req.query;
      
      console.log('🔗 Magic link verification attempt:', token);
      
      if (!token || typeof token !== 'string') {
        console.log('❌ Invalid token format');
        return res.status(400).json({ error: 'Invalid magic link' });
      }
      
      // Get the token
      const magicToken = await storage.getMagicLinkToken(token);
      console.log('🔍 Database search result:', magicToken ? 'FOUND' : 'NOT FOUND');
      
      if (!magicToken) {
        console.log('❌ Token not found in database');
        return res.status(400).json({ error: 'Invalid or expired magic link' });
      }
      
      // Check if token is expired
      if (new Date() > magicToken.expiresAt) {
        console.log('❌ Token expired');
        return res.status(400).json({ error: 'Magic link has expired' });
      }
      
      // Check if already used
      if (magicToken.used) {
        console.log('❌ Token already used');
        return res.status(400).json({ error: 'Magic link already used' });
      }
      
      // Mark token as used
      await storage.useMagicLinkToken(token);
      
      // Find or create user
      let user = await storage.getUserByEmail(magicToken.email);
      
      if (!user) {
        console.log('➕ Creating new user:', magicToken.email);
        
        // Check if this is an SMS user (phone number based)
        const isSMSUser = magicToken.email.includes('@sms.gabaiapp.com');
        let userName: string;
        let actualEmail: string;
        
        if (isSMSUser) {
          // Extract phone number from email format
          const phoneNumber = magicToken.email.replace('@sms.gabaiapp.com', '');
          userName = `SMS User ${phoneNumber.slice(-4)}`; // Last 4 digits for display
          actualEmail = magicToken.email; // Keep the SMS format for consistency
        } else {
          userName = magicToken.email.split('@')[0];
          actualEmail = magicToken.email;
        }
        
        user = await storage.createUser({
          name: userName,
          email: actualEmail,
          preferences: {},
          onboardingCompleted: false
        });
      }
      
      console.log('✅ Magic link authentication successful for:', user.email);
      
      // Create session with explicit serialization
      console.log('🔑 Creating session for user:', user.id, user.email);
      req.login(user, (err) => {
        if (err) {
          console.error('❌ Session creation failed:', err);
          return res.status(500).json({ error: 'Session creation failed' });
        }
        
        console.log('✅ Session created successfully');
        console.log('🆔 Session ID:', req.sessionID);
        console.log('👤 Authenticated user:', (req.user as any)?.id);
        console.log('🍪 Session cookie will be set');
        
        // Check if this is a mobile app request
        const isMobile = req.query.mobile === 'true' || 
                        req.headers['user-agent']?.includes('wv') ||
                        req.headers['user-agent']?.includes('Replit-Bonsai');
        
        if (isMobile) {
          // For mobile apps, return a success page that can close itself
          const successPage = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Sign-in Successful</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 40px 20px; 
                  background: #f8f9fa;
                  margin: 0;
                }
                .success-container {
                  max-width: 400px;
                  margin: 0 auto;
                  background: white;
                  padding: 40px;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .checkmark {
                  width: 60px;
                  height: 60px;
                  background: #4CAF50;
                  border-radius: 50%;
                  margin: 0 auto 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                h1 { color: #333; margin-bottom: 10px; }
                p { color: #666; margin-bottom: 20px; }
                .close-btn {
                  background: #4285f4;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 6px;
                  font-size: 16px;
                  cursor: pointer;
                }
              </style>
            </head>
            <body>
              <div class="success-container">
                <div class="checkmark">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <h1>Welcome to GabAi!</h1>
                <p>You've successfully signed in. Return to the app to continue.</p>
                <button class="close-btn" onclick="closeWindow()">Return to App</button>
              </div>
              <script>
                function closeWindow() {
                  // For mobile apps, use custom scheme or direct redirect
                  try {
                    // Try custom URL scheme first (if configured)
                    if (window.location.href.includes('replit.dev') || window.location.href.includes('repl.co')) {
                      // Direct redirect within same origin
                      window.location.replace('${user.onboardingCompleted ? '/' : '/onboarding'}');
                    } else if (window.opener) {
                      window.opener.location.reload();
                      window.close();
                    } else {
                      // Fallback: redirect to main app
                      window.location.replace('${user.onboardingCompleted ? '/' : '/onboarding'}');
                    }
                  } catch (e) {
                    // Fallback: redirect to main app
                    window.location.replace('${user.onboardingCompleted ? '/' : '/onboarding'}');
                  }
                }
                
                // Auto-redirect immediately for better UX
                setTimeout(() => {
                  closeWindow();
                }, 1500);
              </script>
            </body>
            </html>
          `;
          return res.send(successPage);
        } else {
          // For web browsers, normal redirect
          const redirectUrl = user.onboardingCompleted ? '/' : '/onboarding';
          console.log('🔄 Redirecting to:', redirectUrl);
          res.redirect(redirectUrl);
        }
      });
      
    } catch (error) {
      console.error('❌ Magic link error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Magic link verification endpoint (JSON response for mobile apps)
  app.post('/api/auth/verify-magic-token', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid magic link token' });
      }
      
      console.log('🔗 Magic token verification attempt:', token.slice(0, 8) + '...');
      
      // Check if this is a 6-character backup code
      let magicToken;
      if (token.length === 6) {
        // This is a backup code - find token by backup code
        console.log('🔑 Looking for token by backup code:', token);
        const allTokens = await storage.getAllMagicLinkTokens();
        magicToken = allTokens.find(t => 
          !t.used && 
          new Date() <= t.expiresAt && 
          t.token.slice(-6).toUpperCase() === token.toUpperCase()
        );
      } else {
        // This is a full token
        magicToken = await storage.getMagicLinkToken(token);
      }
      
      if (!magicToken) {
        console.log('❌ Token not found');
        return res.status(400).json({ success: false, error: 'Invalid or expired magic link' });
      }
      
      // Check if token is expired or already used
      if (magicToken.used || new Date() > magicToken.expiresAt) {
        console.log('❌ Token expired or already used');
        return res.status(400).json({ success: false, error: 'Magic link has expired or already been used' });
      }
      
      // Mark token as used - use the actual token (not just the backup code)
      await storage.useMagicLinkToken(magicToken.token);
      
      // Find existing user by email (including Gmail OAuth users)  
      let user = await storage.getUserByEmail(magicToken.email);
      
      // Special case: if requesting magic link for jack@symcousa.com, use the account with actual data (mobile@gabai.app)
      if (!user && magicToken.email === 'jack@symcousa.com') {
        console.log('🔄 Linking jack@symcousa.com to existing account with conversation data');
        user = await storage.getUserByEmail('mobile@gabai.app');
      }
      
      if (!user) {
        console.log('➕ Creating new user from magic token:', magicToken.email);
        // Use the name from the magic link request if available, otherwise extract from email
        const userName = magicToken.email === 'jack@symcousa.com' ? 'Jack' : magicToken.email.split('@')[0];
        user = await storage.createUser({
          name: userName,
          email: magicToken.email,
          preferences: {},
          onboardingCompleted: false
        });
      }
      
      // Create session
      req.login(user, (err) => {
        if (err) {
          console.error('❌ Session creation failed:', err);
          return res.status(500).json({ success: false, error: 'Session creation failed' });
        }
        
        console.log('✅ Magic token authentication successful:', user.id);
        
        // Return success response with redirect info
        res.json({ 
          success: true, 
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            onboardingCompleted: user.onboardingCompleted
          },
          redirectTo: user.onboardingCompleted ? '/' : '/onboarding'
        });
      });
      
    } catch (error) {
      console.error('❌ Magic token verification error:', error);
      res.status(500).json({ success: false, error: 'Authentication failed' });
    }
  });

  // Mobile OAuth redirect endpoint for VoltBuilder APKs  
  app.get("/api/auth/mobile-google", (req, res) => {
    console.log('📱 Mobile Google OAuth requested');
    console.log('🔍 User Agent:', req.headers['user-agent']);
    
    // For mobile apps, redirect to Google OAuth with mobile-specific parameters
    const authUrl = `/api/auth/google?mobile=true&redirect_after_auth=true`;
    console.log('🔄 Redirecting mobile user to Google OAuth:', authUrl);
    res.redirect(authUrl);
  });

  // Mobile APK bypass authentication - auto-login for WebView users
  app.post("/api/auth/mobile-bypass", jsonParser, async (req, res) => {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const hasWebView = /wv/i.test(userAgent);
      
      if (!hasWebView) {
        return res.status(400).json({ error: 'Not a WebView environment' });
      }
      
      console.log('📱 APK auto-login requested for WebView user');
      
      // Create or get demo user for APK
      const demoEmail = 'apk-user@gabai.demo';
      let user = await storage.getUserByEmail(demoEmail);
      
      if (!user) {
        console.log('👤 Creating user for mobile app');
        user = await storage.createUser({
          name: 'APK Demo User',
          email: demoEmail,
          preferences: { language: 'en', theme: 'light' },
          onboardingCompleted: true
        });
      }
      
      // Log user in using session
      req.logIn(user, (err) => {
        if (err) {
          console.error('❌ APK bypass login session error:', err);
          return res.status(500).json({ error: 'Session creation failed' });
        }
        
        console.log('✅ Mobile user logged in successfully:', user.id);
        res.json({ 
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            preferences: user.preferences,
            onboardingCompleted: user.onboardingCompleted
          }
        });
      });
      
    } catch (error: any) {
      console.error('❌ Mobile bypass error:', error);
      res.status(500).json({ error: 'APK authentication failed', message: error.message });
    }
  });

  // Simple email/password authentication routes
  app.post("/api/auth/register", jsonParser, async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      
      // Create new user
      const userData = {
        email,
        password, // In production, you'd hash this password
        name: name || email.split('@')[0],
        preferences: {},
        onboardingCompleted: false
      };
      
      const user = await storage.createUser(userData);
      console.log('✅ User registered:', user.email);
      
      // Log user in
      req.logIn(user, (err) => {
        if (err) {
          console.error('❌ Login after registration failed:', err);
          return res.status(500).json({ error: 'Registration successful but login failed' });
        }
        
        res.json({ 
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            preferences: user.preferences,
            onboardingCompleted: user.onboardingCompleted
          }
        });
      });
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ error: 'Registration failed', message: error.message });
    }
  });

  app.post("/api/auth/login", jsonParser, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Check password (in production, you'd compare hashed passwords)
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      console.log('✅ User logged in:', user.email);
      
      // Log user in
      req.logIn(user, (err) => {
        if (err) {
          console.error('❌ Login session error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }
        
        res.json({ 
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            preferences: user.preferences,
            onboardingCompleted: user.onboardingCompleted
          }
        });
      });
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      res.status(500).json({ error: 'Login failed', message: error.message });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Session destroy failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    });
  });


  // SMS verification routes
  app.post("/api/sms/send-verification", jsonParser, async (req, res) => {
    console.log('\n📱📱📱 SMS VERIFICATION REQUEST STARTED 📱📱📱');
    console.log('📱 Request headers:', req.headers);
    console.log('📱 Request body:', req.body);
    console.log('📱 Request method:', req.method);
    console.log('📱 Request URL:', req.url);
    
    try {
      // Parse body if it's a string
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
          console.log('📱 Parsed string body to JSON:', body);
        } catch (e) {
          console.error('❌ Failed to parse JSON body:', e);
          return res.status(400).json({ error: "Invalid JSON in request body" });
        }
      }
      
      // Accept multiple phone field names: phoneNumber, phone, or to
      const phoneNumber = body.phoneNumber || body.phone || body.to;
      
      console.log('📱 Extracted phone from request (checked phoneNumber, phone, to):', phoneNumber);
      
      if (!phoneNumber) {
        console.error('❌ Phone number missing in request');
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      // Normalize phone number to E.164 format for Twilio (handles 10-digit US numbers)
      console.log('📱 Calling normalizePhoneNumber with:', phoneNumber);
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      console.log('📱 API received phone:', phoneNumber, '-> normalized to:', normalizedPhone);
      
      // Basic phone number validation (bypass for test numbers)
      const cleanPhone = normalizedPhone.replace(/[^\d+]/g, '');
      const isTestNumber = /5555?5/.test(cleanPhone);
      
      if (!isTestNumber && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
        return res.status(400).json({ 
          error: "Invalid phone number format",
          details: "Please enter a valid phone number with country code (e.g., +1234567890)"
        });
      }
      
      // Check for voice fallback option (ChatGPT recommended)
      const channel = body.channel || 'sms'; // Default to SMS, allow 'call' for voice
      
      // Send SMS using Twilio Verify (with properly formatted phone number)
      console.log('📱 Calling sendCodeSMS with normalized phone:', normalizedPhone, 'channel:', channel);
      const result = await sendCodeSMS(normalizedPhone, undefined, channel as 'sms' | 'call');
      console.log('📱 sendCodeSMS result:', result);
      
      if (result.success) {
        console.log('✅ SMS sent successfully');
        
        // Log whether using Twilio Verify or regular SMS
        if (result.verificationSid && result.verificationSid.startsWith('VE')) {
          console.log('✅ Using Twilio Verify (from SMS Verify) - SID:', result.verificationSid);
        } else if (result.messageId && result.messageId.startsWith('SM')) {
          console.log('⚠️ Using regular SMS (from 888 number) - MessageId:', result.messageId);
        }
        
        // Store normalized phone number in cookie for verification fallback
        const normalizedPhoneForCookie = normalizedPhone.replace(/[^\d+]/g, '');
        res.cookie('last_sms_phone', normalizedPhone, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 10 * 60 * 1000 // 10 minutes
        });
        
        // Also store in session if available
        if (req.session) {
          req.session.lastPhoneNumber = normalizedPhone;
        }
        
        console.log('🍪 Set last_sms_phone cookie:', normalizedPhone);
        
        const response = { 
          success: true, 
          message: "Verification code sent",
          phone: normalizedPhone,  // Include phone in response
          devMode: result.devMode,
          messageId: result.messageId,
          verificationSid: result.verificationSid,
          backupCode: result.backupCode,  // Include backup code if in dev mode
          // Add method for debugging (ChatGPT recommended)
          method: result.verificationSid?.startsWith('VE') ? 'twilio_verify' : 'regular_sms'
        };
        console.log('📱 Sending JSON response:', response);
        res.json(response);
        console.log('✅ Response sent successfully');
      } else {
        console.error('❌ SMS send failed:', result);
        // Check for specific Twilio error codes
        const errorMessage = result.error || "Failed to send SMS";
        console.log('❌ Error message:', errorMessage);
        const isInvalidNumber = errorMessage.includes("Invalid parameter") || 
                               errorMessage.includes("60200") ||
                               errorMessage.includes("not a valid phone number");
        const isRateLimited = errorMessage.includes("Max attempts reached") ||
                             errorMessage.includes("60203") ||
                             errorMessage.includes("rate") ||
                             errorMessage.includes("too many");
        
        if (isRateLimited) {
          res.status(429).json({ 
            error: "Too many attempts",
            details: "You've reached the maximum verification attempts. Please wait 10 minutes before trying again.",
            devMode: result.devMode
          });
        } else if (isInvalidNumber) {
          res.status(400).json({ 
            error: "Invalid phone number",
            details: "Please enter a valid phone number with country code",
            devMode: result.devMode
          });
        } else {
          res.status(500).json({ 
            error: "Failed to send SMS",
            details: result.error,
            devMode: result.devMode
          });
        }
      }
    } catch (error: any) {
      console.error("❌ Send verification SMS error:", error);
      console.error("❌ Error stack:", error.stack);
      const errorResponse = { error: "Failed to send verification code", details: error.message };
      console.log('❌ Sending error response:', errorResponse);
      res.status(500).json(errorResponse);
    } finally {
      console.log('📱📱📱 SMS VERIFICATION REQUEST COMPLETED 📱📱📱\n');
    }
  });

  app.post("/api/sms/verify-code", jsonParser, async (req, res) => {
    try {
      // Parse body tolerantly - handle JSON, form-encoded, or missing Content-Type
      let body = req.body || {};
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.log('📱 Failed to parse body as JSON, using as-is');
        }
      }
      
      console.log('📱 SMS verification request received:', {
        body,
        cookies: req.cookies,
        contentType: req.headers['content-type']
      });
      
      // Accept both "phone" and "phoneNumber" fields (ChatGPT fix)
      const phone = body.phone || body.phoneNumber || 
                    req.cookies?.last_sms_phone || 
                    req.session?.lastPhoneNumber;
      const code = body.code;
      const verificationSid = body.verificationSid;
      const createAccount = body.createAccount !== false; // Default to true
      
      console.log('📱 Resolved phone number:', phone, 'from:', 
        body.phone ? 'body.phone' : 
        body.phoneNumber ? 'body.phoneNumber' : 
        req.cookies?.last_sms_phone ? 'cookie' : 
        req.session?.lastPhoneNumber ? 'session' : 'none');
      
      // Validate inputs
      if (!code || typeof code !== 'string') {
        console.log('❌ Missing or invalid code');
        return res.status(400).json({ 
          success: false,
          error: "Verification code is required",
          details: "Please enter the 6-digit code from your SMS" 
        });
      }
      
      // Clean the code
      const cleanCode = code.replace(/\D/g, '').trim();
      
      if (!verificationSid && !phone) {
        console.log('❌ Cannot verify: no verificationSid or phone number available');
        return res.status(400).json({ 
          success: false,
          error: "Unable to verify code",
          details: "Please request a new code" 
        });
      }
      
      // Handle verification
      let verification;
      
      if (verificationSid) {
        // New method: Try to get phone number for verification
        console.log('📱 Verifying with verificationSid (need phone):', verificationSid);
        // Get phone from request body or cookies
        const phoneForVerify = body.phoneNumber || body.phone || req.cookies?.last_sms_phone;
        if (phoneForVerify) {
          console.log('📱 Using phone for verification:', phoneForVerify);
          verification = await verifyCodeSMS(phoneForVerify, cleanCode);
        } else {
          // No phone number available for verification
          verification = { 
            success: false, 
            error: 'Phone number required for verification' 
          };
        }
      } else if (phone) {
        // Fallback: Try to verify with phone number directly (ChatGPT recommended flow)
        console.log('📱 FALLBACK: Verifying with phone number:', phone);
        
        // For production emergency: accept any 6-digit code if env flag is set
        if (process.env.SMS_ALLOW_LEGACY === '1' && /^\d{6}$/.test(cleanCode)) {
          console.log('⚠️  EMERGENCY MODE: Accepting any 6-digit code for cached frontend');
          verification = { success: true };
        } else {
          // Try Twilio verification by phone (uses latest verification for this phone)
          try {
            const { normalizePhoneNumber, twilioClient } = await import('./services/sms');
            
            // Check for missing env vars (ChatGPT identified issue)
            if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
              console.error('❌ TWILIO_VERIFY_SERVICE_SID is missing!');
              return res.status(500).json({ 
                error: 'Verify Service SID missing',
                detail: 'Server configuration error - Twilio Verify Service not configured',
                code: 'MISSING_SERVICE_SID'
              });
            }
            
            // Normalize phone to E.164 format
            const to = phone.startsWith('+') ? phone : normalizePhoneNumber(phone);
            console.log('📱 Normalized phone for verification:', to);
            
            if (twilioClient && process.env.TWILIO_VERIFY_SERVICE_SID) {
              const verificationCheck = await twilioClient.verify.v2
                .services(process.env.TWILIO_VERIFY_SERVICE_SID)
                .verificationChecks
                .create({ to, code: cleanCode });
              
              console.log('📱 Twilio verification response:', verificationCheck.status);
              
              verification = {
                success: verificationCheck.status === 'approved',
                error: verificationCheck.status !== 'approved' ? 
                  `Verification failed: ${verificationCheck.status}` : undefined,
                status: verificationCheck.status
              };
            } else {
              // Dev mode: accept any 6-digit code
              verification = /^\d{6}$/.test(cleanCode) 
                ? { success: true }
                : { success: false, error: 'Invalid code format' };
            }
          } catch (twilioError: any) {
            // Surface Twilio error details (ChatGPT recommended)
            console.error('❌ Twilio verification error:', {
              status: twilioError.status,
              code: twilioError.code,
              message: twilioError.message,
              moreInfo: twilioError.moreInfo
            });
            
            // Return detailed error for debugging
            return res.status(502).json({ 
              error: 'twilio-verify-failed',
              detail: twilioError.message || 'Twilio verification failed',
              code: twilioError.code,
              status: twilioError.status
            });
          }
        }
      } else {
        verification = { 
          success: false, 
          error: 'Unable to verify code. Please request a new one.' 
        };
      }
      
      console.log('📱 Verification result:', verification);
      
      if (verification.success) {
        // If createAccount is true, create user and login session
        if (createAccount) {
          try {
            console.log('👥 Starting user account creation for phone:', phone);
            
            // Check if user already exists with this phone
            console.log('🔍 Checking for existing user with phone:', phone);
            
            // Try multiple phone formats to find existing user
            let user = await storage.getUserByPhone(phone);
            
            // If not found, try without country code prefix
            if (!user && phone.startsWith('+1')) {
              const phoneWithoutPlus = phone.substring(2); // Remove +1
              const phoneWithDashes = phoneWithoutPlus.slice(0,3) + '-' + phoneWithoutPlus.slice(3,6) + '-' + phoneWithoutPlus.slice(6);
              console.log('🔍 Trying alternate formats:', phoneWithoutPlus, phoneWithDashes);
              user = await storage.getUserByPhone(phoneWithoutPlus) || await storage.getUserByPhone(phoneWithDashes);
            }
            
            // Also try looking up by the SMS email format (e.g., 17326101200@sms.gabaiapp.com)
            if (!user) {
              const phoneDigits = phone.replace(/[^\d]/g, '');
              const smsEmail = `${phoneDigits}@sms.gabaiapp.com`;
              console.log('🔍 Trying SMS email format:', smsEmail);
              user = await storage.getUserByEmail(smsEmail);
            }
            
            if (!user) {
              // Create new user with phone number
              // Generate unique username with last 4 digits + random suffix to avoid collisions
              const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
              const userData = {
                name: `User${phone.slice(-4)}-${randomSuffix}`, // e.g., User1200-A3K
                phone: phone,
                email: `${phone.replace(/[^\d]/g, '')}@sms.gabaiapp.com`,
                onboardingCompleted: false
              };
              
              console.log('🆕 Creating new user with data:', userData);
              try {
                user = await storage.createUser(userData);
                console.log('✅ New SMS user created:', user.id);
              } catch (createError: any) {
                // If user already exists, try to find them with alternate formats
                console.log('⚠️ User creation failed, trying to find existing user...');
                
                // Try all possible phone formats AND email format
                const phoneDigits = phone.replace(/[^\d]/g, '');
                const formats = [
                  phone,
                  phoneDigits,
                  '+' + phoneDigits,
                  phoneDigits.slice(-10), // Last 10 digits only
                  phoneDigits.slice(-10).slice(0,3) + '-' + phoneDigits.slice(-10).slice(3,6) + '-' + phoneDigits.slice(-10).slice(6)
                ];
                
                for (const format of formats) {
                  console.log('🔍 Trying phone format:', format);
                  user = await storage.getUserByPhone(format);
                  if (user) {
                    console.log('✅ Found existing user with phone format:', format);
                    break;
                  }
                }
                
                // Also try the SMS email format
                if (!user) {
                  const smsEmail = `${phoneDigits}@sms.gabaiapp.com`;
                  console.log('🔍 Trying SMS email format:', smsEmail);
                  user = await storage.getUserByEmail(smsEmail);
                  if (user) {
                    console.log('✅ Found existing user with SMS email:', smsEmail);
                  }
                }
                
                if (!user) {
                  throw createError; // Re-throw if we still can't find the user
                }
              }
            } else {
              console.log('✅ Existing SMS user found:', user.id);
            }
            
            // Create mobile token for authentication with phone verification
            const tokenData = {
              userId: user.id,
              timestamp: Date.now(),
              phone: phone, // Include phone to validate SMS authentication
              authMethod: 'sms' // Mark this as SMS-authenticated
            };
            const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
            
            // Set cookie with proper cross-origin settings for VoltBuilder APK
            // SameSite=None allows the cookie to work when APK redirects to the site
            const cookieOptions = {
              httpOnly: false, // Allow JavaScript access for compatibility
              secure: true, // Required with SameSite=None
              sameSite: 'none' as const, // Allow cross-origin (APK to website)
              maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
              path: '/'
            };
            
            res.cookie('gabai_token', token, cookieOptions);
            console.log('🍪 Server set gabai_token cookie with cross-origin settings');
            
            res.json({ 
              success: true, 
              message: "Phone verified and logged in successfully",
              verified: true,
              user: user,
              token: token
            });
          } catch (userError: any) {
            console.error("❌ Error creating user after SMS verification:", {
              message: userError.message,
              stack: userError.stack,
              code: userError.code,
              phone: phone,
              timestamp: new Date().toISOString()
            });
            
            // Check for specific database errors
            if (userError.message?.includes('database') || userError.message?.includes('connection')) {
              res.status(500).json({ 
                error: "Database connection error", 
                details: "Unable to connect to database. Please try again." 
              });
            } else if (userError.message?.includes('duplicate')) {
              res.status(409).json({ 
                error: "Account already exists", 
                details: "An account with this phone number already exists." 
              });
            } else {
              res.status(500).json({ 
                error: "Failed to create user account",
                details: userError.message || "Unknown error occurred"
              });
            }
          }
        } else {
          res.json({ 
            success: true, 
            message: "Phone number verified successfully",
            verified: true
          });
        }
      } else {
        res.status(400).json({ 
          error: verification.error,
          verified: false
        });
      }
    } catch (error: any) {
      console.error("Verify SMS code error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Database health check endpoint (for debugging production issues)
  app.get("/api/health/db", async (req, res) => {
    try {
      console.log('🏥 Database health check requested');
      
      // Test basic database connectivity
      const testUser = await storage.getUserByPhone('+15551234567'); // Test phone that likely doesn't exist
      
      console.log('✅ Database connection successful');
      res.json({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString(),
        testQuery: 'success'
      });
    } catch (error: any) {
      console.error('❌ Database health check failed:', error);
      res.status(500).json({ 
        status: 'unhealthy', 
        database: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // SMS reminder routes
  app.post("/api/sms/send-reminder", jsonParser, async (req, res) => {
    try {
      const { phoneNumber, title, description } = req.body;
      
      if (!phoneNumber || !title) {
        return res.status(400).json({ error: "Phone number and title are required" });
      }
      
      // Send reminder SMS
      const result = await sendReminderSMS(phoneNumber, title, description);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: "Reminder sent successfully",
          devMode: result.devMode,
          messageId: result.messageId
        });
      } else {
        res.status(500).json({ 
          error: "Failed to send reminder SMS",
          details: result.error,
          devMode: result.devMode
        });
      }
    } catch (error: any) {
      console.error("Send reminder SMS error:", error);
      res.status(500).json({ error: "Failed to send reminder" });
    }
  });

  // Admin endpoint to view all users
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      console.log("🔄 User update request for ID:", req.params.id);
      console.log("🔄 Update data:", req.body);
      
      // Check for SMS/mobile token authentication first
      const cookieToken = req.cookies?.gabai_token;
      let currentUser: any = null;
      
      if (cookieToken) {
        try {
          console.log('🔑 Checking SMS token for user update');
          const decoded = JSON.parse(Buffer.from(cookieToken, 'base64').toString());
          const { userId } = decoded;
          
          if (userId) {
            const user = await storage.getUser(userId);
            if (user) {
              currentUser = user;
              console.log('✅ SMS user authenticated for update:', userId);
            }
          }
        } catch (tokenError) {
          console.error('❌ SMS token decode error:', tokenError);
        }
      }
      
      // Fallback to OAuth authentication
      if (!currentUser && req.isAuthenticated && req.isAuthenticated() && req.user) {
        currentUser = req.user as any;
        console.log('✅ OAuth user authenticated for update');
      }
      
      // Check if any authentication succeeded
      if (!currentUser) {
        console.error("❌ User not authenticated for update");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is trying to update their own profile
      if (currentUser.id !== req.params.id) {
        console.error("❌ User trying to update different profile");
        return res.status(403).json({ message: "Cannot update other user's profile" });
      }
      
      const updates = insertUserSchema.partial().parse(req.body);
      console.log("✅ Parsed updates:", JSON.stringify(updates, null, 2));
      console.log("📱 Preferences being saved:", JSON.stringify(updates.preferences, null, 2));
      
      const user = await storage.updateUser(req.params.id, updates);
      console.log("✅ User updated successfully:", user.id);
      console.log("📱 Updated preferences:", JSON.stringify(user.preferences, null, 2));
      
      // If this is completing onboarding and user has a profession, create profession-specific lists
      if (updates.onboardingCompleted && updates.profession) {
        console.log("🎯 Creating profession-specific lists for:", updates.profession);
        await createProfessionLists(user.id, updates.profession);
      }
      
      // Update the session with the new user data
      req.user = user;
      
      res.json(user);
    } catch (error: any) {
      console.error("❌ Update user error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Temporary route to delete user account for testing
  app.delete("/api/user/delete-my-account/:phoneNumber", async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      console.log('🗑️ Delete account request for phone:', phoneNumber);
      
      // Find user by phone
      const user = await storage.getUserByPhone(phoneNumber);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log('🗑️ Found user to delete:', user.id, user.name);
      
      // Delete all related data
      try {
        // Delete list items first
        const lists = await storage.getSmartLists(user.id);
        for (const list of lists) {
          const items = await storage.getListItems(list.id);
          for (const item of items) {
            await storage.deleteListItem(item.id);
          }
        }
        
        // Delete messages and conversations
        const conversations = await storage.getConversations(user.id);
        for (const conv of conversations) {
          const messages = await storage.getMessages(conv.id);
          for (const msg of messages) {
            await storage.deleteMessage(msg.id);
          }
          await storage.deleteConversation(conv.id);
        }
        
        // Delete smart lists
        for (const list of lists) {
          await storage.deleteSmartList(list.id);
        }
        
        // Delete reminders
        const reminders = await storage.getReminders(user.id);
        for (const reminder of reminders) {
          await storage.deleteReminder(reminder.id);
        }
        
        // Delete contacts
        const contacts = await storage.getContacts(user.id);
        for (const contact of contacts) {
          await storage.deleteContact(contact.id);
        }
        
        // Finally delete the user
        await storage.deleteUser(user.id);
        
        console.log('✅ User account deleted successfully');
        res.json({ success: true, message: "Account deleted successfully", userId: user.id });
      } catch (deleteError: any) {
        console.error('❌ Error during deletion:', deleteError);
        res.status(500).json({ error: "Failed to delete all user data", details: deleteError.message });
      }
    } catch (error: any) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account", details: error.message });
    }
  });

  // Conversation routes
  app.get("/api/conversations/:userId", async (req, res) => {
    try {
      const conversations = await storage.getConversations(req.params.userId);
      res.json(conversations);
    } catch (error: any) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/conversations", jsonParser, async (req, res) => {
    try {
      let conversationData = req.body;
      
      // Mobile app support - use mobile user ID if bypass header present
      if (req.headers['x-mobile-app'] === 'true' && req.user) {
        const user = req.user as any;
        conversationData = {
          ...conversationData,
          userId: user.id,
          title: conversationData.title || 'Mobile Chat Session'
        };
      }
      
      const validatedData = insertConversationSchema.parse(conversationData);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error: any) {
      console.error("Create conversation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Message routes
  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error: any) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/messages", jsonParser, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error: any) {
      console.error("Create message error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Enhanced chat route with file upload support
  app.post("/api/chat/upload", upload.array("attachments", 5), async (req, res) => {
    try {
      const { message, userId, conversationId } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!message || !userId) {
        return res.status(400).json({ message: "Message and userId are required" });
      }

      // Process uploaded files
      let imageData: string | undefined;
      const attachmentInfo: any[] = [];
      
      if (files && files.length > 0) {
        for (const file of files) {
          if (file.mimetype.startsWith('image/')) {
            // Convert first image to base64 for AI processing
            if (!imageData) {
              imageData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            }
          }
          
          // Store attachment info
          attachmentInfo.push({
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
        }
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get conversation history
      const conversationHistory = conversationId 
        ? await storage.getMessages(conversationId)
        : [];

      const historyForAI = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create conversation if needed
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const conversation = await storage.createConversation({
          userId,
          title: message.substring(0, 50) + "..."
        });
        currentConversationId = conversation.id;
      }

      // Save user message with attachments info
      const userMessage = await storage.createMessage({
        conversationId: currentConversationId,
        role: "user", 
        content: message,
        imageUrl: imageData || null,
        metadata: attachmentInfo.length > 0 ? { attachments: attachmentInfo } : null
      });

      // Generate AI response with attachment context
      const messageWithAttachments = attachmentInfo.length > 0 
        ? `${message}\n\n[Attached files: ${attachmentInfo.map(a => a.filename).join(', ')}]`
        : message;
      
      const aiResponse = await generatePersonalizedResponse(messageWithAttachments, user, historyForAI, imageData);

      // Process any URLs in the response for affiliate shortening
      const processedContent = await processUrlsInContent(aiResponse.content);

      // Save assistant message
      const assistantMessage = await storage.createMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: processedContent
      });

      res.json({
        conversationId: currentConversationId,
        userMessage,
        message: assistantMessage,
        actions: aiResponse.actions || [],
        suggestions: aiResponse.suggestions || []
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        message: error.message || "An error occurred during chat processing",
        error: process.env.NODE_ENV === "development" ? error : undefined 
      });
    }
  });

  // Original chat route with AI integration (kept for backwards compatibility)
  app.post("/api/chat", jsonParser, async (req, res) => {
    try {
      const { message, userId, conversationId, imageData } = req.body;
      
      if (!message || !userId) {
        return res.status(400).json({ message: "Message and userId are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get conversation history
      const conversationHistory = conversationId 
        ? await storage.getMessages(conversationId)
        : [];

      const historyForAI = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create conversation if needed
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const conversation = await storage.createConversation({
          userId,
          title: message.substring(0, 50) + "..."
        });
        currentConversationId = conversation.id;
      }

      // Save user message FIRST (with image if provided)
      const userMessage = await storage.createMessage({
        conversationId: currentConversationId,
        role: "user", 
        content: message,
        imageUrl: imageData || null
      });

      // Re-fetch user to get latest preferences (including SMS consent)
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Debug logging for SMS consent
      console.log("📱 SMS Consent Check:", {
        userId: updatedUser.id,
        phone: updatedUser.phone,
        smsConsent: updatedUser.preferences?.smsConsent,
        smsConsentDate: updatedUser.preferences?.smsConsentDate,
        smsConsentPhone: updatedUser.preferences?.smsConsentPhone,
        hasConsent: updatedUser.preferences?.smsConsent === true && updatedUser.phone
      });

      // Generate AI response with updated user data and image
      const aiResponse = await generatePersonalizedResponse(message, updatedUser, historyForAI, imageData);

      // Process any URLs in the response for affiliate shortening
      const processedContent = await processUrlsInContent(aiResponse.content);

      // Save assistant message with processed content (URLs converted to affiliate short links)
      const assistantMessage = await storage.createMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: processedContent
      });

      // Process any actions from the AI response
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        for (const action of aiResponse.actions) {
          try {
            // Alarm feature disabled for VoltBuilder - use SMS reminders instead
            if (false && action.type === "create_alarm" && action.data?.alarm) {
              // Handle alarm creation - create both reminder AND calendar appointment
              console.log('Creating unified alarm/calendar event from voice command:', action.data.alarm);
              
              let alarmDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to tomorrow
              
              if (action.data.alarm.date) {
                try {
                  alarmDate = new Date(action.data.alarm.date);
                  if (isNaN(alarmDate.getTime())) {
                    alarmDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  }
                } catch (e) {
                  alarmDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                }
              }
              
              // Create unified alarm/appointment entry
              await storage.createReminder({
                userId,
                title: action.data.alarm.title || "Voice Alarm",
                description: `ALARM/APPOINTMENT: ${action.data.alarm.description || action.data.alarm.title}`,
                dueDate: alarmDate,
                category: "Alarm"
              });
              
              // Log activity for pattern learning
              const now = new Date();
              await storage.createActivityLog({
                userId,
                activityType: "reminder_created",
                description: action.data.alarm.title || "Voice Alarm",
                dayOfWeek: now.getDay(),
                hourOfDay: now.getHours(),
                metadata: { type: "alarm", time: alarmDate.toISOString() }
              });
            } else if (action.type === "create_appointment" && action.data?.appointment) {
              // Handle appointment creation
              let appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to tomorrow
              
              if (action.data.appointment.date) {
                try {
                  appointmentDate = new Date(action.data.appointment.date);
                  if (isNaN(appointmentDate.getTime())) {
                    appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  }
                } catch (e) {
                  appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                }
              }
              
              // Log the appointment date for debugging
              console.log(`Creating appointment with date: ${appointmentDate.toISOString()}`);
              console.log(`Appointment date in EST: ${appointmentDate.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
              
              await storage.createReminder({
                userId,
                title: action.data.appointment.title,
                description: action.data.appointment.description || `Appointment: ${action.data.appointment.title}`,
                dueDate: appointmentDate,
                category: "Appointment"
              });
              
              // Log activity for pattern learning
              const now = new Date();
              await storage.createActivityLog({
                userId,
                activityType: "appointment_created",
                description: action.data.appointment.title,
                dayOfWeek: appointmentDate.getDay(),
                hourOfDay: appointmentDate.getHours(),
                metadata: { type: "appointment", scheduledTime: appointmentDate.toISOString() }
              });
            } else if (action.type === "create_reminder" && action.data?.reminder) {
              // Handle reminder creation
              console.log('Creating reminder from AI chat:', action.data.reminder);
              
              let reminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to tomorrow
              
              if (action.data.reminder.date) {
                try {
                  reminderDate = new Date(action.data.reminder.date);
                  if (isNaN(reminderDate.getTime())) {
                    reminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  }
                } catch (e) {
                  reminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                }
              }
              
              // Create reminder with SMS support if user has phone
              const userDetails = await storage.getUser(userId);
              
              // Check if this is a friend reminder (has targetPhone) or personal reminder
              const targetPhone = action.data.reminder.targetPhone;
              const isPersonalReminder = !targetPhone;
              
              // For personal reminders, check user's phone. For friend reminders, use targetPhone
              const smsPhone = targetPhone || (action.data.reminder.smsEnabled ? userDetails?.phone : null);
              const smsEnabled = !!smsPhone; // Enable SMS if we have any phone number
              
              // Use user's timezone preference, fall back to Eastern Time
              const userTimezone = userDetails?.timezone || "America/New_York";
              
              // Log the parsed time for debugging
              console.log(`📅 Reminder time parsing:
                - Original date from AI: ${action.data.reminder.date}
                - Parsed as UTC: ${reminderDate.toISOString()}
                - In user's timezone (${userTimezone}): ${reminderDate.toLocaleString('en-US', { timeZone: userTimezone })}
              `);
              
              await storage.createReminder({
                userId,
                title: action.data.reminder.title || "Reminder",
                description: action.data.reminder.description || "",
                dueDate: reminderDate,
                category: null, // Use null for general reminders to match UI
                smsEnabled: smsEnabled,
                smsPhone: smsPhone,
                reminderMinutes: 0, // Default to exact time (not offset)
                reminderType: action.data.reminder.reminderType || "sms", // Support voice reminders
                timezone: userTimezone // Use user's timezone, not server timezone
              });
              
              console.log(`✅ Created reminder: ${action.data.reminder.title} for ${reminderDate.toISOString()}`);
            } else if (action.type === "create_contact" && action.data?.contact) {
              // Handle contact creation from chat or business card
              const contactData = {
                userId,
                ...action.data.contact,
                source: action.data.contact.source || "chat_message"
              };
              
              const newContact = await storage.createContact(contactData);
              console.log(`Created contact: ${newContact.firstName} ${newContact.lastName}`);
              
              // Also create a follow-up reminder if specified
              if (action.data.reminder) {
                await storage.createReminder({
                  userId,
                  title: action.data.reminder.title,
                  description: action.data.reminder.description,
                  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                  category: action.data.reminder.category || "Follow-up"
                });
              }
            } else if (action.type === "remove_from_list" && action.data?.items) {
              // Handle item removal from lists
              const lists = await storage.getSmartLists(userId);
              const allItems = [];
              
              // Get all list items
              for (const list of lists) {
                const items = await storage.getListItems(list.id);
                allItems.push(...items.map(item => ({...item, listId: list.id, listName: list.name})));
              }
              
              for (const itemToRemove of action.data.items) {
                const itemName = (itemToRemove.name || itemToRemove).toLowerCase();
                console.log(`🔍 Looking for item to remove: "${itemName}"`);
                
                // Enhanced fuzzy matching for typos and variations
                const matchingItems = allItems.filter(item => {
                  const listItemName = item.name.toLowerCase();
                  console.log(`🔍 Comparing "${itemName}" with "${listItemName}"`);
                  
                  // Exact match
                  if (listItemName === itemName) return true;
                  
                  // Simple contains match
                  if (listItemName.includes(itemName) || itemName.includes(listItemName)) return true;
                  
                  // Fuzzy match for typos (Levenshtein-like similarity)
                  const similarity = calculateSimilarity(itemName, listItemName);
                  console.log(`📊 Similarity score: ${similarity}`);
                  
                  // Accept if similarity is high (handles typos like "peper clips" vs "paperclips")
                  return similarity > 0.7;
                });
                
                console.log(`📝 Found ${matchingItems.length} matching items:`, matchingItems.map(i => i.name));
                
                for (const item of matchingItems) {
                  console.log(`🗑️ Removing item: "${item.name}" from "${item.listName}"`);
                  await storage.deleteListItem(item.id);
                }
              }
            } else if (action.type === "create_list" && action.data?.listName) {
              // Handle create_list action from AI
              console.log('🆕 Creating list from AI:', action.data.listName, action.data.listType);
              
              try {
                const newList = await storage.createSmartList({
                  userId,
                  name: action.data.listName,
                  type: action.data.listType || "shopping",
                  isShared: false,
                  shareCode: null,
                  shareMode: "view"
                });
                console.log('✅ Created new list:', newList.name, newList.type);
              } catch (error) {
                console.error('❌ Failed to create list:', error);
              }
            } else if (action.type === "add_to_list" && action.data?.items) {
              const lists = await storage.getSmartLists(userId);
              let targetList;

              // Smart list selection based on action data or item context
              const requestedType = action.data.listType || "shopping";
              console.log(`AI requested list type: ${requestedType}`);
              console.log(`Available lists:`, lists.map(l => `${l.name} (${l.type})`));
              
              // First try to find a list of the requested type
              // Prioritize lists with names that match the type (avoid misnamed lists)
              if (requestedType === "shopping") {
                targetList = lists.find(list => 
                  list.type === "shopping" && 
                  (list.name.toLowerCase().includes("shop") || 
                   list.name.toLowerCase().includes("grocery") || 
                   list.name.toLowerCase().includes("food"))
                ) || lists.find(list => list.type === "shopping");
              } else if (requestedType === "payments") {
                targetList = lists.find(list => 
                  list.type === "payments" || list.type === "budget"
                );
              } else {
                targetList = lists.find(list => list.type === requestedType);
              }
              console.log(`Found target list:`, targetList ? `${targetList.name} (${targetList.type})` : 'none');
              
              // If no specific type requested or found, use context clues
              if (!targetList && action.data.items?.length > 0) {
                const firstItem = action.data.items[0];
                const itemName = (firstItem.name || firstItem).toLowerCase();
                
                // Categorize items to determine best list type
                if (isAppointmentItem(itemName)) {
                  // Handle appointments as reminders/calendar events
                  for (const item of action.data.items) {
                    await storage.createReminder({
                      userId,
                      title: item.name || item,
                      description: `Appointment: ${item.name || item}`,
                      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
                      category: "Appointment"
                    });
                  }
                  continue; // Skip adding to lists, added to calendar instead
                } else if (isBooksItem(itemName)) {
                  targetList = lists.find(list => list.type === "books");
                } else if (isMoviesItem(itemName)) {
                  targetList = lists.find(list => list.type === "movies");
                } else if (isTravelItem(itemName)) {
                  targetList = lists.find(list => list.type === "travel");
                } else if (isGiftsItem(itemName)) {
                  targetList = lists.find(list => list.type === "gifts");
                } else if (isPaymentItem(itemName)) {
                  targetList = lists.find(list => list.type === "payments");
                } else if (isShoppingItem(itemName)) {
                  targetList = lists.find(list => list.type === "shopping");
                } else if (isPunchListItem(itemName)) {
                  targetList = lists.find(list => list.type === "punch_list");
                } else if (isWaitingListItem(itemName)) {
                  targetList = lists.find(list => list.type === "waiting_list");
                } else {
                  // Default to shopping for general shopping mentions, otherwise todo
                  if (itemName.includes('buy') || itemName.includes('get') || itemName.includes('purchase') || 
                      itemName.includes('shop') || itemName.includes('grocery') || itemName.includes('store') ||
                      itemName.includes('need') || itemName.includes('pick up')) {
                    targetList = lists.find(list => list.type === "shopping");
                  } else {
                    targetList = lists.find(list => list.type === "todo");
                  }
                }
              }
              
              // Create appropriate list if none exists
              if (!targetList) {
                const listConfig = getListConfig(requestedType);
                targetList = await storage.createSmartList({
                  userId,
                  name: listConfig.name,
                  type: listConfig.type,
                  categories: listConfig.categories
                });
              }

              // Add items to the target list with duplicate prevention
              console.log(`Adding ${action.data.items.length} items to list: ${targetList.name}`);
              
              // Get existing items to prevent duplicates
              const existingItems = await storage.getListItems(targetList.id);
              const existingItemNames = new Set(existingItems.map(item => item.name.toLowerCase().trim()));
              
              for (const item of action.data.items) {
                const itemName = (item.name || item).trim();
                const itemNameLower = itemName.toLowerCase();
                
                // Skip if item already exists (prevent duplicates)
                if (existingItemNames.has(itemNameLower)) {
                  console.log(`Skipping duplicate item: ${itemName}`);
                  continue;
                }
                
                // Extract dollar amount from payment items
                let amount = null;
                let cleanedItemName = itemName;
                
                if (targetList.type === "payments" || targetList.type === "budget") {
                  // Extract dollar amounts using regex
                  const dollarMatch = itemName.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
                  if (dollarMatch) {
                    const dollarString = dollarMatch[1].replace(/,/g, ''); // Remove commas
                    const dollarAmount = parseFloat(dollarString);
                    if (!isNaN(dollarAmount)) {
                      amount = Math.round(dollarAmount * 100); // Convert to cents
                      // Remove the dollar amount from the item name for cleaner display
                      cleanedItemName = itemName.replace(/\$?[\d,]+\.?\d*/g, '').trim();
                      console.log(`Extracted $${dollarAmount} from "${itemName}", cleaned name: "${cleanedItemName}"`);
                    }
                  }
                }
                
                console.log(`Adding item "${cleanedItemName}" to list "${targetList.name}" with amount: ${amount ? '$' + (amount/100).toFixed(2) : 'none'}`);
                await storage.createListItem({
                  listId: targetList.id,
                  name: cleanedItemName,
                  category: item.category || (targetList.type === "payments" ? "Payments" : "Other"),
                  amount: amount,
                  currency: amount ? "USD" : undefined
                });
                
                // Add to existing items set to prevent duplicates within the same request
                existingItemNames.add(itemNameLower);
              }
            }
          } catch (actionError: any) {
            console.error("Error processing action:", actionError);
            // Don't fail the whole response if action processing fails
          }
        }
      }

      res.json({
        userMessage,
        message: {
          ...assistantMessage,
          content: processedContent // Return the processed content with shortened affiliate URLs
        },
        conversationId: currentConversationId,
        suggestions: aiResponse.suggestions,
        actions: aiResponse.actions
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Voice transcription route - NO AUTH REQUIRED for mobile compatibility
  // Support both multipart/form-data (for compatibility) and raw binary (for cross-origin)
  app.post("/api/transcribe", 
    // Conditionally apply middleware based on Content-Type
    async (req, res, next) => {
      const contentType = req.headers['content-type'] || '';
      
      if (contentType.includes('multipart/form-data')) {
        // Use Multer for FormData
        upload.single("audio")(req, res, next);
      } else if (contentType === 'application/octet-stream') {
        // Use express.raw() for binary data
        express.raw({ type: ['application/octet-stream', 'audio/*'], limit: '10mb' })(req, res, next);
      } else {
        next();
      }
    },
    async (req, res) => {
      console.log('🎤 Transcribe endpoint hit');
      console.log('📦 Request headers:', {
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        xAudioMime: req.headers['x-audio-mime'],
        xAudioExt: req.headers['x-audio-ext'],
        userAgent: req.headers['user-agent']
      });
      console.log('📁 Request body type:', typeof req.body);
      console.log('📁 File received (multipart):', req.file ? `Yes - ${req.file.size} bytes, mimetype: ${req.file.mimetype}` : 'No');
      console.log('📁 Raw body received:', Buffer.isBuffer(req.body) ? `Yes - ${req.body.length} bytes` : 'No');
      
      try {
        let audioBuffer: Buffer;
        let filename: string;
        let mimeType: string;
        
        // Handle multipart/form-data (original approach)
        if (req.file) {
          audioBuffer = req.file.buffer;
          filename = req.file.originalname || "audio.mp3";
          mimeType = req.file.mimetype || "audio/mpeg";
        }
        // Handle raw binary (new approach for cross-origin)
        else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
          audioBuffer = req.body;
          // Get metadata from custom headers
          mimeType = (req.headers['x-audio-mime'] as string) || 'audio/webm';
          const ext = (req.headers['x-audio-ext'] as string) || 'webm';
          filename = `audio.${ext}`;
          
          console.log(`🎤 Processing raw audio: size: ${audioBuffer.length} bytes, type: ${mimeType}, filename: ${filename}`);
        }
        else {
          console.error('❌ No audio data in request');
          console.error('❌ Content-Type header:', req.headers['content-type']);
          console.error('❌ Body type:', typeof req.body, 'Body length:', (req.body as any)?.length);
          return res.status(400).json({ message: "Audio file is required" });
        }
  
        // Check if buffer is empty
        if (audioBuffer.length === 0) {
          console.error("🔇 Empty audio buffer received");
          return res.status(400).json({ 
            message: "Recording is empty. Please check your microphone permissions and try again." 
          });
        }
  
        // Check minimum file size (at least 100 bytes for a valid audio file)
        if (audioBuffer.length < 100) {
          console.error(`🔇 Audio buffer too small: ${audioBuffer.length} bytes`);
          return res.status(400).json({ 
            message: "Recording is too short. Please hold the microphone button and speak clearly." 
          });
        }
  
        console.log(`🎤 Processing audio: ${filename}, size: ${audioBuffer.length} bytes, type: ${mimeType}`);
  
        // Pass the filename and mimetype for transcription
        const transcription = await transcribeAudio(
          audioBuffer,
          filename,
          mimeType
        );
        res.json({ text: transcription });
      } catch (error: any) {
        console.error("Transcription error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );

  // OCR endpoint for extracting text from images
  app.post("/api/ocr", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // Convert image buffer to base64
      const base64Image = req.file.buffer.toString('base64');
      
      // Use OpenAI's vision API to extract text
      const extractedText = await extractTextFromImage(base64Image);
      res.json({ text: extractedText });
    } catch (error: any) {
      console.error("OCR error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Text-to-speech route
  app.post("/api/speak", jsonParser, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const audioBuffer = await speechService.generateSpeech(text);
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
      });
      res.send(audioBuffer);
    } catch (error: any) {
      console.error("Speech generation error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get available ElevenLabs voices
  app.get("/api/voices", async (req, res) => {
    try {
      if (!process.env.ELEVENLABS_API_KEY) {
        return res.json({ voices: [], provider: "openai" });
      }

      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      res.json({ 
        voices: data.voices || [], 
        provider: "elevenlabs",
        default: "21m00Tcm4TlvDq8ikWAM" // Rachel voice
      });
    } catch (error: any) {
      console.error("Failed to fetch voices:", error);
      res.json({ voices: [], provider: "openai", error: error.message });
    }
  });

  // Backward compatibility routes (shopping lists)
  app.get("/api/shopping-lists/:userId", async (req, res) => {
    try {
      const lists = await storage.getSmartLists(req.params.userId);
      res.json(lists);
    } catch (error: any) {
      console.error("Get shopping lists error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/shopping-lists", async (req, res) => {
    try {
      const listData = {
        ...req.body,
        type: "shopping",
        categories: ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Beverages", "Household"]
      };
      const parsedData = insertSmartListSchema.parse(listData);
      const list = await storage.createSmartList(parsedData);
      res.json(list);
    } catch (error: any) {
      console.error("Create shopping list error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Generic list item routes (used by frontend)
  app.post("/api/list-items", async (req, res) => {
    try {
      console.log("📦 Creating list item with data:", req.body);
      const itemData = insertListItemSchema.parse(req.body);
      console.log("✅ Parsed item data:", itemData);
      const item = await storage.createListItem(itemData);
      console.log("💾 Created item in database:", item);
      res.json(item);
    } catch (error: any) {
      console.error("Create list item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/list-items/:id", async (req, res) => {
    try {
      console.log("📝 Updating list item:", req.params.id, req.body);
      const item = await storage.updateListItem(req.params.id, req.body);
      console.log("✅ List item updated:", item);
      res.json(item);
    } catch (error: any) {
      console.error("❌ Update list item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/list-items/:id", async (req, res) => {
    try {
      console.log("🗑️ Deleting list item:", req.params.id);
      await storage.deleteListItem(req.params.id);
      console.log("✅ List item deleted");
      res.status(204).send();
    } catch (error: any) {
      console.error("❌ Delete list item error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/shopping-items", async (req, res) => {
    try {
      const itemData = insertListItemSchema.parse(req.body);
      const item = await storage.createListItem(itemData);
      res.json(item);
    } catch (error: any) {
      console.error("Create shopping item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Toggle list item completion
  app.patch("/api/list-items/:id/toggle", async (req, res) => {
    try {
      console.log("🔄 Toggling list item:", req.params.id);
      const item = await storage.toggleListItem(req.params.id);
      console.log("✅ List item toggled:", item);
      res.json(item);
    } catch (error: any) {
      console.error("❌ Toggle list item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Update list item (supporting both shopping-items and list-items routes)
  app.patch("/api/shopping-items/:id", async (req, res) => {
    try {
      const item = await storage.updateListItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      console.error("Update shopping item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/list-items/:id", async (req, res) => {
    try {
      console.log("🔄 Updating list item:", req.params.id, req.body);
      const item = await storage.updateListItem(req.params.id, req.body);
      console.log("✅ List item updated:", item);
      res.json(item);
    } catch (error: any) {
      console.error("❌ Update list item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/shopping-items/:id", async (req, res) => {
    try {
      await storage.deleteListItem(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete shopping item error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Reminder routes
  // Get reminders - fixed to work without URL parameter
  app.get("/api/reminders", async (req, res) => {
    try {
      // Get userId from query params, or try to get from authenticated session
      const userId = req.query.userId as string || (req as any).user?.id;
      
      console.log('🔍 Getting reminders for userId:', userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const reminders = await storage.getReminders(userId);
      console.log(`📅 Found ${reminders.length} reminders for user ${userId}`);
      res.json(reminders);
    } catch (error: any) {
      console.error("❌ Get reminders error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Also keep the old route for backward compatibility
  app.get("/api/reminders/:userId", async (req, res) => {
    try {
      const reminders = await storage.getReminders(req.params.userId);
      res.json(reminders);
    } catch (error: any) {
      console.error("Get reminders error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reminders", jsonParser, async (req, res) => {
    try {
      console.log('📝 Received reminder creation request:', req.body);
      console.log('📝 User authenticated:', req.isAuthenticated() ? 'Yes' : 'No');
      console.log('📝 User ID from request:', req.body.userId);
      console.log('📝 User ID from session:', req.user?.id);
      
      // Validate user ID
      if (!req.body.userId) {
        console.error('❌ No userId provided in request');
        return res.status(400).json({ 
          message: "User ID is required",
          error: "Missing userId field"
        });
      }
      
      // Convert dueDate string to Date object and ensure all required fields
      const bodyWithDate = {
        userId: req.body.userId,
        title: req.body.title,
        description: req.body.description || null,
        dueDate: new Date(req.body.dueDate),
        completed: false,
        recurring: req.body.recurring || null,
        category: req.body.category || null,
        smsEnabled: req.body.smsEnabled || false,
        smsPhone: req.body.smsPhone || req.body.phoneNumber || null,
        smsSent: false,
        smsSentAt: null,
        smsStatus: req.body.smsStatus || 'pending',
        reminderMinutes: req.body.reminderMinutes || 0,
        timezone: req.body.timezone || 'America/New_York',
        reminderType: req.body.reminderType || 'sms' // ADD THIS LINE - crucial for voice reminders!
      };
      
      console.log('📅 Prepared reminder data:', bodyWithDate);
      console.log('📅 Reminder type:', bodyWithDate.reminderType);
      console.log('📅 SMS enabled:', bodyWithDate.smsEnabled);
      console.log('📅 Phone number:', bodyWithDate.smsPhone);
      
      try {
        const reminderData = insertReminderSchema.parse(bodyWithDate);
        console.log('✅ Validated reminder data:', reminderData);
        
        const reminder = await storage.createReminder(reminderData);
        console.log('✅ Reminder created in database:', reminder);
        
        res.json(reminder);
      } catch (parseError: any) {
        console.error('❌ Schema validation failed:', parseError);
        console.error('🔍 Validation errors:', parseError.errors || parseError.message);
        throw parseError;
      }
    } catch (error: any) {
      console.error("❌ Create reminder error:", error);
      console.error("🔍 Error details:", error.message);
      console.error("🔍 Error stack:", error.stack);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/reminders/:id", jsonParser, async (req, res) => {
    try {
      // Convert dueDate string to Date object if needed
      const bodyWithDate = {
        ...req.body,
        ...(req.body.dueDate && { dueDate: new Date(req.body.dueDate) })
      };
      
      const updates = insertReminderSchema.partial().parse(bodyWithDate);
      const reminder = await storage.updateReminder(req.params.id, updates);
      res.json(reminder);
    } catch (error: any) {
      console.error("Update reminder error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    try {
      await storage.deleteReminder(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete reminder error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // SMS Reminder routes
  app.post("/api/reminders/:id/send-sms", jsonParser, async (req, res) => {
    try {
      const { sendSMSReminder } = await import('./sms-reminder-service');
      const result = await sendSMSReminder(req.params.id);
      res.json({ success: true, messageSid: result.sid });
    } catch (error: any) {
      console.error("Send SMS reminder error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Cloud Scheduler endpoint for checking and sending pending SMS reminders
  // Support both GET (for Cloud Scheduler) and POST methods
  const handleCloudSchedulerRequest = async (req: Request, res: Response) => {
    try {
      // Verify this is from Cloud Scheduler (optional security check)
      const authHeader = req.headers.authorization;
      const schedulerToken = process.env.CLOUD_SCHEDULER_TOKEN;
      
      // Only check token if it's configured
      if (schedulerToken && authHeader !== `Bearer ${schedulerToken}`) {
        console.log('⚠️ Unauthorized Cloud Scheduler request');
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('☁️ Cloud Scheduler triggered SMS reminder check via', req.method);
      const { checkAndSendPendingReminders } = await import('./sms-reminder-service');
      const result = await checkAndSendPendingReminders();
      
      res.json({ 
        success: true, 
        message: "SMS reminder check completed",
        timestamp: new Date().toISOString(),
        remindersProcessed: result || []
      });
    } catch (error: any) {
      console.error("Cloud Scheduler SMS check error:", error);
      res.status(500).json({ message: error.message });
    }
  };

  // Support both GET and POST for Cloud Scheduler compatibility
  app.get("/api/reminders/check-and-send", handleCloudSchedulerRequest);
  app.post("/api/reminders/check-and-send", jsonParser, handleCloudSchedulerRequest);

  app.post("/api/sms/test", jsonParser, async (req, res) => {
    try {
      console.log('📱 Test SMS endpoint hit');
      console.log('📱 Request body:', req.body);
      console.log('📱 Headers:', req.headers);
      
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        console.log('❌ No phone number provided');
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      console.log('📱 Attempting to send test SMS to:', phoneNumber);
      const { sendTestSMS } = await import('./sms-reminder-service');
      const result = await sendTestSMS(phoneNumber);
      console.log('✅ Test SMS sent successfully:', result.sid);
      res.json({ success: true, messageSid: result.sid });
    } catch (error: any) {
      console.error("❌ Test SMS error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Test Voice Call endpoint
  app.post("/api/voice/test", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number required" });
      }
      
      console.log('📞 Test voice call requested to:', phoneNumber);
      
      const { makeReminderCall } = await import('./services/sms');
      const result = await makeReminderCall(
        phoneNumber,
        message || "Test call from GabAi",
        "This is a test of the voice reminder system. Press 1 to repeat this message."
      );
      
      if (result.success) {
        console.log('✅ Test voice call initiated successfully:', result.messageId);
        res.json({ success: true, callSid: result.messageId });
      } else {
        throw new Error(result.error || 'Failed to initiate call');
      }
    } catch (error: any) {
      console.error("❌ Test voice call error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Twilio SMS webhook endpoint - receives delivery status updates
  app.post("/api/webhooks/twilio/sms", jsonParser, async (req, res) => {
    try {
      console.log('📱 Twilio SMS webhook received:', {
        messageSid: req.body.MessageSid,
        status: req.body.MessageStatus,
        from: req.body.From,
        to: req.body.To,
        errorCode: req.body.ErrorCode,
        errorMessage: req.body.ErrorMessage
      });
      
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage, To } = req.body;
      
      // Log the delivery status
      if (MessageStatus === 'delivered') {
        console.log('✅ SMS delivered successfully to', To);
      } else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
        console.error('❌ SMS delivery failed:', {
          to: To,
          status: MessageStatus,
          errorCode: ErrorCode,
          errorMessage: ErrorMessage
        });
      } else {
        console.log(`📱 SMS status update: ${MessageStatus} for ${To}`);
      }
      
      // Acknowledge receipt
      res.status(200).send('OK');
    } catch (error: any) {
      console.error("❌ Webhook processing error:", error);
      res.status(500).send('Error processing webhook');
    }
  });

  // Twilio Voice webhook endpoint - generates TwiML for voice calls
  app.get("/api/webhooks/twilio/voice", async (req, res) => {
    try {
      const message = req.query.message as string || "This is your reminder from GabAi";
      const useElevenLabs = false; // Disabled for now - adds too much latency
      
      console.log('📞 Voice webhook called with message:', message);
      
      // Generate TwiML response immediately for faster response
      res.type('text/xml');
      
      if (useElevenLabs && (process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY_ENV_VAR)) {
        // Try to use ElevenLabs for high-quality voice
        try {
          const { speechService } = await import('./services/speech');
          const audioBuffer = await speechService.generateSpeech(message);
          
          // Upload audio to a temporary URL or use base64
          // For now, we'll use Twilio's built-in TTS as fallback
          // In production, you'd upload to S3 or similar and provide URL
          
          console.log('📞 ElevenLabs audio generated, but using Twilio TTS for now');
          res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">${message}</Say>
  <Say voice="Polly.Joanna" language="en-US">Press 1 to repeat this message, or hang up when done.</Say>
  <Gather numDigits="1" action="/api/webhooks/twilio/voice?message=${encodeURIComponent(message)}" method="GET">
    <Pause length="2"/>
  </Gather>
  <Say voice="Polly.Joanna" language="en-US">Goodbye!</Say>
</Response>`);
        } catch (error) {
          console.error('❌ ElevenLabs failed, using Twilio TTS:', error);
          // Fall back to Twilio's built-in TTS
          res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">${message}</Say>
  <Say voice="Polly.Joanna" language="en-US">Press 1 to repeat this message, or hang up when done.</Say>
  <Gather numDigits="1" action="/api/webhooks/twilio/voice?message=${encodeURIComponent(message)}" method="GET">
    <Pause length="2"/>
  </Gather>
  <Say voice="Polly.Joanna" language="en-US">Goodbye!</Say>
</Response>`);
        }
      } else {
        // Use Twilio's built-in text-to-speech (Polly voices are high quality)
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">${message}</Say>
  <Say voice="Polly.Joanna" language="en-US">Press 1 to repeat this message, or hang up when done.</Say>
  <Gather numDigits="1" action="/api/webhooks/twilio/voice?message=${encodeURIComponent(message)}" method="GET">
    <Pause length="2"/>
  </Gather>
  <Say voice="Polly.Joanna" language="en-US">Goodbye!</Say>
</Response>`);
      }
    } catch (error: any) {
      console.error("❌ Voice webhook error:", error);
      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, there was an error with your reminder. Please check the app.</Say>
</Response>`);
    }
  });

  // Calendar export routes
  app.get("/api/calendar/export/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('📅 Calendar export requested for user:', userId);
      console.log('📅 Request headers:', {
        userAgent: req.headers['user-agent'],
        cookies: req.cookies,
        query: req.query
      });
      
      // Check authentication - support OAuth, SMS token from cookie, and token from query
      const cookieToken = req.cookies?.gabai_token;
      const queryToken = req.query.token as string | undefined;
      const tokenToUse = queryToken || cookieToken;
      let authenticatedUserId: string | null = null;
      
      if (tokenToUse) {
        try {
          const decoded = JSON.parse(Buffer.from(tokenToUse, 'base64').toString());
          authenticatedUserId = decoded.userId;
          console.log('📅 SMS token authenticated for calendar export', queryToken ? '(from URL)' : '(from cookie)');
        } catch (e) {
          console.error('📅 Token decode error:', e);
        }
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        authenticatedUserId = (req.user as any).id;
        console.log('📅 OAuth authenticated for calendar export');
      }
      
      // Allow download if authenticated user matches or no auth (public calendar)
      if (authenticatedUserId && authenticatedUserId !== userId) {
        console.log('📅 User mismatch - authenticated as:', authenticatedUserId, 'requesting:', userId);
        return res.status(403).json({ message: "Cannot download another user's calendar" });
      }
      
      const reminders = await storage.getReminders(userId);
      const user = await storage.getUser(userId);

      console.log('📅 Found user:', !!user, 'Reminders count:', reminders.length);

      if (!user) {
        console.log('📅 No user found with ID:', userId);
        // For APK testing, create a minimal fallback response
        const calendar = ical({
          name: `GabAi Calendar`,
          description: "Appointments and reminders from GabAi",
          timezone: "America/New_York",
        });
        
        // Set proper headers for APK download
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="gabai-calendar.ics"');
        res.setHeader('Cache-Control', 'no-cache');
        
        console.log('📅 Sending fallback calendar file for APK');
        return res.send(calendar.toString());
      }

      // Use user's timezone preference, fall back to auto-detected or default
      const userTimezone = user.timezone || "America/New_York";
      
      // Create calendar
      const calendar = ical({
        name: `${user.name || user.email}'s GabAi Calendar`,
        description: "Appointments and reminders from GabAi",
        timezone: userTimezone,
        url: `${req.protocol}://${req.get('host')}/api/calendar/export/${userId}`,
      });

      // Add reminders as calendar events with proper timezone handling
      reminders.forEach((reminder) => {
        // Convert the stored time to the user's timezone, then create a "floating" time
        // This prevents double timezone conversion during calendar import
        const originalDate = new Date(reminder.dueDate);
        
        // Create a new date that represents the local time in the user's timezone
        // but without timezone offset (floating time)
        const localTimeString = originalDate.toLocaleString('en-CA', { 
          timeZone: userTimezone,
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        
        const startTime = new Date(localTimeString);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        
        console.log(`Calendar export: ${reminder.title} - Original: ${originalDate.toISOString()}, Local: ${localTimeString}, Final: ${startTime.toISOString()}`);
        
        calendar.createEvent({
          start: startTime,
          end: endTime,
          summary: reminder.title,
          description: reminder.description || '',
          location: reminder.category === 'appointment' ? user.location || '' : '',
          categories: [{ name: reminder.category || 'reminder' }],
          created: reminder.createdAt,
          lastModified: reminder.updatedAt,
          floating: true, // This creates a "floating" time that won't be converted
        });
      });

      // Set headers for ICS file download - enhanced for APK/WebView compatibility
      const calendarContent = calendar.toString();
      
      // Detect if request is from APK/WebView
      const userAgent = req.headers['user-agent'] || '';
      const isAPK = /Android/i.test(userAgent) || /\bwv\b/.test(userAgent);
      
      if (isAPK) {
        console.log('📱 APK/WebView detected - using enhanced download headers');
        // For Android WebView, use application/octet-stream to force download
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="gabai-calendar-${user.name || 'user'}.ics"`);
        res.setHeader('Content-Length', Buffer.byteLength(calendarContent));
        // Additional headers to force download in WebView
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        // Standard browser headers
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="gabai-calendar-${user.name || 'user'}.ics"`);
      }
      
      // Send the ICS file
      res.send(calendarContent);
    } catch (error: any) {
      console.error("Calendar export error:", error);
      res.status(500).json({ message: "Failed to export calendar" });
    }
  });

  // Sync single reminder to calendar
  app.get("/api/calendar/event/:reminderId", async (req, res) => {
    try {
      const { reminderId } = req.params;
      
      // Check authentication - support OAuth, SMS token from cookie, and token from query
      const cookieToken = req.cookies?.gabai_token;
      const queryToken = req.query.token as string | undefined;
      const tokenToUse = queryToken || cookieToken;
      let authenticatedUserId: string | null = null;
      
      if (tokenToUse) {
        try {
          const decoded = JSON.parse(Buffer.from(tokenToUse, 'base64').toString());
          authenticatedUserId = decoded.userId;
          console.log('📅 SMS token authenticated for event export', queryToken ? '(from URL)' : '(from cookie)');
        } catch (e) {
          console.error('📅 Token decode error:', e);
        }
      } else if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        authenticatedUserId = (req.user as any).id;
        console.log('📅 OAuth authenticated for event export');
      }
      
      const reminder = await storage.getReminder(reminderId);

      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }

      const user = await storage.getUser(reminder.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Use user's timezone preference
      const userTimezone = user.timezone || "America/New_York";
      
      // Create single event calendar
      const calendar = ical({
        name: `GabAi Event: ${reminder.title}`,
        description: "Single event from GabAi",
        timezone: userTimezone,
      });

      // Create proper Date objects with timezone handling to prevent import time shifts
      const originalDate = new Date(reminder.dueDate);
      
      // Create a "floating" time that represents the local time without timezone conversion
      const localTimeString = originalDate.toLocaleString('en-CA', { 
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const startTime = new Date(localTimeString);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      console.log(`Single event export: ${reminder.title} - Original: ${originalDate.toISOString()}, Local: ${localTimeString}, Final: ${startTime.toISOString()}`);
      
      calendar.createEvent({
        start: startTime,
        end: endTime,
        summary: reminder.title,
        description: reminder.description || '',
        location: reminder.category === 'appointment' ? user.location || '' : '',
        categories: [{ name: reminder.category || 'reminder' }],
        created: reminder.createdAt,
        lastModified: reminder.updatedAt,
        floating: true, // This creates a "floating" time that won't be converted during import
      });

      // Enhanced headers for APK/WebView compatibility
      const calendarContent = calendar.toString();
      
      // Detect if request is from APK/WebView
      const userAgent = req.headers['user-agent'] || '';
      const isAPK = /Android/i.test(userAgent) || /\bwv\b/.test(userAgent);
      
      if (isAPK) {
        console.log('📱 APK/WebView detected for event - using enhanced download headers');
        // For Android WebView, use application/octet-stream to force download
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="gabai-${reminder.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics"`);
        res.setHeader('Content-Length', Buffer.byteLength(calendarContent));
        // Additional headers to force download in WebView
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        // Standard browser headers
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="gabai-${reminder.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics"`);
      }
      
      res.send(calendarContent);
    } catch (error: any) {
      console.error("Single event export error:", error);
      res.status(500).json({ message: "Failed to export event" });
    }
  });

  // Generate Smart List Name endpoint  
  app.post("/api/generate-list-name", async (req, res) => {
    try {
      const { userId, profession } = req.body;
      
      // Get user data for context
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get recent user activity for context (last 5 lists)
      const recentLists = await storage.getSmartLists(userId);
      const recentActivity = recentLists
        .slice(0, 5)
        .map(list => list.name);

      const result = await generateSmartListName(user, recentActivity);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating smart list name:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Smart relabel list route
  app.post("/api/relabel-list", async (req, res) => {
    try {
      const { listId, currentName, items, listType } = req.body;
      
      if (!listId || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate smart name based on list contents
      const prompt = `Based on the following list items, suggest a better, more descriptive name for this list:

Current name: "${currentName}"
List type: ${listType}
Items: ${items.join(', ')}

Suggest a concise, descriptive name (2-4 words) that captures what this list is really about. Return only the suggested name, nothing else.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
        temperature: 0.3
      });

      const newName = completion.choices[0]?.message?.content?.trim() || currentName;
      
      // Update the list name
      await storage.updateSmartList(listId, { name: newName });
      
      res.json({ newName });
    } catch (error: any) {
      console.error("Error relabeling list:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Smart lists routes
  app.get("/api/smart-lists/:userId", async (req, res) => {
    try {
      const lists = await storage.getSmartLists(req.params.userId);
      res.json(lists);
    } catch (error: any) {
      console.error("Get smart lists error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/smart-lists", jsonParser, async (req, res) => {
    try {
      const listData = insertSmartListSchema.parse(req.body);
      const list = await storage.createSmartList(listData);
      res.json(list);
    } catch (error: any) {
      console.error("Create smart list error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/smart-lists/:id", jsonParser, async (req, res) => {
    try {
      const updates = insertSmartListSchema.partial().parse(req.body);
      const list = await storage.updateSmartList(req.params.id, updates);
      res.json(list);
    } catch (error: any) {
      console.error("Update smart list error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/smart-lists/:id", async (req, res) => {
    try {
      await storage.deleteSmartList(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete smart list error:", error);
      res.status(500).json({ message: error.message });
    }
  });



  app.post("/api/smart-lists/join", jsonParser, async (req, res) => {
    try {
      const { shareCode, userId } = req.body;
      if (!shareCode || !userId) {
        return res.status(400).json({ message: "Share code and user ID are required" });
      }
      const list = await storage.joinSharedList(shareCode, userId);
      res.json(list);
    } catch (error: any) {
      console.error("Join shared list error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // List items routes  
  app.post("/api/list-items", jsonParser, async (req, res) => {
    try {
      const itemData = insertListItemSchema.parse(req.body);
      const userId = req.user?.id || req.body.userId;
      
      // Check if user can edit this list
      if (userId && itemData.listId) {
        const canEdit = await storage.canUserEditList(userId, itemData.listId);
        if (!canEdit) {
          return res.status(403).json({ message: "You don't have permission to add items to this list" });
        }
      }
      
      const item = await storage.createListItem(itemData);
      res.json(item);
    } catch (error: any) {
      console.error("Create list item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/list-items/:id", jsonParser, async (req, res) => {
    try {
      const updates = insertListItemSchema.partial().parse(req.body);
      const userId = req.user?.id || req.body.userId;
      
      // Get the item to check permissions
      if (userId) {
        const existingItem = await storage.getListItem(req.params.id);
        if (existingItem) {
          const canEdit = await storage.canUserEditList(userId, existingItem.listId);
          if (!canEdit) {
            return res.status(403).json({ message: "You don't have permission to edit items in this list" });
          }
        }
      }
      
      const item = await storage.updateListItem(req.params.id, updates);
      res.json(item);
    } catch (error: any) {
      console.error("Update list item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Toggle list item completion
  app.patch("/api/list-items/:id/toggle", async (req, res) => {
    try {
      const userId = req.user?.id || req.body.userId;
      
      // Get the item to check permissions
      if (userId) {
        const existingItem = await storage.getListItem(req.params.id);
        if (existingItem) {
          const canEdit = await storage.canUserEditList(userId, existingItem.listId);
          if (!canEdit) {
            return res.status(403).json({ message: "You don't have permission to edit items in this list" });
          }
        }
      }
      
      const item = await storage.toggleListItem(req.params.id);
      res.json(item);
    } catch (error: any) {
      console.error("Toggle list item error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/list-items/:id", async (req, res) => {
    try {
      const userId = req.user?.id || req.body.userId;
      
      // Get the item to check permissions
      if (userId) {
        const existingItem = await storage.getListItem(req.params.id);
        if (existingItem) {
          const canEdit = await storage.canUserEditList(userId, existingItem.listId);
          if (!canEdit) {
            return res.status(403).json({ message: "You don't have permission to delete items from this list" });
          }
        }
      }
      
      await storage.deleteListItem(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete list item error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Share list endpoint
  app.post("/api/smart-lists/:id/share", jsonParser, async (req, res) => {
    try {
      const { id } = req.params;
      console.log('🔗 Sharing list with ID:', id);
      const shareCode = await storage.shareSmartList(id);
      console.log('🔗 Generated share code:', shareCode);
      res.json({ shareCode });
    } catch (error) {
      console.error("Share list error:", error);
      res.status(500).json({ message: "Failed to share list" });
    }
  });

  // Get shared list endpoint
  app.get("/api/shared/:shareCode", async (req, res) => {
    try {
      const { shareCode } = req.params;
      const sharedList = await storage.getSharedList(shareCode);
      if (!sharedList) {
        return res.status(404).json({ message: "Shared list not found" });
      }
      res.json(sharedList);
    } catch (error) {
      console.error("Get shared list error:", error);
      res.status(500).json({ message: "Failed to get shared list" });
    }
  });

  // Update share mode for a list
  app.post("/api/smart-lists/:listId/share-mode", jsonParser, async (req, res) => {
    try {
      const { listId } = req.params;
      const { shareMode } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Validate share mode
      if (!['view', 'edit'].includes(shareMode)) {
        return res.status(400).json({ message: "Invalid share mode. Must be 'view' or 'edit'" });
      }

      // Check if user owns the list
      const list = await storage.getSmartList(listId);
      if (!list || list.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this list" });
      }

      const updatedList = await storage.updateSmartList(listId, { shareMode });
      res.json(updatedList);
    } catch (error: any) {
      console.error("Update share mode error:", error);
      res.status(500).json({ message: "Failed to update share mode" });
    }
  });

  // Add collaborator to list endpoint
  app.post("/api/smart-lists/:id/collaborators", async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const collaborator = await storage.getUserByEmail(email);
      if (!collaborator) {
        return res.status(404).json({ message: "User not found with this email" });
      }

      const updatedList = await storage.addCollaborator(id, collaborator.id);
      res.json(updatedList);
    } catch (error) {
      console.error("Add collaborator error:", error);
      res.status(500).json({ message: "Failed to add collaborator" });
    }
  });

  // AI Categorization endpoint
  app.post("/api/categorize-item", async (req, res) => {
    try {
      const { itemName, listType } = req.body;
      
      if (!itemName || !listType) {
        return res.status(400).json({ error: 'Missing itemName or listType' });
      }
      
      const result = await categorizeItem(itemName, listType);
      res.json(result);
    } catch (error: any) {
      console.error('Categorization error:', error);
      res.status(500).json({ error: 'Categorization failed', category: 'Other' });
    }
  });

  // Search users by email endpoint
  app.get("/api/users/search", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email query parameter is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return basic user info for privacy
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.error("Search user error:", error);
      res.status(500).json({ message: "Failed to search user" });
    }
  });

  // Contact routes
  app.get("/api/contacts/:userId", async (req, res) => {
    try {
      const contacts = await storage.getContacts(req.params.userId);
      res.json(contacts);
    } catch (error: any) {
      console.error("Get contacts error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = req.body;
      const contact = await storage.createContact(contactData);
      res.json(contact);
    } catch (error: any) {
      console.error("Create contact error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const contactId = req.params.id;
      const updates = req.body;
      console.log(`📝 Updating contact ${contactId}:`, updates);
      
      const updatedContact = await storage.updateContact(contactId, updates);
      res.json(updatedContact);
    } catch (error: any) {
      console.error("Update contact error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const contactId = req.params.id;
      console.log(`🗑️ Deleting contact ${contactId}`);
      
      await storage.deleteContact(contactId);
      res.json({ success: true, message: "Contact deleted successfully" });
    } catch (error: any) {
      console.error("Delete contact error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contacts/:id/vcard", async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const vcard = generateVCard(contact);
      const filename = `${contact.firstName || 'contact'}_${contact.lastName || ''}.vcf`.replace(/\s+/g, '_');
      
      res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(vcard);
    } catch (error: any) {
      console.error("VCard generation error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced OCR endpoint for business card processing
  app.post("/api/ocr/business-card", upload.single("image"), async (req, res) => {
    try {
      console.log("📄 Business card processing started");
      
      if (!req.file) {
        console.log("❌ No image file provided");
        return res.status(400).json({ message: "Image file is required" });
      }

      const { userId } = req.body;
      if (!userId) {
        console.log("❌ No user ID provided");
        return res.status(400).json({ message: "User ID is required" });
      }

      console.log(`📸 Processing image for user: ${userId}`);
      console.log(`📐 Image size: ${req.file.size} bytes`);

      // Convert image buffer to base64
      const base64Image = req.file.buffer.toString('base64');
      console.log("🔄 Image converted to base64");
      
      // Extract text using OpenAI Vision
      console.log("🔍 Extracting text with OpenAI Vision...");
      const extractedText = await extractTextFromImage(base64Image);
      console.log(`📝 Extracted text: ${extractedText.substring(0, 100)}...`);
      
      // Extract contact information
      console.log("👤 Parsing contact information...");
      const contactInfo = extractContactFromText(extractedText);
      console.log("📊 Contact info extracted:", contactInfo);
      
      // Check for existing contacts to avoid duplicates
      console.log("🔍 Checking for existing contacts...");
      const existingContacts = await storage.getContactsByUserId(userId);
      
      let existingContact = null;
      if (contactInfo.email) {
        existingContact = existingContacts.find(c => 
          c.email?.toLowerCase() === contactInfo.email?.toLowerCase()
        );
      }
      
      if (!existingContact && contactInfo.phone) {
        // Normalize phone number for comparison (remove spaces, dashes, parentheses)
        const normalizedPhone = contactInfo.phone.replace(/[\s\-\(\)]/g, '');
        existingContact = existingContacts.find(c => {
          const existingPhone = c.phone?.replace(/[\s\-\(\)]/g, '');
          return existingPhone === normalizedPhone;
        });
      }
      
      let newContact;
      if (existingContact) {
        console.log("⚠️ Contact already exists, updating instead...");
        // Update existing contact with new information
        newContact = await storage.updateContact(existingContact.id, {
          ...existingContact,
          ...contactInfo,
          // Merge notes if both exist
          notes: existingContact.notes 
            ? `${existingContact.notes}\n\n[Updated from business card scan]\n${contactInfo.notes || ''}`
            : contactInfo.notes,
          updatedAt: new Date()
        });
        console.log("✅ Contact updated with ID:", newContact.id);
      } else {
        // Create new contact
        console.log("💾 Creating new contact in database...");
        newContact = await storage.createContact({
          ...contactInfo,
          userId,
          source: "business_card"
        });
        console.log("✅ Contact created with ID:", newContact.id);
      }

      // Create follow-up reminder
      console.log("⏰ Creating follow-up reminder...");
      const followUpTitle = `Follow up with ${newContact.firstName || 'new contact'}${newContact.lastName ? ' ' + newContact.lastName : ''}`;
      await storage.createReminder({
        userId,
        title: followUpTitle,
        description: `Contact info from business card:\n${extractedText}`,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        category: "Follow-up"
      });
      console.log("✅ Follow-up reminder created");

      const wasUpdated = existingContact !== null;
      res.json({
        contact: newContact,
        extractedText,
        wasUpdated,
        message: wasUpdated
          ? `Contact updated and follow-up reminder created for ${newContact.firstName || 'contact'}`
          : `New contact created and follow-up reminder created for ${newContact.firstName || 'contact'}`
      });
    } catch (error: any) {
      console.error("❌ Business card OCR error:", error);
      res.status(500).json({ 
        message: error.message,
        details: error.stack 
      });
    }
  });

  // Link shortener routes for affiliate monetization
  app.post("/api/shorten", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      const { shortCode, shortUrl } = await createShortLink(url);
      res.json({ shortCode, shortUrl, originalUrl: url });
    } catch (error: any) {
      console.error("Link shortening error:", error);
      res.status(500).json({ message: "Failed to shorten link" });
    }
  });

  // Test endpoint to verify affiliate link processing
  // Test email endpoint
  app.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      console.log(`🧪 Testing email to: ${email}`);
      
      // Generate a test token
      const testToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const result = await sendMagicLink(email, testToken, 'Test Device', req.get('host'));
      
      res.json({
        success: result.success,
        message: result.success 
          ? "Test email sent successfully! Check your inbox."
          : "Email sending failed, but logged for debugging",
        details: result
      });
      
    } catch (error: any) {
      console.error('❌ Test email failed:', error);
      res.status(500).json({ 
        error: "Failed to send test email",
        details: error.message 
      });
    }
  });

  app.post("/api/test-affiliate", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text content is required" });
      }
      
      const processedText = await processUrlsInContent(text);
      res.json({ 
        original: text,
        processed: processedText,
        affiliateCode: "floater01b-20"
      });
    } catch (error: any) {
      console.error("Affiliate test error:", error);
      res.status(500).json({ message: "Failed to process affiliate links" });
    }
  });

  // Link redirect endpoint (handles short link clicks)
  app.get("/l/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const longUrl = await getLongUrl(shortCode);
      
      if (!longUrl) {
        return res.status(404).json({ message: "Link not found or expired" });
      }
      
      // Redirect to the original (affiliate) URL
      res.redirect(302, longUrl);
    } catch (error: any) {
      console.error("Link redirect error:", error);
      res.status(500).json({ message: "Redirect failed" });
    }
  });

  // Link analytics endpoint (optional)
  app.get("/api/link-stats", async (req, res) => {
    try {
      const stats = await getLinkStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Link stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });


  // Metabase analytics proxy endpoint (optional)
  app.get("/api/analytics/embed/:dashboardId", async (req, res) => {
    try {
      // This endpoint can be used to embed Metabase dashboards
      // For now, just redirect to the analytics setup page
      res.json({ 
        message: "Analytics dashboard available at http://localhost:3000",
        setup: "Run: docker run -d -p 3000:3000 metabase/metabase",
        dashboardId: req.params.dashboardId
      });
    } catch (error: any) {
      console.error("Analytics embed error:", error);
      res.status(500).json({ message: "Failed to load analytics" });
    }
  });

  // Protected analytics data endpoint
  app.get("/api/analytics/summary", isAuthenticated, async (req, res) => {
    try {
      const [
        totalUsers,
        totalMessages, 
        totalLists,
        totalReminders,
        totalContacts,
        linkStats,
        recentUsers
      ] = await Promise.all([
        storage.getUserCount(),
        storage.getMessageCount(),
        storage.getSmartListCount(),
        storage.getReminderCount(),
        storage.getContactCount(),
        getLinkStats(),
        storage.getRecentUsers(10)
      ]);

      const summary = {
        totalUsers,
        totalMessages,
        totalLists,
        totalReminders,
        totalContacts,
        linkClicks: linkStats.totalClicks,
        totalLinks: linkStats.totalLinks,
        recentUsers,
        timestamp: new Date().toISOString()
      };

      res.json(summary);
    } catch (error: any) {
      console.error("Analytics summary error:", error);
      res.status(500).json({ message: "Failed to get analytics summary" });
    }
  });

  // Comprehensive analytics endpoint with enhanced data
  app.get("/api/analytics/comprehensive", isAuthenticated, async (req, res) => {
    try {
      const [
        totalUsers,
        totalMessages, 
        totalLists,
        totalReminders,
        totalContacts,
        linkStats,
        recentUsers,
        userGrowthData,
        locationData,
        timezoneData,
        demographicsData,
        conversationData,
        featureUsageData,
        revenueData,
        systemHealth
      ] = await Promise.all([
        storage.getUserCount(),
        storage.getMessageCount(),
        storage.getSmartListCount(),
        storage.getReminderCount(),
        storage.getContactCount(),
        getLinkStats(),
        storage.getRecentUsers(10),
        storage.getUserGrowthMetrics(),
        storage.getUserLocationData(),
        storage.getUserTimezoneData(),
        storage.getUserDemographics(),
        storage.getConversationMetrics(),
        storage.getFeatureUsageMetrics(),
        storage.getRevenueMetrics(),
        storage.getSystemHealthMetrics()
      ]);

      const comprehensive = {
        // Basic metrics (backward compatibility)
        totalUsers: totalUsers.toString(),
        totalMessages: totalMessages.toString(),
        totalLists: totalLists.toString(),
        linkClicks: linkStats.totalClicks,
        timestamp: new Date().toISOString(),

        // Enhanced user analytics
        userGrowth: {
          daily: userGrowthData.daily || 0,
          weekly: userGrowthData.weekly || 0,
          monthly: userGrowthData.monthly || 0
        },
        usersByLocation: locationData || [],
        usersByTimezone: timezoneData || [],
        userDemographics: {
          averageAge: demographicsData.averageAge || 0,
          professions: demographicsData.professions || [],
          onboardingCompletion: demographicsData.onboardingCompletion || 0
        },

        // Conversation analytics
        conversationMetrics: {
          totalConversations: conversationData.totalConversations || 0,
          averageMessagesPerConversation: conversationData.averageMessagesPerConversation || 0,
          averageResponseTime: conversationData.averageResponseTime || 500,
          topTopics: conversationData.topTopics || [],
          voiceUsagePercent: conversationData.voiceUsagePercent || 0,
          messagesLast24h: conversationData.messagesLast24h || 0,
          messagesLast7d: conversationData.messagesLast7d || 0,
          messagesLast30d: conversationData.messagesLast30d || 0
        },

        // Feature usage
        featureUsage: {
          smartListsCreated: totalLists || 0,
          remindersSet: totalReminders || 0,
          voiceTranscriptions: featureUsageData.voiceTranscriptions || 0,
          linksShortenedToday: featureUsageData.linksShortenedToday || 0,
          ocrProcessed: featureUsageData.ocrProcessed || 0,
          contactsCreated: totalContacts || 0
        },

        // Revenue analytics
        revenueMetrics: {
          totalRevenue: revenueData.totalRevenue || 0,
          revenueToday: revenueData.revenueToday || 0,
          revenueThisMonth: revenueData.revenueThisMonth || 0,
          topPerformingLinks: revenueData.topPerformingLinks || [],
          conversionRate: revenueData.conversionRate || 0,
          averageCommission: revenueData.averageCommission || 2.50
        },

        // System performance
        systemMetrics: {
          uptime: systemHealth.uptime || 99.9,
          apiResponseTime: systemHealth.apiResponseTime || 250,
          errorRate: systemHealth.errorRate || 0.1,
          databaseConnections: systemHealth.databaseConnections || 5,
          storageUsed: systemHealth.storageUsed || 15,
          openaiApiCalls: systemHealth.openaiApiCalls || 0,
          elevenlabsCalls: systemHealth.elevenlabsCalls || 0
        },

        // Real-time data
        realTimeMetrics: {
          activeUsers: Math.floor(totalUsers * 0.1) || 0, // Estimate 10% active
          onlineUsers: Math.floor(totalUsers * 0.05) || 0, // Estimate 5% online
          currentConversations: Math.floor(totalUsers * 0.02) || 0, // Estimate 2% in conversation
          averageSessionDuration: 1800 // 30 minutes average
        }
      };

      res.json(comprehensive);
    } catch (error: any) {
      console.error("Comprehensive analytics error:", error);
      res.status(500).json({ message: "Failed to get comprehensive analytics" });
    }
  });

  // Pattern recognition and proactive suggestions
  app.get("/api/users/:userId/suggestions", async (req, res) => {
    try {
      const suggestions = await generateProactiveSuggestions(req.params.userId);
      res.json({ suggestions });
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // User profiles endpoint for detailed personal information
  app.get("/api/analytics/user-profiles", async (req, res) => {
    try {
      // Always allow access in development mode for debugging
      console.log("📋 User profiles endpoint accessed");
      console.log("🔐 Auth status:", req.isAuthenticated?.() ? "authenticated" : "not authenticated");
      console.log("👤 User:", (req.user as any)?.email || "none");

      console.log("📋 Fetching user profiles for analytics...");
      const userProfiles = await storage.getUserProfiles();
      console.log(`📋 Found ${userProfiles.length} user profiles`);
      res.json(userProfiles);
    } catch (error: any) {
      console.error("User profiles error:", error);
      res.status(500).json({ message: "Failed to get user profiles" });
    }
  });

  // Mount ElevenLabs routes for AI voice generation
  app.use('/api/elevenlabs', elevenlabsRouter);

  // Mount APK download routes for beta testing
  registerApkRoutes(app);

  // APK Download Route for direct access
  app.get("/download-apk", (req, res) => {
    try {
      const apkPath = path.join(process.cwd(), 'attached_assets', 'GabAi.debug.v1.0.0 (40)_1755489528833.apk');
      console.log('📱 APK Download requested - serving NEW BUILD #40:', apkPath);
      
      if (!fs.existsSync(apkPath)) {
        return res.status(404).send(`
          <html>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h1>🚫 APK Not Found</h1>
              <p>The APK file is not available at this location.</p>
              <p>File path: ${apkPath}</p>
            </body>
          </html>
        `);
      }
      
      const stat = fs.statSync(apkPath);
      
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="GabAi.apk"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(apkPath);
      fileStream.pipe(res);
      
    } catch (error: any) {
      console.error('Error serving APK:', error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1>❌ Download Error</h1>
            <p>Failed to serve APK file: ${error.message}</p>
          </body>
        </html>
      `);
    }
  });

  // Simple download route
  app.get("/gabai-mobile.zip", (req, res) => {
    const zipPath = path.join(process.cwd(), "public/gabai-mobile.zip");
    res.download(zipPath, "gabai-mobile.zip");
  });

  // VoltBuilder Ready Package Route
  app.get("/gabai-VOLTBUILDER-READY.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-VOLTBUILDER-READY.zip");
      console.log("📦 Serving VoltBuilder package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("VoltBuilder package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-VOLTBUILDER-READY.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving VoltBuilder package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v77 - Icon & UI Fixes
  app.get("/gabai-v77.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v77.zip");
      console.log("📦 Serving GabAI v77 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v77 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v77.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v77 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v79 - Critical Permissions & Sharing Fixes
  app.get("/gabai-v79.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v79.zip");
      console.log("📦 Serving GabAI v79 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v79 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v79.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v79 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v80 - Debug Logging for List Operations
  app.get("/gabai-v80.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v80.zip");
      console.log("📦 Serving GabAI v80 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v80 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v80.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v80 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v81 - Button Click Debug Logging
  app.get("/gabai-v81.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v81.zip");
      console.log("📦 Serving GabAI v81 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v81 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v81.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v81 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v82 - Mobile Button Visibility Fix
  app.get("/gabai-v82.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v82.zip");
      console.log("📦 Serving GabAI v82 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v82 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v82.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v82 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v78 - Share Mode Permissions & Icon Fixes
  app.get("/gabai-v78.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v78.zip");
      console.log("📦 Serving GabAI v78 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v78 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v78.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v78 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v76 - SDK 35 Configuration Fix
  app.get("/gabai-v76.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v76.zip");
      console.log("📦 Serving GabAI v76 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v76 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v76.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v76 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v75 - Editable Shared Lists & Checkbox Fixes
  app.get("/gabai-v75.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v75.zip");
      console.log("📦 Serving GabAI v75 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v75 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v75.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v75 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v30 - Bulletproof Fixes: Blob-based camera + enhanced fetch shim
  app.get("/gabai-v30.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v30.zip");
      console.log("📦 Serving GabAI v30 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v30 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v30.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v30 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v29 - ChatGPT Complete Fix: credentials omit + data URL normalization
  app.get("/gabai-v29.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v29.zip");
      console.log("📦 Serving GabAI v29 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v29 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v29.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v29 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v28 - Request Object Fix: Properly track URL separately from input
  app.get("/gabai-v28.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v28.zip");
      console.log("📦 Serving GabAI v28 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v28 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v28.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v28 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v27 - Auth Fix: Handle Request objects properly and check sessionStorage
  app.get("/gabai-v27.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v27.zip");
      console.log("📦 Serving GabAI v27 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v27 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v27.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v27 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v26 - ChatGPT Fixes: Clean fetch shim and data URL to blob conversion
  app.get("/gabai-v26.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v26.zip");
      console.log("📦 Serving GabAI v26 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v26 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v26.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v26 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v25 - Data URL Fix: Skip auth headers for data URLs
  app.get("/gabai-v25.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v25.zip");
      console.log("📦 Serving GabAI v25 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v25 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v25.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v25 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v24 - Auth Fix: Handle both relative and absolute URLs
  app.get("/gabai-v24.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v24.zip");
      console.log("📦 Serving GabAI v24 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v24 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v24.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v24 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v23 - Loop Fix: Strip all prefixes and fixed transcription
  app.get("/gabai-v23.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v23.zip");
      console.log("📦 Serving GabAI v23 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v23 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v23.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v23 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v22 - Complete Fix: Better regex stripping and audio compatibility
  app.get("/gabai-v22.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v22.zip");
      console.log("📦 Serving GabAI v22 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v22 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v22.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v22 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v21 - The Real Fix: Native Blobs and proper prefix handling
  app.get("/gabai-v21.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v21.zip");
      console.log("📦 Serving GabAI v21 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v21 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v21.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v21 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v20 - Fixed File type property and camera detection
  app.get("/gabai-v20.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v20.zip");
      console.log("📦 Serving GabAI v20 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v20 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v20.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v20 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v19 - Fixed File/Blob conversion and camera handling
  app.get("/gabai-v19.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v19.zip");
      console.log("📦 Serving GabAI v19 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v19 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v19.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v19 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v18 - Media plugin for direct audio recording
  app.get("/gabai-v18.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v18.zip");
      console.log("📦 Serving GabAI v18 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v18 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v18.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v18 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v17 - Direct Cordova API usage (no permission wrappers)
  app.get("/gabai-v17.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v17.zip");
      console.log("📦 Serving GabAI v17 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v17 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v17.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v17 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v16 - BUNDLED APP with proper Cordova plugin implementation
  app.get("/gabai-v16.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v16.zip");
      console.log("📦 Serving GabAI v16 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v16 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v16.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v16 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v15 - BUNDLED APP with no redundant permission checks
  app.get("/gabai-v15.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v15.zip");
      console.log("📦 Serving GabAI v15 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v15 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v15.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v15 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v14 - BUNDLED APP with microphone-only permission (no storage)
  app.get("/gabai-v14.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v14.zip");
      console.log("📦 Serving GabAI v14 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v14 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v14.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v14 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v13 - BUNDLED APP with explicit permission request flow
  app.get("/gabai-v13.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v13.zip");
      console.log("📦 Serving GabAI v13 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v13 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v13.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v13 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v12 - BUNDLED APP with storage permission fix
  app.get("/gabai-v12.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v12.zip");
      console.log("📦 Serving GabAI v12 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v12 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v12.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v12 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v11 - BUNDLED APP with simplified debugging
  app.get("/gabai-v11.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v11.zip");
      console.log("📦 Serving GabAI v11 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v11 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v11.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v11 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v10 - BUNDLED APP with Cordova initialization
  app.get("/gabai-v10.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v10.zip");
      console.log("📦 Serving GabAI v10 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v10 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v10.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v10 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v9 - BUNDLED APP with Android microphone permission fix
  app.get("/gabai-v9.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v9.zip");
      console.log("📦 Serving GabAI v9 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v9 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v9.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v9 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v8 - BUNDLED APP with permission and API fixes
  app.get("/gabai-v8.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v8.zip");
      console.log("📦 Serving GabAI v8 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v8 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v8.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v8 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v7 - BUNDLED APP with auth navigation fixes
  app.get("/gabai-v7.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v7.zip");
      console.log("📦 Serving GabAI v7 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v7 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v7.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v7 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v6 - BUNDLED APP with hash routing for APK (final fix)
  app.get("/gabai-v6.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v6.zip");
      console.log("📦 Serving GabAI v6 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v6 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v6.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v6 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v5 - BUNDLED APP with routing fixes (fixes 404)
  app.get("/gabai-v5.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v5.zip");
      console.log("📦 Serving GabAI v5 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v5 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v5.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v5 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v4 - BUNDLED APP with relative paths (fixes white screen)
  app.get("/gabai-v4.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v4.zip");
      console.log("📦 Serving GabAI v4 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v4 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v4.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v4 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // GabAI v3 - BUNDLED APP Package (Loads from local files, works offline)
  app.get("/gabai-v3.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-v3.zip");
      console.log("📦 Serving GabAI v3 package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("GabAI v3 package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-v3.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving GabAI v3 package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // BUNDLED APP Package - Loads from local files, not remote
  app.get("/gabai-BUNDLED-APP.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-BUNDLED-APP.zip");
      console.log("📦 Serving BUNDLED APP package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("BUNDLED APP package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-BUNDLED-APP.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving BUNDLED APP package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // FINAL WITH ALL FIXES Package - Complete working APK
  app.get("/gabai-FINAL-WITH-ALL-FIXES.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-FINAL-WITH-ALL-FIXES.zip");
      console.log("📦 Serving FINAL WITH ALL FIXES package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("FINAL WITH ALL FIXES package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-FINAL-WITH-ALL-FIXES.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving FINAL WITH ALL FIXES package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // WITH CORDOVA.JS Package - Native plugins will work
  app.get("/gabai-WITH-CORDOVA.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-WITH-CORDOVA.zip");
      console.log("📦 Serving WITH CORDOVA.JS package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("WITH CORDOVA.JS package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-WITH-CORDOVA.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving WITH CORDOVA.JS package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // FIXED Package - No XML Grafting Errors
  app.get("/gabai-FIXED.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-FIXED.zip");
      console.log("📦 Serving FIXED package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("FIXED package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-FIXED.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving FIXED package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // Native Working Package - Full Native Functionality
  app.get("/gabai-NATIVE-WORKING.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-NATIVE-WORKING.zip");
      console.log("📦 Serving Native Working package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("Native Working package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-NATIVE-WORKING.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving Native Working package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // Final Fix Package - Separated Config Blocks
  app.get("/gabai-FINAL-FIX.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-FINAL-FIX.zip");
      console.log("📦 Serving Final Fix package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("Final Fix package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-FINAL-FIX.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving Final Fix package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // VoltBuilder Ready Package - Final Fixed Version
  app.get("/gabai-VOLTBUILDER-READY.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-VOLTBUILDER-READY.zip");
      console.log("📦 Serving VoltBuilder Ready package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("VoltBuilder Ready package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-VOLTBUILDER-READY.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving VoltBuilder Ready package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // Fixed XML Package
  app.get("/gabai-XML-FIXED.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-XML-FIXED.zip");
      console.log("📦 Serving XML Fixed package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("XML Fixed package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-XML-FIXED.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving XML Fixed package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // Native Plugins Final Package  
  app.get("/gabai-NATIVE-PLUGINS-FINAL.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-NATIVE-PLUGINS-FINAL.zip");
      console.log("📦 Serving Native Plugins Final package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("Native Plugins Final package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-NATIVE-PLUGINS-FINAL.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving Native Plugins Final package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // Final Package with All Fixes
  app.get("/gabai-FINAL-ALL-FIXES.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-FINAL-ALL-FIXES.zip");
      console.log("📦 Serving Final Fixed package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("Final Fixed package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-FINAL-ALL-FIXES.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving Final Fixed package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // Complete Final Package Route  
  app.get("/gabai-COMPLETE-FINAL.zip", (req, res) => {
    try {
      const zipPath = path.join(__dirname, "../dist/public/gabai-COMPLETE-FINAL.zip");
      console.log("📦 Serving Complete Final package from:", zipPath);
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).send("Complete Final package not found");
      }
      
      const stat = fs.statSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="gabai-COMPLETE-FINAL.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving Complete Final package:', error);
      res.status(500).send("Error downloading file");
    }
  });

  // VoltBuilder ZIP Download
  app.get("/download-voltbuilder-zip", (req, res) => {
    try {
      const zipPath = path.join(process.cwd(), "public/GABAI-YOUR-MOBILE-APP.zip");
      console.log("📦 Attempting to serve ZIP from:", zipPath);
      console.log("📁 File exists:", fs.existsSync(zipPath));
      
      if (!fs.existsSync(zipPath)) {
        throw new Error(`VoltBuilder ZIP file not found at: ${zipPath}`);
      }

      const stat = fs.statSync(zipPath);
      console.log("📊 File size:", stat.size, "bytes");

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="GABAI-YOUR-MOBILE-APP.zip"');
      res.setHeader('Content-Length', stat.size);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.on('error', (err) => {
        console.error('❌ File stream error:', err);
        if (!res.headersSent) {
          res.status(500).send('Error reading file');
        }
      });
      
      fileStream.pipe(res);
      
    } catch (error: any) {
      console.error('❌ Error serving VoltBuilder ZIP:', error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1>❌ Download Error</h1>
            <p>Failed to serve VoltBuilder ZIP file: ${error.message}</p>
            <p>Please try again or contact support.</p>
          </body>
        </html>
      `);
    }
  });

  // VoltBuilder Download Page
  app.get("/voltbuilder", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Download GabAi VoltBuilder Package</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  max-width: 600px;
                  margin: 50px auto;
                  padding: 20px;
                  background: #f5f5f5;
                  line-height: 1.6;
              }
              .container {
                  background: white;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  text-align: center;
              }
              .download-btn {
                  display: inline-block;
                  background: #4285f4;
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 5px;
                  font-size: 18px;
                  margin: 20px 0;
              }
              .download-btn:hover {
                  background: #3367d6;
              }
              .instructions {
                  text-align: left;
                  margin-top: 30px;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 5px;
              }
              .step {
                  margin: 10px 0;
                  padding: 10px 0;
                  border-bottom: 1px solid #eee;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>📦 Download GabAi VoltBuilder Package</h1>
              <p>Your SMS auto-fill enabled mobile app package is ready!</p>
              
              <a href="/download-voltbuilder-zip" class="download-btn">
                  📥 Download VoltBuilder ZIP
              </a>
              
              <div class="instructions">
                  <h3>📋 VoltBuilder Instructions:</h3>
                  
                  <div class="step">
                      <strong>Step 1:</strong> Download the ZIP package above
                  </div>
                  
                  <div class="step">
                      <strong>Step 2:</strong> Go to <a href="https://voltbuilder.com" target="_blank">VoltBuilder.com</a> and create an account
                  </div>
                  
                  <div class="step">
                      <strong>Step 3:</strong> Upload the ZIP file to VoltBuilder
                  </div>
                  
                  <div class="step">
                      <strong>Step 4:</strong> Select Android build and start the build process
                  </div>
                  
                  <div class="step">
                      <strong>Step 5:</strong> Download your generated APK and install on your device
                  </div>
              </div>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  ✅ Built: September 4, 2025<br>
                  ✅ Version: 1.0.0 with SMS Auto-fill<br>
                  ✅ Features: Voice chat, Smart lists, SMS verification auto-fill<br>
                  ✅ Size: 236KB (pre-built assets)<br>
                  ✅ Ready for VoltBuilder APK generation
              </p>
          </div>
      </body>
      </html>
    `);
  });

  // APK Download Page
  app.get("/apk", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Download GabAi APK</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  max-width: 600px;
                  margin: 50px auto;
                  padding: 20px;
                  background: #f5f5f5;
                  line-height: 1.6;
              }
              .container {
                  background: white;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  text-align: center;
              }
              .download-btn {
                  display: inline-block;
                  background: #4285f4;
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 5px;
                  font-size: 18px;
                  margin: 20px 0;
              }
              .download-btn:hover {
                  background: #3367d6;
              }
              .instructions {
                  text-align: left;
                  margin-top: 30px;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 5px;
              }
              .step {
                  margin: 10px 0;
                  padding: 10px 0;
                  border-bottom: 1px solid #eee;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>📱 Download GabAi Mobile App</h1>
              <p>Your AI-powered personal assistant is ready!</p>
              
              <a href="/download-apk" class="download-btn">
                  📥 Download GabAi APK
              </a>
              
              <div class="instructions">
                  <h3>📋 Installation Instructions:</h3>
                  
                  <div class="step">
                      <strong>Step 1:</strong> Download the APK file above
                  </div>
                  
                  <div class="step">
                      <strong>Step 2:</strong> On your Android device, go to Settings → Security → Enable "Unknown Sources" or "Install Unknown Apps"
                  </div>
                  
                  <div class="step">
                      <strong>Step 3:</strong> Open the downloaded APK file and tap "Install"
                  </div>
                  
                  <div class="step">
                      <strong>Step 4:</strong> Once installed, open GabAi and sign in with your Google account
                  </div>
                  
                  <div class="step">
                      <strong>Step 5:</strong> Start using your voice-powered AI assistant!
                  </div>
              </div>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  ✅ Built: August 18, 2025 (Build #40)<br>
                  ✅ Version: 1.0.0 (Debug Build)<br>
                  ✅ Features: Voice chat, Smart lists, Google OAuth<br>
                  ✅ Size: 3.6MB<br>
                  ✅ Fixed: White screen issue resolved with real app content
              </p>
          </div>
      </body>
      </html>
    `);
  });

  const httpServer = createServer(app);
  return httpServer;
}
