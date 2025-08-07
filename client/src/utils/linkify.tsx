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

// Function to convert URLs to affiliate links
function addAffiliateParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    
    const affiliate = AFFILIATE_MAPPINGS[domain as keyof typeof AFFILIATE_MAPPINGS];
    if (affiliate) {
      // Add affiliate parameters
      const separator = urlObj.search ? '&' : '?';
      return `${url}${separator}${affiliate.affiliateId}`;
    }
    
    return url;
  } catch {
    return url;
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
          const affiliateUrl = addAffiliateParams(part);
          
          return (
            <a
              key={index}
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 inline-flex items-center gap-1 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                // Optional: Track click for analytics
                console.log('Affiliate link clicked:', affiliateUrl);
              }}
            >
              {part}
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