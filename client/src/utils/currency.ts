// Currency utility functions for handling monetary amounts

/**
 * Format cents to dollar string (e.g., 1250 -> "$12.50")
 */
export function formatCurrency(cents: number | null | undefined, currency: string = "USD"): string {
  if (cents === null || cents === undefined) return "";
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  
  return formatter.format(cents / 100);
}

/**
 * Parse dollar string to cents (e.g., "$12.50" -> 1250, "12.5" -> 1250)
 */
export function parseCurrency(value: string): number | null {
  if (!value || value.trim() === "") return null;
  
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[$,\s]/g, '');
  
  // Parse as float and convert to cents
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return null;
  
  return Math.round(dollars * 100);
}

/**
 * Format input value for currency display
 */
export function formatCurrencyInput(value: string): string {
  const cents = parseCurrency(value);
  if (cents === null) return value;
  
  const dollars = cents / 100;
  return dollars.toFixed(2);
}

/**
 * Calculate total from array of amounts
 */
export function calculateTotal(amounts: (number | null | undefined)[]): number {
  return amounts.reduce((sum, amount) => {
    return sum + (amount || 0);
  }, 0);
}

/**
 * Validate currency input
 */
export function isValidCurrency(value: string): boolean {
  if (!value || value.trim() === "") return true; // Empty is valid
  
  const cents = parseCurrency(value);
  return cents !== null && cents >= 0;
}