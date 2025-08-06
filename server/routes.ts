import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePersonalizedResponse, transcribeAudio, extractTextFromImage } from "./services/openai";
import { speechService } from "./services/speech";
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
import passport from "passport";

const upload = multer({ storage: multer.memoryStorage() });

// Helper functions for smart list management
function isShoppingItem(itemName: string): boolean {
  const shoppingKeywords = [
    'milk', 'bread', 'cheese', 'meat', 'fruit', 'vegetable', 'grocery', 'food', 'snack', 'drink', 
    'pastrami', 'deli', 'produce', 'chocolate', 'candy', 'sugar', 'flour', 'eggs', 'butter',
    'coffee', 'tea', 'juice', 'soda', 'water', 'beer', 'wine', 'alcohol', 'cereal', 'pasta',
    'rice', 'beans', 'nuts', 'oil', 'spice', 'sauce', 'condiment', 'frozen', 'canned', 'fresh',
    'organic', 'buy', 'purchase', 'get', 'need', 'want', 'shop', 'store'
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

function isAppointmentItem(itemName: string): boolean {
  const appointmentKeywords = ['appointment', 'meeting', 'call', 'visit', 'consultation', 'dentist', 'doctor', 'interview'];
  return appointmentKeywords.some(keyword => itemName.includes(keyword));
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
      categories: ["Plumbing", "Electrical", "Painting", "Flooring", "HVAC", "General Repairs"]
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
    }
  };
  
  return configs[type as keyof typeof configs] || configs.shopping;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // OAuth routes are handled in auth.ts - no duplicates needed here

  // Simple login endpoint (dev/testing only)
  app.post("/api/simple-login", async (req, res) => {
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

  // Get current authenticated user (OAuth only)
  app.get("/api/auth/user", async (req, res) => {
    try {
      console.log("🔍 Auth check - Is authenticated:", req.isAuthenticated());
      console.log("🔍 Auth check - User:", req.user ? "exists" : "none");
      console.log("🔍 Auth check - Session ID:", req.sessionID);
      console.log("🔍 Auth check - Session data:", req.session);
      
      if (req.isAuthenticated() && req.user) {
        // Ensure we have the latest user data from database
        const currentUser = req.user as any;
        const freshUser = await storage.getUser(currentUser.id);
        
        if (freshUser) {
          res.json(freshUser);
        } else {
          console.error("User not found in database:", currentUser.id);
          res.status(404).json({ message: "User not found" });
        }
      } else {
        // User not authenticated
        res.status(401).json({ message: "Not authenticated" });
      }
    } catch (error: any) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    console.log("🚪 Logout request received");
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Destroy session completely
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Session destroy failed" });
        }
        console.log("✅ User logged out successfully");
        res.json({ message: "Logged out successfully" });
      });
    });
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
      
      // Check if user is authenticated (for OAuth users)
      if (!req.isAuthenticated() || !req.user) {
        console.error("❌ User not authenticated for update");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is trying to update their own profile
      const currentUser = req.user as any;
      if (currentUser.id !== req.params.id) {
        console.error("❌ User trying to update different profile");
        return res.status(403).json({ message: "Cannot update other user's profile" });
      }
      
      const updates = insertUserSchema.partial().parse(req.body);
      console.log("✅ Parsed updates:", updates);
      
      const user = await storage.updateUser(req.params.id, updates);
      console.log("✅ User updated successfully:", user.id);
      
      // Update the session with the new user data
      req.user = user;
      
      res.json(user);
    } catch (error: any) {
      console.error("❌ Update user error:", error);
      res.status(400).json({ message: error.message });
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

  app.post("/api/conversations", async (req, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(conversationData);
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

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error: any) {
      console.error("Create message error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Chat route with AI integration
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userId, conversationId } = req.body;
      
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

      // Generate AI response
      const aiResponse = await generatePersonalizedResponse(message, user, historyForAI);

      // Create conversation if needed
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const conversation = await storage.createConversation({
          userId,
          title: message.substring(0, 50) + "..."
        });
        currentConversationId = conversation.id;
      }

      // Save assistant message
      const assistantMessage = await storage.createMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: aiResponse.content
      });

      // Process any actions from the AI response
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        for (const action of aiResponse.actions) {
          try {
            if (action.type === "create_appointment" && action.data?.appointment) {
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
                } else if (isShoppingItem(itemName)) {
                  targetList = lists.find(list => list.type === "shopping");
                } else if (isPunchListItem(itemName)) {
                  targetList = lists.find(list => list.type === "punch_list");
                } else if (isWaitingListItem(itemName)) {
                  targetList = lists.find(list => list.type === "waiting_list");
                } else {
                  // Default to todo for general tasks, or shopping if it seems like a shopping item
                  if (itemName.includes('buy') || itemName.includes('get') || itemName.includes('purchase')) {
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

              // Add items to the target list
              for (const item of action.data.items) {
                console.log(`Adding item "${item.name || item}" to list "${targetList.name}"`);
                await storage.createListItem({
                  listId: targetList.id,
                  name: item.name || item,
                  category: item.category || "Other"
                });
              }
            }
          } catch (actionError: any) {
            console.error("Error processing action:", actionError);
            // Don't fail the whole response if action processing fails
          }
        }
      }

      // Save user message for response
      const userMessage = await storage.createMessage({
        conversationId: currentConversationId,
        role: "user",
        content: message
      });

      res.json({
        userMessage,
        assistantMessage,
        conversationId: currentConversationId,
        suggestions: aiResponse.suggestions,
        actions: aiResponse.actions
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Voice transcription route
  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      const transcription = await transcribeAudio(req.file.buffer);
      res.json({ text: transcription });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ message: error.message });
    }
  });

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
  app.post("/api/speak", async (req, res) => {
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

  app.patch("/api/shopping-items/:id", async (req, res) => {
    try {
      const item = await storage.updateListItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      console.error("Update shopping item error:", error);
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
  app.get("/api/reminders/:userId", async (req, res) => {
    try {
      const reminders = await storage.getReminders(req.params.userId);
      res.json(reminders);
    } catch (error: any) {
      console.error("Get reminders error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      // Convert dueDate string to Date object if needed
      const bodyWithDate = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date()
      };
      
      const reminderData = insertReminderSchema.parse(bodyWithDate);
      const reminder = await storage.createReminder(reminderData);
      res.json(reminder);
    } catch (error: any) {
      console.error("Create reminder error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/reminders/:id", async (req, res) => {
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

  // Calendar export routes
  app.get("/api/calendar/export/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const reminders = await storage.getReminders(userId);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create calendar
      const calendar = ical({
        name: `${user.name || user.email}'s GabAi Calendar`,
        description: "Appointments and reminders from GabAi",
        timezone: "America/New_York", // EST/EDT
        url: `${req.protocol}://${req.get('host')}/api/calendar/export/${userId}`,
      });

      // Add reminders as calendar events with proper timezone handling
      reminders.forEach((reminder) => {
        // Create proper Date objects ensuring timezone consistency
        const startTime = new Date(reminder.dueDate);
        const endTime = new Date(reminder.dueDate.getTime() + 60 * 60 * 1000); // 1 hour duration
        
        console.log(`Calendar export: ${reminder.title} at ${startTime.toISOString()} (EST: ${startTime.toLocaleString('en-US', { timeZone: 'America/New_York' })})`);
        
        calendar.createEvent({
          start: startTime,
          end: endTime,
          summary: reminder.title,
          description: reminder.description || '',
          location: reminder.category === 'appointment' ? user.location || '' : '',
          categories: [{ name: reminder.category || 'reminder' }],
          // status: reminder.completed ? 'CONFIRMED' : 'TENTATIVE',
          created: reminder.createdAt,
          lastModified: reminder.updatedAt,
          timezone: 'America/New_York', // Explicit timezone per event
        });
      });

      // Set headers for ICS file download
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="gabai-calendar-${user.name || 'user'}.ics"`);
      
      // Send the ICS file
      res.send(calendar.toString());
    } catch (error: any) {
      console.error("Calendar export error:", error);
      res.status(500).json({ message: "Failed to export calendar" });
    }
  });

  // Sync single reminder to calendar
  app.get("/api/calendar/event/:reminderId", async (req, res) => {
    try {
      const { reminderId } = req.params;
      const reminder = await storage.getReminder(reminderId);

      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }

      const user = await storage.getUser(reminder.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create single event calendar
      const calendar = ical({
        name: `GabAi Event: ${reminder.title}`,
        description: "Single event from GabAi",
        timezone: "America/New_York",
      });

      // Create proper Date objects with timezone handling
      const startTime = new Date(reminder.dueDate);
      const endTime = new Date(reminder.dueDate.getTime() + 60 * 60 * 1000);
      
      console.log(`Single event export: ${reminder.title} at ${startTime.toISOString()} (EST: ${startTime.toLocaleString('en-US', { timeZone: 'America/New_York' })})`);
      
      calendar.createEvent({
        start: startTime,
        end: endTime,
        summary: reminder.title,
        description: reminder.description || '',
        location: reminder.category === 'appointment' ? user.location || '' : '',
        categories: [{ name: reminder.category || 'reminder' }],
        // status: reminder.completed ? 'CONFIRMED' : 'TENTATIVE',
        created: reminder.createdAt,
        lastModified: reminder.updatedAt,
        timezone: 'America/New_York', // Explicit timezone per event
      });

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="gabai-${reminder.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics"`);
      
      res.send(calendar.toString());
    } catch (error: any) {
      console.error("Single event export error:", error);
      res.status(500).json({ message: "Failed to export event" });
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

  app.post("/api/smart-lists", async (req, res) => {
    try {
      const listData = insertSmartListSchema.parse(req.body);
      const list = await storage.createSmartList(listData);
      res.json(list);
    } catch (error: any) {
      console.error("Create smart list error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/smart-lists/:id", async (req, res) => {
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

  app.post("/api/smart-lists/:id/share", async (req, res) => {
    try {
      const shareCode = await storage.shareList(req.params.id);
      res.json({ shareCode });
    } catch (error: any) {
      console.error("Share list error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/smart-lists/join", async (req, res) => {
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
  app.post("/api/list-items", async (req, res) => {
    try {
      const itemData = insertListItemSchema.parse(req.body);
      const item = await storage.createListItem(itemData);
      res.json(item);
    } catch (error: any) {
      console.error("Create list item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/list-items/:id", async (req, res) => {
    try {
      const updates = insertListItemSchema.partial().parse(req.body);
      const item = await storage.updateListItem(req.params.id, updates);
      res.json(item);
    } catch (error: any) {
      console.error("Update list item error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/list-items/:id", async (req, res) => {
    try {
      await storage.deleteListItem(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete list item error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Share list endpoint
  app.post("/api/smart-lists/:id/share", async (req, res) => {
    try {
      const { id } = req.params;
      const shareCode = await storage.shareSmartList(id);
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

  const httpServer = createServer(app);
  return httpServer;
}
