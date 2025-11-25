import { storage } from '../storage';
import type { Request, Response, NextFunction } from 'express';

const FREE_CHAT_PER_DAY = parseInt(process.env.FREE_CHAT_PER_DAY || '50');
const FREE_LIST_ITEMS_PER_DAY = parseInt(process.env.FREE_LIST_ITEMS_PER_DAY || '100');
const FREE_REMINDERS_PER_DAY = parseInt(process.env.FREE_REMINDERS_PER_DAY || '20');
const DISABLE_CHAT_TEMPORARILY = process.env.DISABLE_CHAT_TEMPORARILY === 'true';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function checkChatLimit(req: any, res: Response, next: NextFunction) {
  try {
    if (DISABLE_CHAT_TEMPORARILY) {
      return res.status(503).json({ 
        error: 'Chat is temporarily unavailable. Please try again later.' 
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await storage.getUser(userId);
    if (user?.isPremium) {
      req.rateLimitBypass = true;
      return next();
    }

    const today = getTodayDate();
    const usage = await storage.getDailyUsage(userId, today);
    
    if (usage && (usage.chatCount || 0) >= FREE_CHAT_PER_DAY) {
      return res.status(429).json({ 
        error: `Daily chat limit reached (${FREE_CHAT_PER_DAY} messages per day). Upgrade to premium for unlimited chats.`,
        limit: FREE_CHAT_PER_DAY,
        current: usage.chatCount || 0,
        resetDate: today
      });
    }

    req.incrementChatCount = async () => {
      return await storage.incrementChatCount(userId, today, FREE_CHAT_PER_DAY);
    };
    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    next();
  }
}

export async function checkListItemLimit(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await storage.getUser(userId);
    if (user?.isPremium) {
      req.rateLimitBypass = true;
      return next();
    }

    const today = getTodayDate();
    const usage = await storage.getDailyUsage(userId, today);
    
    if (usage && (usage.listItemCount || 0) >= FREE_LIST_ITEMS_PER_DAY) {
      return res.status(429).json({ 
        error: `Daily list item limit reached (${FREE_LIST_ITEMS_PER_DAY} items per day). Upgrade to premium for unlimited items.`,
        limit: FREE_LIST_ITEMS_PER_DAY,
        current: usage.listItemCount || 0,
        resetDate: today
      });
    }

    req.incrementListItemCount = async () => {
      return await storage.incrementListItemCount(userId, today, FREE_LIST_ITEMS_PER_DAY);
    };
    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    next();
  }
}

export async function checkReminderLimit(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await storage.getUser(userId);
    if (user?.isPremium) {
      req.rateLimitBypass = true;
      return next();
    }

    const today = getTodayDate();
    const usage = await storage.getDailyUsage(userId, today);
    
    if (usage && (usage.reminderCount || 0) >= FREE_REMINDERS_PER_DAY) {
      return res.status(429).json({ 
        error: `Daily reminder limit reached (${FREE_REMINDERS_PER_DAY} reminders per day). Upgrade to premium for unlimited reminders.`,
        limit: FREE_REMINDERS_PER_DAY,
        current: usage.reminderCount || 0,
        resetDate: today
      });
    }

    req.incrementReminderCount = async () => {
      return await storage.incrementReminderCount(userId, today, FREE_REMINDERS_PER_DAY);
    };
    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    next();
  }
}
