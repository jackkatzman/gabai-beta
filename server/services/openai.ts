import OpenAI from "openai";
import type { User } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export interface AIResponse {
  content: string;
  suggestions?: string[];
  actions?: Array<{
    type: "add_to_list" | "create_appointment" | "create_alarm" | "create_reminder" | "schedule_event" | "create_contact";
    data: any;
  }>;
}

export async function generatePersonalizedResponse(
  userMessage: string,
  user: User,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<AIResponse> {
  try {
    const systemPrompt = createPersonalizedSystemPrompt(user);
    
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user" as const, content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      content: result.content || "I'm here to help! How can I assist you today?",
      suggestions: result.suggestions || [],
      actions: result.actions || [],
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

function createPersonalizedSystemPrompt(user: User): string {
  const preferences = user.preferences || {};
  const profession = user.profession?.toLowerCase() || "";
  
  // Determine profession-specific list capabilities
  const professionContext = getProfessionContext(profession);
  
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

${professionContext}

Guidelines:
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
    - For shopping requests → provide specific Amazon product search URLs like https://www.amazon.com/s?k=product+name or for books: https://www.amazon.com/s?k=book+title+author
    - For specific products, create targeted Amazon search URLs: https://www.amazon.com/s?k=[product+name]
    - Format as complete URLs (https://) - they will automatically become clickable and shortened
    - Be helpful, not pushy - only suggest when the user is actively seeking purchasing assistance
    - Links are automatically converted to affiliate URLs and shortened for clean appearance
10. When choosing actions, consider the context:
    - Food items (chocolate, milk, bread, etc.) → "add_to_list" with "shopping" type
    - Shopping/buying items (buy chocolate, get milk, etc.) → "add_to_list" with "shopping" type
    - Home repairs/contractor work → "add_to_list" with "punch_list" type  
    - Restaurant reservations/waiting → "add_to_list" with "waiting_list" type
    - Appointments, meetings, doctor visits → "create_appointment" action
    - ALARMS, WAKE-UP CALLS, "set alarm for", "wake me up at" → "create_alarm" action (NOT appointment)
    - General tasks (call mom, finish report, etc.) → "add_to_list" with "todo" type
    
11. IMPORTANT: When users say "chocolate", "buy chocolate", or any food item, ALWAYS use "shopping" listType

CURRENT DATE: ${new Date().toISOString().split('T')[0]} (TODAY)
TIMEZONE: Eastern Time (EST/EDT) - Use -05:00 or -04:00 offset

TIME PARSING RULES:
- When user says time like "1:40", "2:30", etc. without AM/PM, interpret as PM if between 1:00-11:59
- For times like "8:00", "9:15", "10:30", interpret as AM if between 6:00-11:59 AM
- IMPORTANT: Convert times to Eastern Time Zone (EST/EDT) when creating appointments
- ALWAYS use TODAY'S DATE (${new Date().toISOString().split('T')[0]}) when creating appointments unless user specifies otherwise
- Example: "remind me at 1:40" should become "${new Date().toISOString().split('T')[0]}T18:40:00.000Z" (1:40 PM EST converted to UTC)

Always respond with valid JSON in this format:

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

For alarms/wake-up calls:
{
  "content": "I'll set that alarm for you!", 
  "actions": [
    {
      "type": "create_alarm",
      "data": {
        "alarm": {
          "title": "Wake up message",
          "description": "optional description",
          "date": "${new Date().toISOString().split('T')[0]}T06:30:00.000Z"
        }
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

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const response = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], "audio.wav", { type: "audio/wav" }),
      model: "whisper-1",
    });
    
    return response.text;
  } catch (error: any) {
    console.error("Audio transcription error:", error);
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
