import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CategoryResult {
  category: string;
  confidence: number;
}

const LIST_CATEGORIES: Record<string, string[]> = {
  shopping: ["Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages", "Household", "Snacks", "Pantry", "Other"],
  social_media: ["Posts", "Stories", "Reels", "Comments", "Messages", "Followers", "Content Ideas", "Analytics", "Other"],
  books: ["Fiction", "Non-Fiction", "Biographies", "Technical", "Self-Help", "To Read", "Currently Reading", "Finished", "Other"],
  movies: ["Action", "Comedy", "Drama", "Sci-Fi", "Documentary", "To Watch", "Watched", "Favorites", "Other"],
  travel: ["Destinations", "Hotels", "Activities", "Restaurants", "Packing", "Bookings", "Transportation", "Budget", "Other"],
  gifts: ["Birthday", "Holiday", "Anniversary", "Wedding", "Baby Shower", "Graduation", "Thank You", "Just Because", "Other"],
  todo: ["Work", "Personal", "Urgent", "Later", "Meetings", "Calls", "Emails", "Projects", "Other"],
  payments: ["Bills", "Contractors", "Vendors", "Employees", "Suppliers", "Services", "Recurring", "One-Time", "Other"],
  budget: ["Income", "Expenses", "Savings", "Investments", "Emergency Fund", "Goals", "Fixed Costs", "Variable", "Other"],
  punch_list: ["Plumber", "Electrician", "Painter", "Flooring", "HVAC", "General", "Inspection", "Repairs", "Other"],
  waiting_list: ["VIP", "Regular", "Walk-in", "Reservation", "Priority", "Standby", "Confirmed", "Cancelled", "Other"]
};

export async function categorizeItem(itemName: string, listType: string): Promise<CategoryResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Get categories for this list type, default to generic categories if not found
  const categories = LIST_CATEGORIES[listType] || ["High Priority", "Medium Priority", "Low Priority", "Other"];
  
  // If list type is not recognized, still try to categorize intelligently
  if (!LIST_CATEGORIES[listType]) {
    console.log(`Using generic categories for list type: ${listType}`);
  }

  try {
    // Build system prompt based on list type
    let systemPrompt = '';
    
    if (listType === 'shopping') {
      systemPrompt = `You are a grocery categorization expert. Categorize items into: ${categories.join(', ')}.
      
Be smart about context:
- "French roast" (meat) = Meat
- "French roast coffee" = Beverages
- "Coca-Cola" = Beverages
- "pastrami" = Meat`;
    } else if (listType === 'social_media') {
      systemPrompt = `You are a social media expert. Categorize items into: ${categories.join(', ')}.
      
Examples:
- "Post about vacation" = Posts
- "Instagram story idea" = Stories
- "TikTok video concept" = Reels
- "Reply to comments" = Comments`;
    } else if (listType === 'books') {
      systemPrompt = `You are a book categorization expert. Categorize items into: ${categories.join(', ')}.
      
Examples:
- "The Great Gatsby" = Fiction
- "Atomic Habits" = Self-Help
- "Steve Jobs biography" = Biographies`;
    } else if (listType === 'movies') {
      systemPrompt = `You are a movie expert. Categorize items into: ${categories.join(', ')}.
      
Examples:
- "The Matrix" = Sci-Fi
- "The Hangover" = Comedy
- "Inception" = Sci-Fi`;
    } else if (listType === 'travel') {
      systemPrompt = `You are a travel planning expert. Categorize items into: ${categories.join(', ')}.
      
Examples:
- "Paris" = Destinations
- "Hilton Hotel" = Hotels
- "Eiffel Tower tour" = Activities`;
    } else if (listType === 'todo') {
      systemPrompt = `You are a task management expert. Categorize items into: ${categories.join(', ')}.
      
Examples:
- "Team meeting" = Meetings
- "Call client" = Calls
- "Finish report" = Work`;
    } else {
      // Generic categorization for any list type
      systemPrompt = `You are an intelligent categorization assistant. Based on the list type "${listType}", categorize items into the most appropriate category from: ${categories.join(', ')}.
      
Be contextually aware and choose the best fitting category.`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt + "\n\nRespond with just the category name, nothing else."
        },
        {
          role: "user",
          content: `Categorize this item: "${itemName}"`
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    const category = response.choices[0]?.message?.content?.trim() || "Other";
    
    // Validate that the response is one of our expected categories
    const validCategory = categories.includes(category) ? category : "Other";
    
    return {
      category: validCategory,
      confidence: validCategory !== "Other" ? 0.9 : 0.1
    };
    
  } catch (error) {
    console.error('OpenAI categorization error:', error);
    throw error;
  }
}