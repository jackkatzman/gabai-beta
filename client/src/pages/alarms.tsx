// v1.0.1 - Fixed alarm state and calendar download
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Bell, Volume2, Calendar, Plus } from "lucide-react";
import { Link } from "wouter";
import { useSimpleAlarms } from "@/hooks/use-simple-alarms";
import { useCapacitorAlarms } from "@/hooks/use-capacitor-alarms";
import { ScheduledAlarms } from "@/components/scheduling/scheduled-alarms";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { MobileCalendarSync } from "@/components/calendar/mobile-calendar-sync";

export function AlarmsPage() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [alarmTitle, setAlarmTitle] = useState("");
  const [selectedSound, setSelectedSound] = useState("beep");
  const [availableSounds, setAvailableSounds] = useState<{id: string, name: string}[]>([]);
  const [voicePersonality, setVoicePersonality] = useState<'gentle' | 'drill-sergeant' | 'funny'>('gentle');
  const [availableRingtones, setAvailableRingtones] = useState<string[]>([]);
  const [calendarEvent, setCalendarEvent] = useState<{
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
  } | null>(null);
  
  const { playAlarmSound, getAlarmSounds, scheduleSimpleAlarm, getScheduledAlarms, cancelAlarm } = useSimpleAlarms();
  const { scheduleAlarm: scheduleNativeAlarm, initializeAlarmChannel } = useCapacitorAlarms();
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  // Load available alarm sounds on component mount
  useEffect(() => {
    const sounds = getAlarmSounds();
    setAvailableSounds(sounds);
    
    // Initialize alarm channel for Android
    if (isNative) {
      initializeAlarmChannel();
    }
  }, [getAlarmSounds, isNative, initializeAlarmChannel]);

  const handleQuickTimer = async (minutes: number) => {
    try {
      const timerDate = new Date();
      timerDate.setMinutes(timerDate.getMinutes() + minutes);
      
      const alarmId = await scheduleSimpleAlarm({
        title: `${minutes} Minute Timer`,
        time: timerDate,
        sound: selectedSound
      });
      
      if (alarmId) {
        toast({
          title: "Timer Set",
          description: `${minutes} minute timer started`,
        });
      } else {
        throw new Error("Failed to schedule timer");
      }
    } catch (error) {
      toast({
        title: "Timer Error",
        description: error instanceof Error ? error.message : "Failed to set timer",
        variant: "destructive"
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
    
    if (!selectedTime || !alarmTitle) {
      toast({
        title: "Missing Information",
        description: "Please set a time and title for your alarm",
        variant: "destructive"
      });
      return;
    }
    
    // Request notification permissions for native alarms
    if (isNative) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permResult = await LocalNotifications.requestPermissions();
        console.log('📱 Notification permissions:', permResult);
        
        if (permResult.display !== 'granted') {
          toast({
            title: "Notifications Blocked",
            description: "Please go to Settings → Apps → GabAi → Notifications and enable them to use alarms",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Permission request failed:', error);
      }
    }
    
    setIsScheduling(true);

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

      // Add timeout to prevent infinite waiting
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Alarm scheduling timeout')), 10000);
      });

      // Use native alarms for APK, web alarms for browser
      const alarmPromise = isNative 
        ? scheduleNativeAlarm({
            id: Date.now().toString(),
            title: alarmTitle,
            message: `Wake up! Your ${voicePersonality} alarm is going off!`,
            time: alarmDate,
            soundName: selectedSound
          })
        : scheduleSimpleAlarm({
            title: `${alarmTitle} (${voicePersonality})`,
            time: alarmDate,
            sound: selectedSound || 'beep'
          });

      const alarmId = await Promise.race([alarmPromise, timeoutPromise]) as string;

      console.log('🔔 Alarm ID returned:', alarmId);

      if (alarmId) {
        // Show calendar sync option first
        setCalendarEvent({
          title: alarmTitle,
          description: `Alarm - ${voicePersonality} style`,
          startDate: alarmDate,
          endDate: new Date(alarmDate.getTime() + 30 * 60000), // 30 minute duration
          location: undefined
        });
        
        toast({
          title: "✅ Alarm Set Successfully",
          description: `Alarm "${alarmTitle}" set for ${alarmDate.toLocaleString()}`,
        });
        
        // Clear form and refresh alarms
        setSelectedTime("");
        setSelectedDate("");
        setAlarmTitle("");
        setSelectedSound("beep");
        setIsScheduling(false); // Close scheduling form
      } else {
        throw new Error("No alarm ID returned");
      }
    } catch (error) {
      console.error('🔔 Alarm setting error:', error);
      toast({
        title: "Alarm Error",
        description: (error as any)?.message || "Failed to set alarm. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Always reset scheduling state after a delay to ensure UI updates
      setTimeout(() => {
        setIsScheduling(false);
      }, 100);
    }
  };

  const [currentTestAudio, setCurrentTestAudio] = useState<HTMLAudioElement | null>(null);

  const testVoice = async () => {
    if (!playAlarmSound) {
      toast({
        title: "Sound Test Error",
        description: "Sound playback not available",
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

    // Play the selected sound
    playAlarmSound(selectedSound);
    
    toast({
      title: "Playing Sound",
      description: `Playing ${selectedSound} sound`,
    });
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

      {/* SMS Reminders Notice for APK */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <Bell className="h-5 w-5" />
            <span className="font-semibold">SMS Reminders Available!</span>
          </div>
          <p className="text-sm text-green-600 mb-3">
            Get reliable text message reminders that work even when the app is closed.
          </p>
          <Link href="/sms-reminders">
            <Button className="w-full" variant="default">
              <Bell className="h-4 w-4 mr-2" />
              Use SMS Reminders Instead
            </Button>
          </Link>
        </CardContent>
      </Card>

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
                <Select value={selectedSound} onValueChange={setSelectedSound}>
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
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔔 Alarm button clicked');
                    handleVoiceAlarm();
                  }} 
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