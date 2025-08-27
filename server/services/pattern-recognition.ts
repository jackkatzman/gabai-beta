import { storage } from "../storage";
import type { User, ActivityLog, UserPattern } from "@shared/schema";

// Analyze user activities to detect patterns
export async function analyzeUserPatterns(userId: string) {
  const logs = await storage.getActivityLogs(userId, 30); // Last 30 days
  const patterns: Map<string, any> = new Map();

  // Group activities by time and type
  logs.forEach(log => {
    const key = `${log.activityType}-${log.hourOfDay}-${log.dayOfWeek}`;
    if (!patterns.has(key)) {
      patterns.set(key, {
        activity: log.description,
        type: log.activityType,
        occurrences: [],
        hourOfDay: log.hourOfDay,
        dayOfWeek: log.dayOfWeek
      });
    }
    patterns.get(key).occurrences.push(log);
  });

  // Identify recurring patterns (3+ occurrences)
  const recurringPatterns = [];
  for (const [key, data] of patterns) {
    if (data.occurrences.length >= 3) {
      const confidence = Math.min(data.occurrences.length * 20, 100);
      
      recurringPatterns.push({
        userId,
        patternType: detectPatternType(data),
        activity: data.activity,
        timeOfDay: `${data.hourOfDay}:00`,
        dayOfWeek: data.dayOfWeek,
        frequency: data.occurrences.length,
        confidence,
        lastOccurred: data.occurrences[data.occurrences.length - 1].timestamp,
        metadata: extractMetadata(data.activity)
      });
    }
  }

  return recurringPatterns;
}

function detectPatternType(data: any): string {
  const activity = data.activity.toLowerCase();
  
  if (data.occurrences.length >= 5 && allSameDayOfWeek(data.occurrences)) {
    return "daily_task";
  } else if (data.occurrences.length >= 3 && sameTimeOfDay(data.occurrences)) {
    return "time_based";
  } else if (activity.includes("pick up") || activity.includes("drop off")) {
    return "transportation";
  } else if (activity.includes("meeting") || activity.includes("call")) {
    return "scheduled_event";
  }
  
  return "recurring_task";
}

function allSameDayOfWeek(occurrences: ActivityLog[]): boolean {
  const days = occurrences.map(o => o.dayOfWeek);
  return days.every(d => d === days[0]);
}

function sameTimeOfDay(occurrences: ActivityLog[]): boolean {
  const hours = occurrences.map(o => o.hourOfDay);
  const variance = Math.max(...hours) - Math.min(...hours);
  return variance <= 1; // Within 1 hour window
}

function extractMetadata(activity: string) {
  const metadata: any = { triggers: [], relatedPeople: [] };
  
  // Extract triggers
  const triggerWords = ["pick up", "drop off", "meeting", "call", "buy", "pay", "reminder"];
  triggerWords.forEach(trigger => {
    if (activity.toLowerCase().includes(trigger)) {
      metadata.triggers.push(trigger);
    }
  });
  
  // Extract people
  const peopleWords = ["kids", "children", "spouse", "wife", "husband", "mom", "dad", "parents"];
  peopleWords.forEach(person => {
    if (activity.toLowerCase().includes(person)) {
      metadata.relatedPeople.push(person);
    }
  });
  
  return metadata;
}

// Generate proactive suggestions based on patterns
export async function generateProactiveSuggestions(userId: string): Promise<string[]> {
  const patterns = await storage.getUserPatterns(userId);
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const suggestions: string[] = [];

  for (const pattern of patterns) {
    // Skip if already suggested or rejected
    if (pattern.suggestedToUser && pattern.userAccepted === false) {
      continue;
    }

    // Check if pattern matches current context
    const patternHour = parseInt(pattern.timeOfDay?.split(':')[0] || '0');
    const hourDiff = Math.abs(currentHour - patternHour);
    
    if (pattern.patternType === "daily_task" && hourDiff <= 1) {
      suggestions.push(
        `I noticed you usually "${pattern.activity}" around this time. Would you like me to set a reminder for today?`
      );
    } else if (pattern.dayOfWeek === currentDay && hourDiff <= 2) {
      suggestions.push(
        `It's ${getDayName(currentDay)} - you often "${pattern.activity}" on this day. Should I add it to your schedule?`
      );
    } else if (pattern.confidence >= 80 && !pattern.suggestedToUser) {
      suggestions.push(
        `I've learned that you regularly "${pattern.activity}". Would you like me to make this a recurring reminder?`
      );
    }
  }

  return suggestions;
}

function getDayName(day: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[day];
}

// Learn from user interactions
export async function learnFromInteraction(
  userId: string, 
  activity: string, 
  context: {
    accepted?: boolean;
    modified?: string;
    feedback?: string;
  }
) {
  const now = new Date();
  
  // Log the activity
  await storage.createActivityLog({
    userId,
    activityType: "user_interaction",
    description: activity,
    dayOfWeek: now.getDay(),
    hourOfDay: now.getHours(),
    metadata: context
  });

  // Update pattern confidence based on user feedback
  if (context.accepted !== undefined) {
    const patterns = await storage.getUserPatterns(userId);
    const matchingPattern = patterns.find(p => 
      p.activity.toLowerCase().includes(activity.toLowerCase()) ||
      activity.toLowerCase().includes(p.activity.toLowerCase())
    );

    if (matchingPattern) {
      const newConfidence = context.accepted 
        ? Math.min(matchingPattern.confidence + 10, 100)
        : Math.max(matchingPattern.confidence - 20, 0);
      
      await storage.updateUserPattern(matchingPattern.id, {
        confidence: newConfidence,
        userAccepted: context.accepted,
        suggestedToUser: true
      });
    }
  }

  // Analyze for new patterns periodically
  const recentLogs = await storage.getActivityLogs(userId, 7);
  if (recentLogs.length >= 10) {
    const newPatterns = await analyzeUserPatterns(userId);
    for (const pattern of newPatterns) {
      // Check if pattern already exists
      const existing = await storage.findSimilarPattern(userId, pattern.activity);
      if (!existing) {
        await storage.createUserPattern(pattern);
      }
    }
  }
}

// Proactive reminder generation for OpenAI integration
export function generateProactiveContext(patterns: UserPattern[], user: User): string {
  if (!patterns || patterns.length === 0) return "";

  const highConfidencePatterns = patterns
    .filter(p => p.confidence >= 60)
    .slice(0, 5); // Top 5 patterns

  if (highConfidencePatterns.length === 0) return "";

  let context = "\n\n[Learned Patterns & Routines]:\n";
  
  highConfidencePatterns.forEach(pattern => {
    if (pattern.patternType === "daily_task") {
      context += `- User regularly "${pattern.activity}" at ${pattern.timeOfDay} daily\n`;
    } else if (pattern.patternType === "weekly_routine") {
      context += `- Every ${getDayName(pattern.dayOfWeek || 0)}: "${pattern.activity}"\n`;
    } else if (pattern.metadata?.relatedPeople?.length) {
      context += `- Activity involving ${pattern.metadata.relatedPeople.join(", ")}: "${pattern.activity}"\n`;
    }
  });

  context += "\nBe proactive: If the user mentions something related to these patterns, offer to help set reminders or manage these recurring tasks.";
  
  return context;
}