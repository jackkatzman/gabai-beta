// Text rendering utilities to prevent backwards or broken text display

export function detectTextDirection(text: string): 'ltr' | 'rtl' | 'auto' {
  if (!text) return 'auto';
  
  // Hebrew unicode range: \u0590-\u05FF
  // Arabic unicode range: \u0600-\u06FF
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  
  if (rtlRegex.test(text)) {
    return 'rtl';
  }
  
  return 'ltr';
}

export function safeTextRender(text: string | null | undefined): string {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  
  // Only remove harmful control characters, keep natural RTL/LTR for proper languages
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
}

export function isTextReady(text: string | null | undefined): boolean {
  return Boolean(text && typeof text === 'string' && text.trim().length > 0);
}

export function sanitizeForDisplay(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Basic sanitization to prevent display issues
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .trim();
}