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
      const reminderData = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(reminderData);
      res.json(reminder);
    } catch (error: any) {
      console.error("Create reminder error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/reminders/:id", async (req, res) => {
    try {
      const updates = insertReminderSchema.partial().parse(req.body);
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

  const httpServer = createServer(app);
  return httpServer;
}
