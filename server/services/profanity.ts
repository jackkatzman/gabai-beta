import leoProfanity from "leo-profanity";

// Initialize profanity filter on startup
leoProfanity.loadDictionary();

// Add extra context-specific words if needed
leoProfanity.add(["schmutz", "oyvey"]);

/**
 * Censors profanity in text with "beep" replacement and logging
 */
export function censorText(input: string, context?: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // Check if text contains profanity before filtering
  const hasProfanity = leoProfanity.check(input);
  
  if (hasProfanity) {
    // Log the profanity detection for moderation purposes
    console.log('🚫 Profanity detected and filtered:', {
      context: context || 'unknown',
      originalLength: input.length,
      timestamp: new Date().toISOString(),
      // Don't log the actual content for privacy
      preview: input.substring(0, 20) + '...'
    });
  }

  // Clean the text (replaces profanity with *)
  let censored = leoProfanity.clean(input);

  // Replace asterisks with "beep" for friendlier output
  censored = censored.replace(/\*+/g, "beep");

  return censored;
}

/**
 * Enhanced version that also returns whether filtering occurred
 */
export function censorTextWithInfo(input: string, context?: string): { 
  text: string; 
  wasFiltered: boolean; 
} {
  if (!input || typeof input !== 'string') {
    return { text: input, wasFiltered: false };
  }

  const hasProfanity = leoProfanity.check(input);
  const cleanedText = censorText(input, context);

  return {
    text: cleanedText,
    wasFiltered: hasProfanity
  };
}

/**
 * List profanity words for debugging (admin only)
 */
export function getProfanityList(): string[] {
  return leoProfanity.list();
}

/**
 * Add custom words to filter
 */
export function addCustomWords(words: string[]): void {
  leoProfanity.add(words);
  console.log('🚫 Added custom profanity words:', words.length);
}