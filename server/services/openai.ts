import OpenAI from "openai";
import type { User, UserPattern } from "@shared/schema";
import { generateProactiveContext } from "./pattern-recognition";
import { storage } from "../storage";
import { censorText } from "./profanity";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export interface AIResponse {
  content: string;
  suggestions?: string[];
  actions?: Array<{
    type: "add_to_list" | "create_appointment" | "create_reminder" | "schedule_event" | "create_contact";
    data: any;
  }>;
}

// Approximate token counting (rough estimate: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Smart conversation history management
function prepareConversationContext(
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number = 6000 // Reserve ~2000 tokens for response, system prompt, and new message
): Array<{ role: "user" | "assistant"; content: string }> {
  // Use full conversation by default
  let selectedMessages = [...conversationHistory];
  let totalTokens = selectedMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  
  // If conversation is too long, intelligently trim while keeping context
  if (totalTokens > maxTokens) {
    // Keep recent messages (last 20) and important early context (first 4)
    const recentMessages = conversationHistory.slice(-20);
    const earlyContext = conversationHistory.slice(0, 4);
    
    // Combine early context with recent messages
    selectedMessages = [
      ...earlyContext,
      { role: "assistant" as const, content: "[Earlier conversation context omitted for length]" },
      ...recentMessages
    ];
    
    // If still too long, just use recent messages
    totalTokens = selectedMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
    if (totalTokens > maxTokens) {
      selectedMessages = recentMessages;
    }
  }
  
  return selectedMessages;
}

