// Text rendering utilities to prevent backwards or broken text display

export function safeTextRender(text: string | null | undefined): string {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  
  // Ensure proper text direction and remove any RTL/LTR override characters
  return text
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '') // Remove directional formatting chars
    .replace(/\u200E/g, '') // Remove left-to-right mark
    .replace(/\u200F/g, '') // Remove right-to-left mark
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