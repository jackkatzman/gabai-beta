import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePersonalizedResponse, transcribeAudio } from "./services/openai";
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
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, updates);
      res.json(user);
    } catch (error: any) {
      console.error("Update user error:", error);
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

      // Save user message
      await storage.createMessage({
        conversationId: currentConversationId,
        role: "user",
        content: message
      });

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
              await storage.createReminder({
                userId,
                title: action.data.appointment.title,
                description: action.data.appointment.description || `Appointment: ${action.data.appointment.title}`,
                dueDate: action.data.appointment.date ? new Date(action.data.appointment.date) : new Date(Date.now() + 24 * 60 * 60 * 1000),
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
              targetList = lists.find(list => list.type === requestedType);
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

      res.json({
        message: assistantMessage,
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

  const httpServer = createServer(app);
  return httpServer;
}
