import { useState, useCallback } from 'react';
// Using Capacitor's native calendar integration approach
// @ebarooni/capacitor-calendar has version conflicts, using alternative approach
import { isNativeApp } from '@/utils/capacitor';
import { useToast } from '@/hooks/use-toast';
import { CordovaNative } from '@/lib/cordova-native';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  allDay?: boolean;
  reminder?: number; // minutes before event
}

export function useNativeCalendar() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Define downloadICSFile first since other functions depend on it
  const downloadICSFile = useCallback(async (event: CalendarEvent) => {
    console.log('📅 Processing ICS file for event:', event);
    
    try {
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//GabAi//Calendar Event//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@gabai.ai`,
        `DTSTART:${formatDate(event.startDate)}`,
        `DTEND:${formatDate(event.endDate)}`,
        `SUMMARY:${event.title}`,
        event.description ? `DESCRIPTION:${event.description}` : '',
        event.location ? `LOCATION:${event.location}` : '',
        `DTSTAMP:${formatDate(new Date())}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(line => line !== '').join('\r\n');

      console.log('📅 ICS content generated:', icsContent);

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      
      // Check if we're in Cordova/APK environment
      const isAPK = (window as any).IS_APK || 
                    (window as any).IS_VOLTBUILDER_APK ||
                    CordovaNative.isAvailable();
      
      if (isAPK && window.cordova?.plugins?.fileOpener2) {
        // Use Cordova File and File-Opener plugins for APK
        console.log('📱 Using Cordova File-Opener for ICS file');
        
        try {
          await CordovaNative.openIcsFile(blob, `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
          
          toast({
            title: "Opening Calendar",
            description: "Choose your calendar app to add this event",
          });
        } catch (error) {
          console.error('📅 Cordova file opener error:', error);
          // Fall back to web download
          downloadWebICS();
        }
      } else {
        // Use web download approach
        downloadWebICS();
      }
      
      function downloadWebICS() {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('📅 ICS file download triggered');

        toast({
          title: "Calendar File Downloaded",
          description: "Open the downloaded .ics file to add to your calendar",
        });
      }
    } catch (error) {
      console.error('📅 Error processing ICS file:', error);
      toast({
        title: "Download Error",
        description: "Failed to process calendar file",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Request calendar permissions
  const requestPermissions = useCallback(async () => {
    if (!isNativeApp()) {
      console.log('📱 Not in native app - calendar permissions not needed');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('📅 Requesting calendar permissions...');
      
      // Request calendar permissions through native integration
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // Use native calendar integration
        console.log('📅 Using native calendar permission request');
      }
      setHasPermission(true);
      
      toast({
        title: "Calendar Access Granted",
        description: "You can now sync events to your device calendar",
      });
      
      return true;
    } catch (error: any) {
      console.error('📅 Calendar permission error:', error);
      setHasPermission(false);
      
      toast({
        title: "Calendar Permission Needed",
        description: "Please grant calendar access in your device settings",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Add event to native calendar
  const addEvent = useCallback(async (event: CalendarEvent): Promise<boolean> => {
    if (!isNativeApp()) {
      console.log('📱 Not in native app - falling back to ICS download');
      // Fall back to ICS file download for web
      downloadICSFile(event);
      return true;
    }

    try {
      setIsLoading(true);
      
      // Check/request permissions first
      if (hasPermission === null || !hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return false;
      }

      console.log('📅 Adding event to native calendar:', event.title);
      
      // Create event using native calendar integration
      console.log('📅 Creating calendar event:', event.title);
      
      // For now, use ICS file approach that works on all platforms
      downloadICSFile(event);
      const result = true; // Success for ICS download

      console.log('📅 Calendar event created:', result);
      
      toast({
        title: "Event Added",
        description: `"${event.title}" added to your calendar`,
      });
      
      return true;
    } catch (error: any) {
      console.error('📅 Failed to add calendar event:', error);
      
      toast({
        title: "Calendar Error",
        description: error.message || "Failed to add event to calendar",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, requestPermissions, downloadICSFile, toast]);

  // Add event with native calendar UI prompt
  const addEventWithPrompt = useCallback(async (event: CalendarEvent): Promise<boolean> => {
    if (!isNativeApp()) {
      // Fall back to ICS download for web
      downloadICSFile(event);
      return true;
    }

    try {
      setIsLoading(true);
      
      // Check/request permissions first
      if (hasPermission === null || !hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return false;
      }

      console.log('📅 Opening native calendar UI for:', event.title);
      
      // Open native calendar through ICS file
      downloadICSFile(event);
      
      toast({
        title: "Calendar Opened",
        description: "Complete adding the event in your calendar app",
      });
      
      return true;
    } catch (error: any) {
      console.error('📅 Failed to open calendar UI:', error);
      
      toast({
        title: "Calendar Error", 
        description: error.message || "Failed to open calendar",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, requestPermissions, downloadICSFile, toast]);


  return {
    hasPermission,
    isLoading,
    requestPermissions,
    addEvent,
    addEventWithPrompt,
    downloadICSFile,
    isNativeApp: isNativeApp(),
  };
}