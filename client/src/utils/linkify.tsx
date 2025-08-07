import { ExternalLink } from "lucide-react";

// Affiliate link configuration for monetization
const AFFILIATE_MAPPINGS = {
  'booking.com': {
    affiliateId: 'aid=1234567', // Replace with actual Booking.com affiliate ID
    baseUrl: 'https://www.booking.com',
  },
  'expedia.com': {
    affiliateId: 'tpid=1234567', // Replace with actual Expedia affiliate ID  
    baseUrl: 'https://www.expedia.com',
  },
  'kayak.com': {
    affiliateId: 'aid=gabai', // Replace with actual Kayak affiliate ID
    baseUrl: 'https://www.kayak.com',
  },
  'hotels.com': {
    affiliateId: 'aid=1234567', // Replace with actual Hotels.com affiliate ID
    baseUrl: 'https://www.hotels.com',
  },
  'amazon.com': {
    affiliateId: 'tag=gabai-20', // Replace with actual Amazon affiliate tag
    baseUrl: 'https://www.amazon.com',
  },
};

// Function to shorten URLs via our API
async function shortenUrl(url: string): Promise<string> {
  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.shortUrl;
    }
    
    return url; // Fallback to original URL
  } catch (error) {
    console.error('Failed to shorten URL:', error);
    return url; // Fallback to original URL
  }
}

// Regular expression to match URLs
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Function to convert text with URLs to JSX with clickable links
export function linkifyText(text: string): JSX.Element {
  const parts = text.split(URL_REGEX);
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a URL
        if (URL_REGEX.test(part)) {
          // Use the original URL for display, shortening happens server-side
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 inline-flex items-center gap-1 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                // Optional: Track click for analytics
                console.log('Link clicked:', part);
              }}
            >
              {part.length > 50 ? `${part.substring(0, 50)}...` : part}
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          );
        }
        
        // Reset regex for next iteration
        URL_REGEX.lastIndex = 0;
        return part;
      })}
    </>
  );
}

// Alternative function for simple link detection without affiliate conversion
export function linkifyTextSimple(text: string): JSX.Element {
  const parts = text.split(URL_REGEX);
  
  return (
    <>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 inline-flex items-center gap-1"
            >
              {part}
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          );
        }
        
        URL_REGEX.lastIndex = 0;
        return part;
      })}
    </>
  );
}