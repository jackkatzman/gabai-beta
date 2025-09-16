import { useCallback } from 'react';

interface ListContext {
  existingLists: Array<{
    id: string;
    name: string;
    type: 'shopping' | 'todo' | 'punch-list';
    itemCount: number;
  }>;
  userPreferences?: {
    defaultListType?: string;
    recentCategories?: string[];
  };
}

export function useImprovedGabAiTraining() {
  
  const enhancePromptWithListContext = useCallback((
    originalPrompt: string, 
    context: ListContext
  ): string => {
    const listContext = `
CONTEXT: User has these existing lists:
${context.existingLists.map(list => 
  `- ${list.name} (${list.type}, ${list.itemCount} items)`
).join('\n')}

CATEGORIZATION RULES:
1. Shopping items: groceries, food, household items, things to buy
2. Todo items: tasks, work, appointments, things to do  
3. Punch list items: repairs, fixes, maintenance, home improvements

INSTRUCTIONS:
- If user mentions shopping/buying/groceries → use shopping list
- If user mentions tasks/work/appointments → use todo list or create new todo list
- If user mentions repairs/fixes/maintenance → use punch list
- If unsure, ask user which type of list they want
- NEVER put todo tasks in shopping lists
- When creating items, specify which list type they belong in

Original request: ${originalPrompt}

Enhanced AI response with proper list categorization:`;

    return listContext;
  }, []);

  const categorizeUserRequest = useCallback((
    userInput: string,
    context: ListContext
  ): {
    suggestedListType: 'shopping' | 'todo' | 'punch-list';
    suggestedListId?: string;
    confidence: number;
    reasoning: string;
  } => {
    const input = userInput.toLowerCase();
    
    // Shopping indicators
    const shoppingKeywords = ['buy', 'purchase', 'grocery', 'store', 'market', 'shop', 'milk', 'bread', 'food'];
    const shoppingScore = shoppingKeywords.filter(keyword => input.includes(keyword)).length;
    
    // Todo indicators  
    const todoKeywords = ['task', 'work', 'meeting', 'appointment', 'call', 'email', 'finish', 'complete', 'remind'];
    const todoScore = todoKeywords.filter(keyword => input.includes(keyword)).length;
    
    // Punch list indicators
    const punchKeywords = ['fix', 'repair', 'broken', 'maintenance', 'replace', 'install', 'clean', 'paint'];
    const punchScore = punchKeywords.filter(keyword => input.includes(keyword)).length;
    
    // Determine best category
    let suggestedListType: 'shopping' | 'todo' | 'punch-list';
    let confidence: number;
    let reasoning: string;
    
    if (shoppingScore > todoScore && shoppingScore > punchScore) {
      suggestedListType = 'shopping';
      confidence = Math.min(0.9, 0.5 + (shoppingScore * 0.2));
      reasoning = `Detected shopping keywords: ${shoppingKeywords.filter(k => input.includes(k)).join(', ')}`;
    } else if (todoScore > punchScore) {
      suggestedListType = 'todo';
      confidence = Math.min(0.9, 0.5 + (todoScore * 0.2));
      reasoning = `Detected task keywords: ${todoKeywords.filter(k => input.includes(k)).join(', ')}`;
    } else if (punchScore > 0) {
      suggestedListType = 'punch-list';
      confidence = Math.min(0.9, 0.5 + (punchScore * 0.2));
      reasoning = `Detected maintenance keywords: ${punchKeywords.filter(k => input.includes(k)).join(', ')}`;
    } else {
      // Default to todo for ambiguous requests
      suggestedListType = 'todo';
      confidence = 0.3;
      reasoning = 'No clear category detected, defaulting to todo list';
    }
    
    // Find existing list of the right type
    const existingList = context.existingLists.find(list => list.type === suggestedListType);
    
    return {
      suggestedListType,
      suggestedListId: existingList?.id,
      confidence,
      reasoning
    };
  }, []);

  const generateImprovedSystemPrompt = useCallback((context: ListContext): string => {
    return `You are GabAi, a voice-first personal assistant. When users request to add items to lists, follow these rules:

EXISTING LISTS:
${context.existingLists.map(list => 
  `- ${list.name}: ${list.type} (${list.itemCount} items)`
).join('\n')}

CATEGORIZATION RULES:
1. SHOPPING: groceries, food, household items, things to buy → shopping list
2. TODO: tasks, work, appointments, reminders → todo list  
3. PUNCH LIST: repairs, fixes, maintenance, home improvements → punch list

CRITICAL: NEVER put todo tasks in shopping lists!

Examples:
❌ Wrong: "call dentist" → shopping list
✅ Correct: "call dentist" → todo list or create new todo list

❌ Wrong: "fix leaky faucet" → shopping list  
✅ Correct: "fix leaky faucet" → punch list or create new punch list

When user requests don't clearly specify a list type:
1. Analyze the content to determine the most appropriate list type
2. If a matching list exists, use it
3. If no matching list exists, suggest creating a new one
4. When in doubt, ask the user which type of list they want

Always be helpful and accurate with list categorization.`;
  }, []);

  return {
    enhancePromptWithListContext,
    categorizeUserRequest,
    generateImprovedSystemPrompt
  };
}