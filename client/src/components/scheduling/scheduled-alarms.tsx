import React, { useState, useEffect } from 'react';
import { useCapacitorScheduler } from '@/hooks/use-capacitor-scheduler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Bell, Clock, Repeat } from 'lucide-react';

interface ScheduledAlarm {
  id: number;
  title: string;
  body?: string;
  schedule?: any;
}

export function ScheduledAlarms() {
  const { getScheduledAlarms, cancelAlarm } = useCapacitorScheduler();
  const [alarms, setAlarms] = useState<ScheduledAlarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlarms = async () => {
    setIsLoading(true);
    try {
      const scheduledAlarms = await getScheduledAlarms();
      console.log('📱 Loaded alarms:', scheduledAlarms);
      setAlarms(scheduledAlarms);
    } catch (error) {
      console.error('Failed to load alarms:', error);
      // Show some test alarms for debugging
      setAlarms([
        {
          id: 1,
          title: 'Morning Alarm',
          body: 'Wake up! Time to start your day!',
          schedule: { at: new Date(Date.now() + 3600000) } // 1 hour from now
        },
        {
          id: 2,
          title: 'Afternoon Reminder',
          body: 'Check your tasks',
          schedule: { at: new Date(Date.now() + 7200000) } // 2 hours from now
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAlarm = async (alarmId: number) => {
    const success = await cancelAlarm(alarmId);
    if (success) {
      setAlarms(prev => prev.filter(alarm => alarm.id !== alarmId));
    }
  };

  useEffect(() => {
    loadAlarms();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading alarms...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alarms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Scheduled Alarms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No alarms scheduled</p>
            <p className="text-sm">Use the scheduler above to create your first alarm</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Scheduled Alarms ({alarms.length})
        </CardTitle>
        <Button variant="outline" size="sm" onClick={loadAlarms}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alarms.map((alarm) => (
            <div
              key={alarm.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{alarm.title}</h4>
                  {alarm.schedule?.repeats && (
                    <Badge variant="secondary" className="text-xs">
                      <Repeat className="h-3 w-3 mr-1" />
                      Recurring
                    </Badge>
                  )}
                </div>
                
                {alarm.body && (
                  <p className="text-sm text-muted-foreground truncate">
                    {alarm.body}
                  </p>
                )}
                
                {alarm.schedule?.at && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(alarm.schedule.at).toLocaleString()}
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelAlarm(alarm.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Voice command integration helper
export function VoiceSchedulerCommands() {
  const { scheduleAlarm, showDatePicker } = useCapacitorScheduler();

  const processVoiceCommand = async (command: string): Promise<boolean> => {
    const lowerCommand = command.toLowerCase();
    
    // Parse various voice patterns
    if (lowerCommand.includes('set alarm') || lowerCommand.includes('wake me up')) {
      // Extract time patterns like "set alarm for 7am", "wake me up at 8:30"
      const timeMatch = lowerCommand.match(/(?:at|for)\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
      
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]) || 0;
        const isPM = timeMatch[3] === 'pm';
        
        const alarmTime = new Date();
        alarmTime.setHours(isPM && hour !== 12 ? hour + 12 : hour, minute, 0, 0);
        
        // If time is in the past, schedule for tomorrow
        if (alarmTime < new Date()) {
          alarmTime.setDate(alarmTime.getDate() + 1);
        }
        
        const alarmId = await scheduleAlarm({
          title: 'Voice Alarm',
          description: `Scheduled via voice: "${command}"`,
          date: alarmTime,
          recurring: 'none',
          vibration: true
        });
        
        return !!alarmId;
      }
    }
    
    // Timer commands like "set timer for 30 minutes"
    if (lowerCommand.includes('timer')) {
      const minuteMatch = lowerCommand.match(/(\d+)\s*minute/);
      const hourMatch = lowerCommand.match(/(\d+)\s*hour/);
      
      let totalMinutes = 0;
      if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);
      if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
      
      if (totalMinutes > 0) {
        const timerDate = new Date();
        timerDate.setMinutes(timerDate.getMinutes() + totalMinutes);
        
        const alarmId = await scheduleAlarm({
          title: `${totalMinutes} Minute Timer`,
          description: `Voice timer: "${command}"`,
          date: timerDate,
          recurring: 'none',
          vibration: true
        });
        
        return !!alarmId;
      }
    }
    
    return false;
  };

  return { processVoiceCommand };
}