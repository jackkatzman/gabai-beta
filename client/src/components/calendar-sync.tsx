import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { calendarApi } from '@/lib/calendar';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Download, Smartphone, ExternalLink, Copy } from 'lucide-react';

export function CalendarSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCalendar = async () => {
    if (!user?.id) return;
    
    setIsExporting(true);
    try {
      await calendarApi.exportCalendar(user.id);
      toast({
        title: "Calendar Exported!",
        description: "Your calendar file has been downloaded. Import it into your device's calendar app.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySubscriptionUrl = async () => {
    if (!user?.id) return;
    
    const url = calendarApi.getSubscriptionUrl(user.id);
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "Calendar subscription URL copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Native Calendar Sync
        </CardTitle>
        <CardDescription>
          Sync your GabAi appointments and reminders with your device's native calendar app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Calendar File */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Export Calendar File</h3>
              <p className="text-sm text-muted-foreground">
                Download an ICS file to import into any calendar app
              </p>
            </div>
            <Button 
              onClick={handleExportCalendar}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export ICS"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Apple Calendar</Badge>
            <Badge variant="secondary">Google Calendar</Badge>
            <Badge variant="secondary">Outlook</Badge>
            <Badge variant="secondary">Any ICS-compatible app</Badge>
          </div>
        </div>

        {/* Calendar Subscription */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Calendar Subscription</h3>
              <p className="text-sm text-muted-foreground">
                Subscribe to a live feed that updates automatically
              </p>
            </div>
            <Button 
              onClick={handleCopySubscriptionUrl}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Subscription URL:</p>
            <code className="text-xs break-all">{calendarApi.getSubscriptionUrl(user.id)}</code>
          </div>
        </div>

        {/* Mobile Instructions */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Mobile Setup Instructions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">iPhone/iPad:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>1. Download the ICS file above</li>
                <li>2. Open the file and tap "Add to Calendar"</li>
                <li>3. Choose which calendar to import to</li>
                <li>4. Your GabAi events will appear in the native Calendar app</li>
              </ol>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Android:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>1. Download the ICS file above</li>
                <li>2. Open Google Calendar app</li>
                <li>3. Tap Menu → Settings → Add calendar → From file</li>
                <li>4. Select the downloaded ICS file</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Web Calendar Instructions */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Web Calendar Setup
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Google Calendar:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>1. Copy the subscription URL above</li>
                <li>2. Go to Google Calendar in your browser</li>
                <li>3. Click "+" next to "Other calendars"</li>
                <li>4. Select "From URL" and paste the link</li>
              </ol>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Outlook/Office 365:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>1. Copy the subscription URL above</li>
                <li>2. Go to Outlook.com or open Outlook</li>
                <li>3. Click "Add calendar" → "Subscribe from web"</li>
                <li>4. Paste the URL and name your calendar</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Sync Notice */}
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Changes you make in GabAi will appear in your calendar. 
            Updates may take a few minutes to sync depending on your calendar app's refresh settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}