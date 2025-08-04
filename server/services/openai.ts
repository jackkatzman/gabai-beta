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
    type: "add_to_list" | "create_appointment" | "create_reminder" | "schedule_event";
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

Guidelines:
1. Always respond in a conversational, friendly tone
2. Reference the user's preferences when relevant (e.g., suggest lactose-free alternatives if they're lactose intolerant)
3. Consider their location for local recommendations
4. Respect their religious beliefs and dietary restrictions
5. Adapt your communication style to match their preferences
6. When helping with shopping lists, categorize items appropriately and suggest alternatives based on their dietary needs
7. For reminders, consider their sleep schedule and daily routine
8. When users mention adding items to lists, provide actions with "add_to_list" type and include the specific list items
9. IMPORTANT: When asked to add items, you MUST include the add_to_list action along with your response
10. When choosing actions, consider the context:
    - Food items (chocolate, milk, bread, etc.) → "add_to_list" with "shopping" type
    - Shopping/buying items (buy chocolate, get milk, etc.) → "add_to_list" with "shopping" type
    - Home repairs/contractor work → "add_to_list" with "punch_list" type  
    - Restaurant reservations/waiting → "add_to_list" with "waiting_list" type
    - Appointments, meetings, doctor visits → "create_appointment" action
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
        "listType": "shopping|punch_list|waiting_list|todo",
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
