import { nanoid } from 'nanoid';
import { db } from '../db';
import { shortLinks } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Affiliate link configuration
const AFFILIATE_MAPPINGS = {
  'booking.com': 'aid=gabai2025',
  'expedia.com': 'tpid=gabai2025',
  'kayak.com': 'aid=gabai',
  'hotels.com': 'aid=gabai2025',
  'amazon.com': 'tag=floater01b-20',
  'vrbo.com': 'https://www.dpbolvw.net/click-101504231-10697641' // User's VRBO affiliate link
};

function addAffiliateParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    
    const affiliateId = AFFILIATE_MAPPINGS[domain as keyof typeof AFFILIATE_MAPPINGS];
    if (affiliateId) {
      // Special handling for VRBO - use direct affiliate link
      if (domain === 'vrbo.com') {
        return affiliateId; // Return the full affiliate URL for VRBO
      }
      
      // For other domains, add as query parameter
      const separator = urlObj.search ? '&' : '?';
      return `${url}${separator}${affiliateId}`;
    }
    
    return url;
  } catch {
    return url;
  }
}

export async function createShortLink(originalUrl: string): Promise<{ shortCode: string; shortUrl: string }> {
  // Add affiliate parameters if applicable
  const affiliateUrl = addAffiliateParams(originalUrl);
  
  // Generate unique short code
  const shortCode = nanoid(8);
  
  // Store the link in database
  await db.insert(shortLinks).values({
    shortCode,
    originalUrl: affiliateUrl,
    clickCount: 0,
  });
  
  // Return short URL using current domain
  // Always use gabai.ai for production, current Replit domain for development
  const currentDomain = process.env.NODE_ENV === 'production' 
    ? 'gabai.ai' 
    : process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  
  const shortUrl = `https://${currentDomain}/l/${shortCode}`;
  console.log(`🌐 Using domain: ${currentDomain} (NODE_ENV: ${process.env.NODE_ENV})`);
  
  console.log(`📎 Created short link: ${shortUrl} → ${affiliateUrl}`);
  
  return { shortCode, shortUrl };
}

export async function getLongUrl(shortCode: string): Promise<string | null> {
  const [link] = await db
    .select()
    .from(shortLinks)
    .where(eq(shortLinks.shortCode, shortCode))
    .limit(1);
  
  if (!link) {
    return null;
  }
  
  // Check if expired
  if (link.expiresAt && link.expiresAt < new Date()) {
    await db.delete(shortLinks).where(eq(shortLinks.shortCode, shortCode));
    return null;
  }
  
  // Update click count
  await db
    .update(shortLinks)
    .set({ clickCount: (link.clickCount || 0) + 1 })
    .where(eq(shortLinks.shortCode, shortCode));
  
  console.log(`🔗 Redirecting ${shortCode} → ${link.originalUrl} (clicks: ${(link.clickCount || 0) + 1})`);
  
  return link.originalUrl;
}

export async function getLinkStats(): Promise<{ totalLinks: number; totalClicks: number }> {
  const links = await db.select().from(shortLinks);
  return {
    totalLinks: links.length,
    totalClicks: links.reduce((sum, link) => sum + (link.clickCount || 0), 0),
  };
}

// Clean up expired links (call periodically)
export async function cleanupExpiredLinks(): Promise<number> {
  const now = new Date();
  const expiredLinks = await db
    .select()
    .from(shortLinks)
    .where(eq(shortLinks.expiresAt, now)); // This would need proper comparison in real implementation
  
  if (expiredLinks.length > 0) {
    await db
      .delete(shortLinks)
      .where(eq(shortLinks.expiresAt, now)); // This would need proper comparison in real implementation
  }
  
  return expiredLinks.length;
}