import { nanoid } from 'nanoid';

interface ShortLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  clickCount: number;
  createdAt: Date;
  expiresAt?: Date;
}

// In-memory store for demo (in production, use database)
const linkStore = new Map<string, ShortLink>();

// Affiliate link configuration
const AFFILIATE_MAPPINGS = {
  'booking.com': 'aid=gabai2025',
  'expedia.com': 'tpid=gabai2025',
  'kayak.com': 'aid=gabai',
  'hotels.com': 'aid=gabai2025',
  'amazon.com': 'tag=gabai-20',
};

function addAffiliateParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    
    const affiliateId = AFFILIATE_MAPPINGS[domain as keyof typeof AFFILIATE_MAPPINGS];
    if (affiliateId) {
      const separator = urlObj.search ? '&' : '?';
      return `${url}${separator}${affiliateId}`;
    }
    
    return url;
  } catch {
    return url;
  }
}

export function createShortLink(originalUrl: string): { shortCode: string; shortUrl: string } {
  // Add affiliate parameters if applicable
  const affiliateUrl = addAffiliateParams(originalUrl);
  
  // Generate unique short code
  const shortCode = nanoid(8);
  
  // Store the link
  const shortLink: ShortLink = {
    id: nanoid(),
    originalUrl: affiliateUrl,
    shortCode,
    clickCount: 0,
    createdAt: new Date(),
  };
  
  linkStore.set(shortCode, shortLink);
  
  // Return short URL (will be handled by our domain)
  const shortUrl = `https://gab.ai/l/${shortCode}`;
  
  console.log(`📎 Created short link: ${shortUrl} → ${affiliateUrl}`);
  
  return { shortCode, shortUrl };
}

export function getLongUrl(shortCode: string): string | null {
  const shortLink = linkStore.get(shortCode);
  
  if (!shortLink) {
    return null;
  }
  
  // Check if expired
  if (shortLink.expiresAt && shortLink.expiresAt < new Date()) {
    linkStore.delete(shortCode);
    return null;
  }
  
  // Increment click count for analytics
  shortLink.clickCount++;
  
  console.log(`🔗 Redirecting ${shortCode} → ${shortLink.originalUrl} (clicks: ${shortLink.clickCount})`);
  
  return shortLink.originalUrl;
}

export function getLinkStats(): { totalLinks: number; totalClicks: number } {
  const links = Array.from(linkStore.values());
  return {
    totalLinks: links.length,
    totalClicks: links.reduce((sum, link) => sum + link.clickCount, 0),
  };
}

// Clean up expired links (call periodically)
export function cleanupExpiredLinks(): number {
  const now = new Date();
  let cleaned = 0;
  
  // Convert to array to avoid iteration issues
  const entries = Array.from(linkStore.entries());
  for (const [shortCode, link] of entries) {
    if (link.expiresAt && link.expiresAt < now) {
      linkStore.delete(shortCode);
      cleaned++;
    }
  }
  
  return cleaned;
}