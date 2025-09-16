import { Button } from "@/components/ui/button";
import { Calendar, Download, Smartphone, CheckCircle } from "lucide-react";
import { useNativeCalendar } from "@/hooks/use-native-calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MobileCalendarSyncProps {
  event: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
  };
  className?: string;
}

export function MobileCalendarSync({ event, className }: MobileCalendarSyncProps) {
  const { addEvent, addEventWithPrompt, isLoading, isNativeApp } = useNativeCalendar();

  const handleAddToCalendar = async () => {
    await addEvent(event);
  };

  const handleOpenCalendarApp = async () => {
    await addEventWithPrompt(event);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Add to Calendar</span>
        </CardTitle>
        <CardDescription>
          {isNativeApp 
            ? "Sync this event directly to your device calendar"
            : "Download calendar file or open in your calendar app"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Native app - seamless integration */}
        {isNativeApp ? (
          <div className="space-y-2">
            <Button
              onClick={handleAddToCalendar}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading ? "Adding..." : "Add to Calendar"}
            </Button>
            
            <Button
              onClick={handleOpenCalendarApp}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Open Calendar App
            </Button>
          </div>
        ) : (
          /* Web - download ICS file */
          <div className="space-y-2">
            <Button
              onClick={handleAddToCalendar}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? "Preparing..." : "Download Calendar File"}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Opens your default calendar app
            </p>
          </div>
        )}

        {/* Event details preview */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
          <div className="space-y-1">
            <div><strong>Event:</strong> {event.title}</div>
            <div><strong>Date:</strong> {event.startDate.toLocaleDateString()}</div>
            <div><strong>Time:</strong> {event.startDate.toLocaleTimeString()} - {event.endDate.toLocaleTimeString()}</div>
            {event.location && <div><strong>Location:</strong> {event.location}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}