export async function generatePersonalizedResponse(
  userMessage: string,
  user: User,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  imageData?: string
): Promise<AIResponse> {
  try {
    // CRITICAL: Filter user input for profanity before processing (mandatory)
    const cleanUserMessage = censorText(userMessage, 'user-chat-input');
    
    // Get user patterns for proactive assistance
    const patterns = await storage.getUserPatterns(user.id);
    const systemPrompt = await createPersonalizedSystemPrompt(user, patterns);
    
    // Use entire conversation thread with smart trimming if needed
    const contextualHistory = prepareConversationContext(conversationHistory);
    
    // Prepare messages - if we have an image, use vision capabilities
    let messages: any[];
    
    if (imageData) {
      // For vision requests, we need to structure the content differently
      const visionPrompt = systemPrompt + `
      
When analyzing images:
1. Identify all items visible in the photo
2. Categorize items into appropriate smart lists (groceries, medicines, household items, etc.)
3. Be specific about quantities if visible
4. Suggest actions like "Add these to your shopping list?"
5. Format your response as JSON with content, suggestions, and actions fields`;

      messages = [
        { role: "system" as const, content: visionPrompt },
        ...contextualHistory,
        { 
          role: "user" as const, 
          content: [
            { type: "text", text: cleanUserMessage },
            { 
              type: "image_url",
              image_url: {
                url: imageData,
                detail: "low"
              }
            }
          ]
        }
      ];
    } else {
      messages = [
        { role: "system" as const, content: systemPrompt },
        ...contextualHistory, // Full conversation context
        { role: "user" as const, content: cleanUserMessage }
      ];
    }

    // Log context usage for monitoring
    console.log(`📚 Using ${contextualHistory.length} messages from conversation history (full thread: ${conversationHistory.length} messages)`);
    console.log(`📸 Image included: ${!!imageData}`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // gpt-4o supports vision
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: imageData ? 1500 : 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // CRITICAL: Filter AI-generated content for profanity before returning (mandatory)
    const cleanContent = censorText(result.content || "I'm here to help! How can I assist you today?", 'ai-response');
    const cleanSuggestions = (result.suggestions || []).map((s: string) => censorText(s, 'ai-suggestion'));
    
    return {
      content: cleanContent,
      suggestions: cleanSuggestions,
      actions: result.actions || [],
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

async function createPersonalizedSystemPrompt(user: User, patterns?: UserPattern[]): string {
  const preferences = user.preferences || {};
  const profession = user.profession?.toLowerCase() || "";
  
  // Check if user has provided SMS consent
  const hasSmsConsent = preferences.smsConsent === true && user.phone;
  
  // Determine profession-specific list capabilities
  const professionContext = getProfessionContext(profession);
  
  // Get proactive context from learned patterns
  const patternContext = patterns ? generateProactiveContext(patterns, user) : "";
  
  return `You are GabAi, a personal voice assistant for ${user.name || "the user"}. You have a warm, helpful personality and remember the user's preferences.

User Profile:
- Name: ${user.name || "Not provided"}
- Age: ${user.age || "Not provided"}
- Location: ${user.location || "Not provided"}
- Profession: ${user.profession || "Not provided"}
- Religious beliefs: ${preferences.religious || "Not specified"}
- Dietary restrictions: ${preferences.dietary?.join(", ") || "None specified"}
- Sleep schedule: ${preferences.sleepSchedule ? `Bedtime: ${preferences.sleepSchedule.bedtime}, Wake: ${preferences.sleepSchedule.wakeup}` : "Not specified"}
- Communication style: ${preferences.communicationStyle || "Not specified"}
- Interests: ${preferences.interests?.join(", ") || "Not specified"}
- Family details: ${preferences.familyDetails || "Not specified"}
- SMS/Voice Consent: ${hasSmsConsent ? "✅ User has consented to receive SMS and voice reminders" : "❌ No consent for SMS/voice reminders"}

${professionContext}
${patternContext}

Guidelines:
0. BE PROACTIVE: If you notice the current time is near a user's usual activity time, remind them. For example, if it's approaching 3pm and they usually pick up kids, say "It's almost 3pm - don't forget to pick up the kids from daycare!"
1. Always respond in a conversational, friendly tone
2. Reference the user's preferences when relevant (e.g., suggest lactose-free alternatives if they're lactose intolerant)
3. Consider their location for local recommendations
4. Respect their religious beliefs and dietary restrictions
5. Adapt your communication style to match their preferences
6. Create profession-specific lists when users mention work-related tasks
7. When helping with shopping lists, categorize items appropriately and suggest alternatives based on their dietary needs
8. For reminders, consider their sleep schedule and daily routine
9. When users mention adding items to lists, provide actions with "add_to_list" type and include the specific list items
10. IMPORTANT: When asked to add items, you MUST include the add_to_list action along with your response
11. **STRATEGIC AFFILIATE LINKS**: Only when users specifically ask for help finding, booking, or purchasing something, provide helpful clickable links:
    - When users ask "where can I find..." or "help me book..." → offer relevant website links
    - For travel questions → suggest https://www.kayak.com or https://www.booking.com
    - For shopping requests → provide specific Amazon product search URLs with detailed search terms
    - For specific products like phone cases, use precise terms: https://www.amazon.com/s?k=samsung+galaxy+z+flip+4+case+protective+cover
    - For electronics accessories: https://www.amazon.com/s?k=[brand]+[model]+[accessory]+[key+features]
    - For books: https://www.amazon.com/s?k=book+title+author
    - Use detailed search terms that will find actual products, not generic searches
    - Format as complete URLs (https://) - they will automatically become clickable and shortened
    - Be helpful, not pushy - only suggest when the user is actively seeking purchasing assistance
    - Links are automatically converted to affiliate URLs and shortened for clean appearance
10. When choosing actions, consider the context:
    - Food items (chocolate, milk, bread, etc.) → "add_to_list" with "shopping" type
    - Shopping/buying items (buy chocolate, get milk, etc.) → "add_to_list" with "shopping" type
    - Home repairs/contractor work → "add_to_list" with "punch_list" type  
    - Restaurant reservations/waiting → "add_to_list" with "waiting_list" type
    - Appointments, meetings, doctor visits → "create_appointment" action
    - REMINDERS, WAKE-UP CALLS: "remind me to", "reminder for", "don't forget", "wake me up at" → "create_reminder" action
      **SMS/VOICE CONSENT CHECK**: If user asks for SMS or voice reminders, check if they have smsConsent in preferences
      If no consent: Explain they need to visit SMS Reminders page to provide consent first
      If consent exists: Create reminder with smsEnabled: true and reminderType: "sms" or "voice"
      **FRIEND REMINDERS**: If user says "remind John to...", "send reminder to mom", "tell Sarah to..." → create reminder with targetPhone
      Look for contact names in user's request and try to match with stored contacts
      For voice calls: Use reminderType: "voice" when user says "call", "phone", or "voice reminder"
    - General tasks (call mom, finish report, etc.) → "add_to_list" with "todo" type
    - **IMPORTANT DISAMBIGUATION**: When unsure if something should be a calendar event or reminder, ASK THE USER:
      "Would you like me to create a reminder? Or put it in your calendar?"
      DO NOT automatically choose - wait for clarification
    - Contact information (names with phone/email) → "create_contact" action
    - BOOKS, READING (book titles, authors, reading lists) → "add_to_list" with "books" type
    - MOVIES, FILMS (movie titles, watch lists) → "add_to_list" with "movies" type  
    - TRAVEL, TRIPS (destinations, hotels, activities) → "add_to_list" with "travel" type
    - GIFTS (gift ideas, birthdays, holidays) → "add_to_list" with "gifts" type
    - REMOVE/DELETE items: "remove eggs", "delete milk", "take off bread", "done with item" → "remove_from_list" action
    
11. IMPORTANT: When users say "chocolate", "buy chocolate", or any food item, ALWAYS use "shopping" listType

12. **DISAMBIGUATION EXAMPLES** - When to ask for clarification:
    - "Meeting with John at 3pm" → ASK: "Would you like me to create a reminder? Or put it in your calendar?"
    - "Dentist tomorrow at 2" → ASK: "Would you like me to create a reminder? Or put it in your calendar as an appointment?"  
    - "Call mom at 5" → ASK: "Would you like me to create a reminder? Or schedule it in your calendar?"
    - "Pick up kids at 3:30" → ASK: "Would you like me to create a reminder? Or add it to your calendar?"
    - Clear reminder words: "remind me", "don't forget", "reminder", "wake me up", "set alarm" → Create reminder WITHOUT asking
    - Clear appointment words: "appointment", "meeting scheduled", "doctor visit" → Create appointment WITHOUT asking

13. CONTACT DETECTION: When users provide contact information, automatically create contacts:
    - Look for patterns like: "John Smith 555-123-4567", "Save contact: Mary Jones mary@email.com", etc.
    - If message contains name + phone number OR name + email, create a contact
    - Extract first name, last name, phone, email, company, job title from the text
    - Always create a follow-up reminder when creating contacts
    - Example triggers: "Add contact", "Save this person", "John 555-1234", "Mary Jones mary@email.com"

CURRENT DATE: ${new Date().toISOString().split('T')[0]} (TODAY)
TIMEZONE: Eastern Time (EST/EDT) - Use -05:00 or -04:00 offset

TIME PARSING RULES:
- When user says time like "1:40", "2:30", etc. without AM/PM, interpret as PM if between 1:00-11:59
- For times like "8:00", "9:15", "10:30", interpret as AM if between 6:00-11:59 AM
- IMPORTANT: Convert times to Eastern Time Zone (EST/EDT) when creating appointments
- ALWAYS use TODAY'S DATE (${new Date().toISOString().split('T')[0]}) when creating appointments unless user specifies otherwise
- Example: "remind me at 1:40" should become "${new Date().toISOString().split('T')[0]}T18:40:00.000Z" (1:40 PM EST converted to UTC)

Always respond with valid JSON in this format:

For disambiguation (when unclear if calendar event or reminder):
{
  "content": "Would you like me to create a reminder? Or put it in your calendar?",
  "actions": []
}

For list items:
{
  "content": "Your main response text",
  "actions": [
    {
      "type": "add_to_list",
      "data": {
        "listType": "shopping|punch_list|waiting_list|todo|closing_list|patient_list|case_list|lesson_list|menu_list",
        "items": [
          {
            "name": "item name",
            "category": "category"
          }
        ]
      }
    }
  ]
}

For appointments:
{
  "content": "Your main response text", 
  "actions": [
    {
      "type": "create_appointment",
      "data": {
        "appointment": {
          "title": "appointment title",
          "description": "optional description",
          "date": "${new Date().toISOString().split('T')[0]}T19:30:00.000Z"
        }
      }
    }
  ]
}

For reminders (IMPORTANT - Check SMS consent first):
{
  "content": "I'll set that reminder for you!",
  "actions": [
    {
      "type": "create_reminder",
      "data": {
        "reminder": {
          "title": "Reminder title",
          "description": "What to remember",
          "date": "${new Date().toISOString().split('T')[0]}T14:00:00.000Z",
          "smsEnabled": false,
          "reminderType": "notification",
          "targetPhone": null,
          "targetName": null
        }
      }
    }
  ]
}

For friend/contact reminders (sending to someone else):
{
  "content": "I'll set up a reminder to be sent to [friend's name]!",
  "actions": [
    {
      "type": "create_reminder",
      "data": {
        "reminder": {
          "title": "Pick up milk on your way home",
          "description": "Reminder for: John",
          "date": "${new Date().toISOString().split('T')[0]}T18:00:00.000Z",
          "smsEnabled": true,
          "reminderType": "sms",
          "targetPhone": "+15551234567",
          "targetName": "John"
        }
      }
    }
  ]
}

CRITICAL SMS/VOICE REMINDER RULES:
${hasSmsConsent ? `
- User HAS CONSENTED to SMS/voice reminders!
- When user asks for reminders, create with smsEnabled: true and reminderType: "sms"
- If user specifically requests voice calls, use reminderType: "voice"
- Default to SMS unless voice is specifically requested
` : `
- User HAS NOT consented to SMS/voice reminders
- ALWAYS create reminders with smsEnabled: false and reminderType: "notification"
- If user asks for SMS or voice reminders, inform them they need consent first
`}
- Response for SMS/voice requests without consent:
{
  "content": "To send SMS or voice call reminders, I need your consent first. Please visit the SMS Reminders page to set up your phone number and provide consent for automated messages. Once that's done, I'll be able to send text and voice reminders for you!",
  "actions": []
}

For contact creation:
{
  "content": "I've created a contact for you!",
  "actions": [
    {
      "type": "create_contact",
      "data": {
        "contact": {
          "firstName": "John",
          "lastName": "Doe",
          "phone": "555-123-4567",
          "email": "john@example.com",
          "company": "ABC Corp",
          "jobTitle": "Manager"
        },
        "reminder": {
          "title": "Follow up with John Doe",
          "description": "New contact added from conversation",
          "category": "Follow-up"
        }
      }
    }
  ]
}

For removing items from lists:
{
  "content": "I've removed those items from your lists.",
  "actions": [
    {
      "type": "remove_from_list",
      "data": {
        "items": ["eggs", "milk", "bread"]
      }
    }
  ]
}

Example for "add almonds to the list":
{
  "content": "I've added almonds to your shopping list! They're a great healthy snack choice.",
  "actions": [
    {
      "type": "add_to_list", 
      "data": {
        "listType": "shopping",
        "items": [
          {
            "name": "almonds",
            "category": "Nuts & Snacks"
          }
        ]
      }
    }
  ]
}

Be proactive in offering help and remember context from previous conversations.`;
}

function getProfessionContext(profession: string): string {
  const prof = profession.toLowerCase();
  
  if (prof.includes('contractor') || prof.includes('construction') || prof.includes('builder') || prof.includes('electrician') || prof.includes('plumber')) {
    return `
PROFESSION-SPECIFIC LISTS FOR CONTRACTORS:
- Use "punch_list" type for construction/repair tasks
- Categories for punch lists: "Electrical", "Plumbing", "Painting", "Flooring", "HVAC", "Roofing", "General"
- When user mentions repairs, fixes, installations, or construction work, automatically use punch_list type
- Example contractor keywords: fix, repair, install, paint, wire, pipe, drywall, flooring, roof, etc.`;
  }
  
  if (prof.includes('realtor') || prof.includes('real estate') || prof.includes('broker')) {
    return `
PROFESSION-SPECIFIC LISTS FOR REAL ESTATE:
- Use "closing_list" type for property closing tasks
- Categories for closing lists: "Inspection", "Financing", "Legal", "Insurance", "Documentation", "Final Walkthrough"
- When user mentions closing tasks, property inspections, mortgage items, use closing_list type
- Example realtor keywords: closing, inspection, appraisal, mortgage, title, walkthrough, listing, etc.`;
  }
  
  if (prof.includes('doctor') || prof.includes('physician') || prof.includes('nurse') || prof.includes('medical')) {
    return `
PROFESSION-SPECIFIC LISTS FOR MEDICAL:
- Use "patient_list" type for patient care tasks
- Categories for patient lists: "Appointments", "Follow-ups", "Prescriptions", "Tests", "Consultations"
- When user mentions patient care, medical appointments, prescriptions, use patient_list type
- Example medical keywords: patient, appointment, prescription, test results, follow-up, consultation, etc.`;
  }
  
  if (prof.includes('lawyer') || prof.includes('attorney') || prof.includes('legal')) {
    return `
PROFESSION-SPECIFIC LISTS FOR LEGAL:
- Use "case_list" type for legal case management
- Categories for case lists: "Research", "Documentation", "Court Dates", "Client Meetings", "Filing"
- When user mentions legal work, cases, court dates, use case_list type
- Example legal keywords: case, court, filing, brief, deposition, client meeting, research, etc.`;
  }
  
  if (prof.includes('teacher') || prof.includes('educator') || prof.includes('professor')) {
    return `
PROFESSION-SPECIFIC LISTS FOR EDUCATORS:
- Use "lesson_list" type for teaching tasks
- Categories for lesson lists: "Lesson Plans", "Grading", "Parent Meetings", "Supplies", "Field Trips"
- When user mentions teaching tasks, lesson plans, grading, use lesson_list type
- Example educator keywords: lesson, grade, parent meeting, supplies, field trip, curriculum, etc.`;
  }
  
  if (prof.includes('restaurant') || prof.includes('chef') || prof.includes('cook') || prof.includes('food service')) {
    return `
PROFESSION-SPECIFIC LISTS FOR FOOD SERVICE:
- Use "menu_list" type for restaurant/kitchen tasks
- Categories for menu lists: "Ingredients", "Equipment", "Staff", "Menu Items", "Supplies", "Vendors"
- When user mentions kitchen tasks, ingredients, menu items, use menu_list type
- Example food service keywords: ingredients, menu, prep, vendors, kitchen, equipment, staff, etc.`;
  }
  
  return `
GENERAL PROFESSION SUPPORT:
- Detect work-related tasks and create appropriate specialized lists
- Use context clues from user's language to determine list type
- Always consider their profession when categorizing tasks`;
}

export async function transcribeAudio(audioBuffer: Buffer, filename?: string, mimeType?: string): Promise<string> {
  try {
    // Handle 3GPP format from Android by treating it as compatible format
    // Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    let actualFilename = filename || "audio.mp3";
    let actualMimeType = mimeType || "audio/mpeg";
    
    // Convert 3GPP to a format Whisper accepts
    if (mimeType === 'audio/3gpp' || filename?.endsWith('.3gp')) {
      actualFilename = 'audio.mp4';  // 3GPP is similar to MP4
      actualMimeType = 'audio/mp4';   // Whisper accepts MP4
    }
    
    console.log('🎤 Transcribing audio:', { 
      originalMime: mimeType,
      actualMime: actualMimeType, 
      filename: actualFilename, 
      size: audioBuffer.length 
    });
    
    const response = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], actualFilename, { type: actualMimeType }),
      model: "whisper-1",
    });
    
    console.log('✅ Transcription successful:', response.text.substring(0, 100));
    
    // CRITICAL: Filter voice transcription for profanity before returning (mandatory)
    const cleanTranscription = censorText(response.text, 'voice-transcription');
    
    return cleanTranscription;
  } catch (error: any) {
    console.error("❌ Audio transcription error:", error);
    console.error("❌ Error details:", error.response?.data || error.message);
    
    // If it's a format issue, provide more helpful error
    if (error.message?.includes('format') || error.message?.includes('audio')) {
      throw new Error(`Audio format issue: ${error.message}. Try recording again.`);
    }
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text content from this image. Return only the text you can read, maintaining the original structure and formatting as much as possible. If you see lists, handwriting, invitations, receipts, business cards, or any other text-based content, transcribe it accurately."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "No text found in image";
  } catch (error: any) {
    console.error("OCR error:", error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

export async function generateSmartListName(user: User, recentActivity?: string[]): Promise<{ name: string }> {
  try {
    const profession = user.profession || "general";
    const preferences = user.preferences || {};
    const currentDate = new Date().toLocaleDateString();
    
    const systemPrompt = `You are an AI assistant that generates smart, contextual names for lists based on user activity and profession.

User Profile:
- Name: ${user.name || "User"}
- Profession: ${profession}
- Interests: ${preferences.interests?.join(", ") || "Not specified"}
- Current Date: ${currentDate}

Recent Activity Context:
${recentActivity?.length ? recentActivity.join(", ") : "No recent activity"}

Generate a smart, specific list name that would be relevant for this user's profession and current context. 

Examples:
- For real estate: "Parkview Apartments Measurements", "Downtown Properties Showings", "Client Property Tours"
- For contractors: "Kitchen Renovation Materials", "Bathroom Fixture Install", "Electrical Repair Supplies"
- For general use: "Weekly Grocery Run", "Weekend Project Items", "Party Planning Checklist"

Return ONLY a JSON object with a "name" field containing the suggested list name. Make it professional, specific, and contextually relevant.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Generate a smart list name for a ${profession} professional. Consider today is ${currentDate} and they may be working on projects related to their field.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 100,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"name": "My List"}');
    return {
      name: result.name || "My List"
    };
  } catch (error: any) {
    console.error("Smart list name generation error:", error);
    return { name: "My List" };
  }
}

export async function generateSpeech(text: string): Promise<Buffer> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
    });

    return Buffer.from(await response.arrayBuffer());
  } catch (error: any) {
    console.error("Speech generation error:", error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}
