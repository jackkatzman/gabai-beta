// Timezone detection and management utilities

export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn("Could not detect timezone, defaulting to America/New_York");
    return "America/New_York";
  }
}

export function getCommonTimezones(): Array<{ value: string; label: string; offset: string }> {
  const now = new Date();
  const timezones = [
    'America/New_York',     // EST/EDT - US East Coast, Canada
    'America/Chicago',      // CST/CDT - US Central, Mexico
    'America/Denver',       // MST/MDT - US Mountain
    'America/Los_Angeles',  // PST/PDT - US West Coast
    'America/Phoenix',      // MST - Arizona
    'America/Anchorage',    // AKST - Alaska
    'Pacific/Honolulu',     // HST - Hawaii
    'America/Sao_Paulo',    // GMT-3 - Brazil, Argentina, Uruguay
    'Europe/London',        // GMT/BST - UK, Ireland  
    'Europe/Paris',         // CET/CEST - France, Spain, Italy
    'Europe/Berlin',        // CET/CEST - Germany, Netherlands
    'Asia/Jerusalem',       // IST - Israel, Palestine
    'Asia/Tokyo',           // JST - Japan
    'Asia/Shanghai',        // CST - China
    'Asia/Kolkata',         // IST - India
    'Australia/Sydney',     // AEST/AEDT - Australia East
    'America/Toronto',      // EST/EDT - Canada East
    'America/Mexico_City'   // CST/CDT - Mexico
  ];

  return timezones.map(tz => {
    try {
      const offset = now.toLocaleString('en-US', { 
        timeZone: tz,
        timeZoneName: 'short'
      }).split(' ').slice(-1)[0];
      
      const city = tz.split('/')[1]?.replace(/_/g, ' ') || tz;
      
      // Add country/region context for clarity
      const locationMap: { [key: string]: string } = {
        'America/New_York': 'New York - US East Coast, Canada',
        'America/Chicago': 'Chicago - US Central, Mexico',  
        'America/Denver': 'Denver - US Mountain',
        'America/Los_Angeles': 'Los Angeles - US West Coast',
        'America/Phoenix': 'Phoenix - Arizona',
        'America/Anchorage': 'Anchorage - Alaska',
        'Pacific/Honolulu': 'Honolulu - Hawaii',
        'America/Sao_Paulo': 'São Paulo - Brazil, Argentina',
        'Europe/London': 'London - UK, Ireland',
        'Europe/Paris': 'Paris - France, Spain, Italy', 
        'Europe/Berlin': 'Berlin - Germany, Netherlands',
        'Asia/Jerusalem': 'Jerusalem - Israel, Palestine',
        'Asia/Tokyo': 'Tokyo - Japan',
        'Asia/Shanghai': 'Shanghai - China',
        'Asia/Kolkata': 'Mumbai - India',
        'Australia/Sydney': 'Sydney - Australia East',
        'America/Toronto': 'Toronto - Canada East',
        'America/Mexico_City': 'Mexico City - Mexico'
      };
      
      const location = locationMap[tz] || city;
      
      return {
        value: tz,
        label: `${location} (${offset})`,
        offset
      };
    } catch {
      return {
        value: tz,
        label: tz.replace(/_/g, ' '),
        offset: ''
      };
    }
  });
}

export function formatDateInTimezone(date: Date | string, timezone: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return dateObj.toLocaleString('en-US', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn(`Invalid timezone ${timezone}, using local time`);
    return dateObj.toLocaleString();
  }
}

export function convertToUserTimezone(date: Date | string, userTimezone: string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get the offset difference between user timezone and UTC
  const userOffset = getTimezoneOffset(userTimezone);
  const localOffset = dateObj.getTimezoneOffset();
  
  // Adjust for timezone difference
  const offsetDiff = (userOffset + localOffset) * 60000; // Convert to milliseconds
  return new Date(dateObj.getTime() + offsetDiff);
}

function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (utc.getTime() - targetTime.getTime()) / 60000; // Return offset in minutes
  } catch {
    return 0; // Default to UTC if timezone is invalid
  }
}