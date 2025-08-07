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
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'America/Toronto',
    'America/Mexico_City',
    'America/Sao_Paulo'
  ];

  return timezones.map(tz => {
    try {
      const offset = now.toLocaleString('en-US', { 
        timeZone: tz,
        timeZoneName: 'short'
      }).split(' ').slice(-1)[0];
      
      const city = tz.split('/')[1]?.replace(/_/g, ' ') || tz;
      
      return {
        value: tz,
        label: `${city} (${offset})`,
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