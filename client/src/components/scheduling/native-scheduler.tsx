import React, { useState } from 'react';
import { useCapacitorScheduler } from '@/hooks/use-capacitor-scheduler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Bell, Repeat } from 'lucide-react';
import { AlarmSoundPicker } from './alarm-sound-picker';

interface NativeSchedulerProps {
  onScheduled?: (alarmId: number) => void;
}

export function NativeScheduler({ onScheduled }: NativeSchedulerProps) {
  const { showDatePicker, scheduleAlarm } = useCapacitorScheduler();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [vibration, setVibration] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [soundConfig, setSoundConfig] = useState<any>({ type: 'system' });

  const handleDatePicker = async (mode: 'date' | 'time' | 'datetime') => {
    const date = await showDatePicker({
      mode,
      theme: 'light' as const,
      min: new Date(), // Can't schedule in the past
    });
    
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSchedule = async () => {
    if (!title.trim() || !selectedDate) {
      return;
    }

    setIsScheduling(true);
    
    try {
      const alarmId = await scheduleAlarm({
        title: title.trim(),
        description: description.trim(),
        date: selectedDate,
        recurring,
        vibration,
        sound: soundConfig.source || 'default'
      });

      if (alarmId) {
        // Reset form
        setTitle('');
        setDescription('');
        setSelectedDate(null);
        setRecurring('none');
        
        // Notify parent component
        onScheduled?.(alarmId);
        
        // Show success feedback
        console.log(`✅ Alarm scheduled for ${selectedDate.toLocaleString()}`);
      } else {
        console.error('Failed to schedule alarm');
        // Show user-friendly error message
        alert('Failed to schedule alarm. Please try again.');
      }
    } catch (error) {
      console.error('Scheduling error:', error);
      // Show user-friendly error message
      alert(`Error scheduling alarm: ${error}`);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Schedule Alarm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="alarm-title">Title</Label>
          <Input
            id="alarm-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Alarm title..."
            maxLength={50}
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <Label htmlFor="alarm-description">Description (Optional)</Label>
          <Input
            id="alarm-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details..."
            maxLength={100}
          />
        </div>

        {/* Date/Time Pickers */}
        <div className="space-y-3">
          <Label>Schedule Time</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDatePicker('date')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Date
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDatePicker('time')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Time
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => handleDatePicker('datetime')}
            className="w-full flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <Clock className="h-4 w-4" />
            Date & Time
          </Button>
          
          {selectedDate && (
            <div className="p-2 bg-muted rounded text-sm">
              Scheduled: {selectedDate.toLocaleString()}
            </div>
          )}
        </div>

        {/* Recurring Options */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Repeat
          </Label>
          <Select value={recurring} onValueChange={(value: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly') => setRecurring(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Repeat</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alarm Sound Picker */}
        <AlarmSoundPicker 
          onSoundSelected={setSoundConfig}
          currentSound={soundConfig}
        />

        {/* Vibration Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="vibration">Vibration</Label>
          <Switch
            id="vibration"
            checked={vibration}
            onCheckedChange={setVibration}
          />
        </div>

        {/* Schedule Button */}
        <Button
          onClick={handleSchedule}
          disabled={!title.trim() || !selectedDate || isScheduling}
          className="w-full"
        >
          {isScheduling ? 'Scheduling...' : 'Schedule Alarm'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Quick preset buttons for common scheduling
export function QuickScheduleButtons({ onScheduled }: NativeSchedulerProps) {
  const { scheduleAlarm } = useCapacitorScheduler();

  const scheduleQuick = async (minutes: number, title: string) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    
    const alarmId = await scheduleAlarm({
      title,
      description: `Quick alarm set for ${minutes} minutes`,
      date,
      recurring: 'none',
      vibration: true
    });

    if (alarmId) {
      onScheduled?.(alarmId);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => scheduleQuick(5, '5 Minute Timer')}
      >
        5 min
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => scheduleQuick(15, '15 Minute Timer')}
      >
        15 min
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => scheduleQuick(30, '30 Minute Timer')}
      >
        30 min
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => scheduleQuick(60, '1 Hour Timer')}
      >
        1 hour
      </Button>
    </div>
  );
}