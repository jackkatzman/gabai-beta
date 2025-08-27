import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Bell, Volume2, Calendar, Plus } from "lucide-react";
import { Link } from "wouter";
import { useCapacitorScheduler } from "@/hooks/use-capacitor-scheduler";
import { useAlarmSounds } from "@/hooks/use-alarm-sounds";
import { ScheduledAlarms } from "@/components/scheduling/scheduled-alarms";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { MobileCalendarSync } from "@/components/calendar/mobile-calendar-sync";

export function AlarmsPage() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [alarmTitle, setAlarmTitle] = useState("");
  const [voicePersonality, setVoicePersonality] = useState<'drill-sergeant' | 'gentle' | 'funny'>('gentle');
  const [selectedRingtone, setSelectedRingtone] = useState("Timer");
  const [availableRingtones, setAvailableRingtones] = useState<string[]>([]);
  const [calendarEvent, setCalendarEvent] = useState<{
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
  } | null>(null);
  
  const capacitorScheduler = useCapacitorScheduler();
  const { scheduleAlarm, showDatePicker } = capacitorScheduler || {};
  const alarmSounds = useAlarmSounds();
  const { playAlarmSound, generateVoiceAlarm, getUserRingtones } = alarmSounds || {};
  const { toast } = useToast();

  // Load available Android ringtones on component mount
  useEffect(() => {
    const loadRingtones = async () => {
      if (getUserRingtones) {
        console.log('🔔 APK Loading available ringtones...');
        const ringtones = await getUserRingtones();
        console.log('🔔 APK Available ringtones:', ringtones);
        setAvailableRingtones(ringtones);
      }
    };
    loadRingtones();
  }, [getUserRingtones]);

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

      console.log('🔔 APK: Calling scheduleAlarm with:', {
        title: alarmTitle,
        date: alarmDate,
        voicePersonality
      });

      const alarmId = await scheduleAlarm({
        title: alarmTitle,
        description: `AI Voice Alarm - ${voicePersonality} style`,
        date: alarmDate,
        recurring: 'none',
        vibration: true,
        sound: selectedRingtone || 'Timer',
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
        
        // Show calendar sync option
        setCalendarEvent({
          title: alarmTitle,
          description: `AI Voice Alarm - ${voicePersonality} style`,
          startDate: alarmDate,
          endDate: new Date(alarmDate.getTime() + 30 * 60000), // 30 minute duration
          location: undefined
        });
        
        // Clear form and refresh alarms
        setSelectedTime("");
        setSelectedDate("");
        setAlarmTitle("");
        setSelectedRingtone("Timer");
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
      console.error('🔔 APK Alarm setting error:', error);
      toast({
        title: "Alarm Error",
        description: error.message || "There was an error setting your alarm. Please try again.",
        variant: "destructive"
      });
      setIsScheduling(false);
    } finally {
      // Always ensure we reset the scheduling state
      console.log('🔔 APK: Resetting isScheduling state');
      setTimeout(() => setIsScheduling(false), 100); // Delayed reset to prevent UI race conditions
    }
  };

  const [currentTestAudio, setCurrentTestAudio] = useState<HTMLAudioElement | null>(null);

  const testVoice = async () => {
    if (!playAlarmSound) {
      toast({
        title: "Voice Test Error",
        description: "Voice playback not available",
        variant: "destructive"
      });
      return;
    }

    // Stop any currently playing test audio
    if (currentTestAudio) {
      currentTestAudio.pause();
      currentTestAudio.currentTime = 0;
      setCurrentTestAudio(null);
    }

    const result = await playAlarmSound({
      type: 'ai-voice',
      voiceOptions: {
        text: alarmTitle || "Wake up! Time to start your day!",
        personality: voicePersonality
      }
    });

    // Track the audio element for cleanup
    if (result && (window as any).lastPlayedAudio) {
      setCurrentTestAudio((window as any).lastPlayedAudio);
      
      // Auto-stop after 10 seconds for test
      setTimeout(() => {
        if ((window as any).lastPlayedAudio) {
          (window as any).lastPlayedAudio.pause();
          (window as any).lastPlayedAudio.currentTime = 0;
          setCurrentTestAudio(null);
        }
      }, 10000);
    }
  };

  // Add stop test function
  const stopTestVoice = () => {
    if (currentTestAudio) {
      currentTestAudio.pause();
      currentTestAudio.currentTime = 0;
      setCurrentTestAudio(null);
    }
  };

  return (
    <div className="min-h-screen pb-32 overflow-auto" style={{ 
      WebkitOverflowScrolling: 'touch',
      height: '100vh',
      maxHeight: '100vh'
    }}>
      <div className="space-y-4 p-4" style={{ paddingBottom: '120px' }}>
      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Alarms</h1>
        <div className="w-16"></div>
      </div>

      {/* Quick Timers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Timers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {[5, 15, 30, 60].map((minutes) => (
              <Button
                key={minutes}
                variant="outline"
                onClick={() => handleQuickTimer(minutes)}
                className="h-12"
                size="sm"
              >
                {minutes}m
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

              {/* Android Ringtone Picker */}
              <div>
                <label className="block text-sm font-medium mb-2">Alarm Sound (Android Ringtones)</label>
                <Select value={selectedRingtone} onValueChange={setSelectedRingtone}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose ringtone" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRingtones.length > 0 ? (
                      availableRingtones.map((ringtone) => (
                        <SelectItem key={ringtone} value={ringtone}>
                          {ringtone.replace('content://settings/system/', '').replace('content://media/internal/audio/media/', 'System Sound ').replace('_', ' ')}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Timer">Timer</SelectItem>
                        <SelectItem value="Alarm">Alarm</SelectItem>
                        <SelectItem value="Argon">Argon</SelectItem>
                        <SelectItem value="Cesium">Cesium</SelectItem>
                        <SelectItem value="Helium">Helium</SelectItem>
                        <SelectItem value="Krypton">Krypton</SelectItem>
                        <SelectItem value="Neon">Neon</SelectItem>
                        <SelectItem value="Oxygen">Oxygen</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                        <SelectItem value="Uranium">Uranium</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
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
                  onClick={currentTestAudio ? stopTestVoice : testVoice} 
                  className="flex-1"
                  disabled={!alarmTitle}
                >
                  {currentTestAudio ? "Stop Test" : "Test Voice"}
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
                ✅ APK Alarm System Active
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

      {/* Calendar Sync for Recently Set Alarm */}
      {calendarEvent && (
        <MobileCalendarSync 
          event={calendarEvent}
          className="mb-6"
        />
      )}

      {/* Scheduled Alarms */}
      <ScheduledAlarms />

        {/* Bottom Navigation */}
        <div className="h-20" /> {/* Spacer for bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}