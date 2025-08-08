import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Bell, Volume2, Calendar, Plus } from "lucide-react";
import { Link } from "wouter";
import { useCapacitorScheduler } from "@/hooks/use-capacitor-scheduler";
import { useAlarmSounds } from "@/hooks/use-alarm-sounds";
import { ScheduledAlarms } from "@/components/scheduling/scheduled-alarms";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/navigation/bottom-nav";

export function AlarmsPage() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [alarmTitle, setAlarmTitle] = useState("");
  const [voicePersonality, setVoicePersonality] = useState<'drill-sergeant' | 'gentle' | 'funny'>('gentle');
  
  const capacitorScheduler = useCapacitorScheduler();
  const { scheduleAlarm, showDatePicker } = capacitorScheduler || {};
  const alarmSounds = useAlarmSounds();
  const { playAlarmSound, generateVoiceAlarm } = alarmSounds || {};
  const { toast } = useToast();

  const handleQuickTimer = async (minutes: number) => {
    if (!scheduleAlarm) {
      toast({
        title: "Alarm Error",
        description: "Alarm scheduling not available",
        variant: "destructive"
      });
      return;
    }

    const timerDate = new Date();
    timerDate.setMinutes(timerDate.getMinutes() + minutes);
    
    const alarmId = await scheduleAlarm({
      title: `${minutes} Minute Timer`,
      description: `Quick timer set for ${minutes} minutes`,
      date: timerDate,
      recurring: 'none',
      vibration: true,
      sound: 'default'
    });
    
    if (alarmId) {
      toast({
        title: "Timer Set",
        description: `${minutes} minute timer started`,
      });
    }
  };

  const setToday = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    setSelectedDate(todayString);
  };

  const handleVoiceAlarm = async () => {
    console.log('🔔 Setting alarm with:', { selectedTime, selectedDate, alarmTitle, voicePersonality });
    setIsScheduling(true);
    
    if (!selectedTime || !alarmTitle) {
      toast({
        title: "Missing Information",
        description: "Please set a time and title for your alarm",
        variant: "destructive"
      });
      setIsScheduling(false);
      return;
    }

    if (!scheduleAlarm) {
      toast({
        title: "Alarm Error", 
        description: "Alarm scheduling not available",
        variant: "destructive"
      });
      setIsScheduling(false);
      return;
    }

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      let alarmDate = new Date();
      
      // Use selected date if provided, otherwise use today
      if (selectedDate) {
        const [year, month, day] = selectedDate.split('-').map(Number);
        alarmDate = new Date(year, month - 1, day);
      }
      
      alarmDate.setHours(hours, minutes, 0, 0);
      
      // If time is in the past and no date selected, schedule for tomorrow
      if (!selectedDate && alarmDate < new Date()) {
        alarmDate.setDate(alarmDate.getDate() + 1);
      }

      console.log('🔔 Alarm date created:', alarmDate);

      if (!scheduleAlarm) {
        toast({
          title: "Alarm Error", 
          description: "Alarm scheduling not available",
          variant: "destructive"
        });
        return;
      }

      const alarmId = await scheduleAlarm({
        title: alarmTitle,
        description: `AI Voice Alarm - ${voicePersonality} style`,
        date: alarmDate,
        recurring: 'none',
        vibration: true,
        sound: 'ai-voice',
        voiceOptions: {
          text: alarmTitle,
          personality: voicePersonality
        }
      });

      console.log('🔔 Alarm ID returned:', alarmId);

      if (alarmId) {
        toast({
          title: "Voice Alarm Set",
          description: `${voicePersonality} alarm set for ${alarmDate.toLocaleString()}`,
        });
        // Clear form and refresh alarms
        setSelectedTime("");
        setSelectedDate("");
        setAlarmTitle("");
        setIsScheduling(false);
      } else {
        toast({
          title: "Alarm Failed",
          description: "Could not set the alarm. Please try again.",
          variant: "destructive"
        });
        setIsScheduling(false);
      }
    } catch (error) {
      console.error('🔔 Alarm setting error:', error);
      toast({
        title: "Alarm Error",
        description: "There was an error setting your alarm. Please try again.",
        variant: "destructive"
      });
      setIsScheduling(false);
    }
  };

  const testVoice = async () => {
    if (!playAlarmSound) {
      toast({
        title: "Voice Test Error",
        description: "Voice playback not available",
        variant: "destructive"
      });
      return;
    }

    await playAlarmSound({
      type: 'ai-voice',
      voiceOptions: {
        text: alarmTitle || "Wake up! Time to start your day!",
        personality: voicePersonality
      }
    });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Alarms & Timers</h1>
        <div className="w-20"></div>
      </div>

      {/* Quick Timers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Quick Timers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[5, 15, 30, 60].map((minutes) => (
              <Button
                key={minutes}
                variant="outline"
                onClick={() => handleQuickTimer(minutes)}
                className="flex flex-col items-center p-4 h-auto"
              >
                <Clock className="h-6 w-6 mb-2" />
                <span>{minutes}m</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Voice Alarms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />
              <span>AI Voice Alarms</span>
            </div>
            <Button 
              size="sm" 
              onClick={() => setIsScheduling(!isScheduling)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Alarm</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isScheduling ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Alarm Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                  />
                  <Button 
                    variant="outline" 
                    onClick={setToday}
                    className="px-4"
                  >
                    Today
                  </Button>
                </div>
                {!selectedDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    No date selected - will use today or tomorrow if time has passed
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Alarm Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Alarm Message</label>
                <input
                  type="text"
                  value={alarmTitle}
                  onChange={(e) => setAlarmTitle(e.target.value)}
                  placeholder="Wake up! Time to start your day!"
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Voice Personality</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gentle', label: 'Gentle', desc: 'Sweet & calm' },
                    { id: 'drill-sergeant', label: 'Drill Sergeant', desc: 'Tough & motivating' },
                    { id: 'funny', label: 'Funny', desc: 'Playful & witty' }
                  ].map((voice) => (
                    <Button
                      key={voice.id}
                      variant={voicePersonality === voice.id ? "default" : "outline"}
                      onClick={() => setVoicePersonality(voice.id as any)}
                      className="flex flex-col items-center p-3 h-auto"
                    >
                      <span className="font-medium">{voice.label}</span>
                      <span className="text-xs text-gray-500">{voice.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={testVoice} 
                  className="flex-1"
                  disabled={!alarmTitle}
                >
                  Test Voice
                </Button>
                <Button 
                  onClick={handleVoiceAlarm} 
                  className="flex-1"
                  disabled={!selectedTime || !alarmTitle || isScheduling}
                >
                  {isScheduling ? "Setting..." : "Set Alarm"}
                </Button>
              </div>
              
              {(!selectedTime || !alarmTitle) && (
                <p className="text-xs text-gray-500 text-center">
                  Please set both time and message to enable alarm
                </p>
              )}
              
              <p className="text-xs text-center text-green-600">
                ✅ Manual alarm system ready - Fixed Aug 8, 2025
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create personalized wake-up calls with AI voices
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <strong>Gentle</strong><br/>Sweet & calming
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <strong>Drill Sergeant</strong><br/>Tough motivator
                </div>
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <strong>Funny</strong><br/>Playful & witty
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Alarms */}
      <ScheduledAlarms />

      {/* Bottom Navigation */}
      <div className="h-20" /> {/* Spacer for bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}