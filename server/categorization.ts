import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CategoryResult {
  category: string;
  confidence: number;
}

const SHOPPING_CATEGORIES = [
  "Produce", "Dairy", "Meat", "Bakery", "Frozen", 
  "Beverages", "Household", "Snacks", "Pantry", "Other"
];

export async function categorizeItem(itemName: string, listType: string): Promise<CategoryResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  if (listType !== 'shopping') {
    return { category: "Other", confidence: 0 };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a grocery store categorization expert. Categorize grocery items into these categories:

CATEGORIES:
- Produce: Fresh fruits, vegetables, herbs (apples, bananas, lettuce, tomatoes, etc.)
- Dairy: Milk, cheese, yogurt, butter, eggs, cream
- Meat: Fresh meat, poultry, fish, deli meats (chicken, beef, salmon, pastrami, etc.)
- Bakery: Bread, bagels, pastries, cakes, muffins
- Frozen: Frozen foods, ice cream, frozen vegetables, frozen meals
- Beverages: Drinks including coffee, tea, soda, juice, water, alcohol
- Household: Cleaning supplies, toiletries, paper products, detergent
- Snacks: Chips, candy, cookies, crackers, nuts
- Pantry: Canned goods, pasta, rice, spices, condiments, oils
- Other: Items that don't fit the above categories

Respond with just the category name, nothing else. Be smart about context - for example:
- "French roast" = Beverages (coffee)
- "Coca-Cola, caffeine-free" = Beverages
- "french fries, frozen" = Frozen
- "pastrami" = Meat (deli meat)
- "pizza, frozen" = Frozen`
        },
        {
          role: "user",
          content: `Categorize this grocery item: "${itemName}"`
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    const category = response.choices[0]?.message?.content?.trim() || "Other";
    
    // Validate that the response is one of our expected categories
    const validCategory = SHOPPING_CATEGORIES.includes(category) ? category : "Other";
    
    return {
      category: validCategory,
      confidence: validCategory !== "Other" ? 0.9 : 0.1
    };
    
  } catch (error) {
    console.error('OpenAI categorization error:', error);
    throw error;
  }
}