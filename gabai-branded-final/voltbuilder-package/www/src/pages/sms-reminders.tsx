import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, MessageSquare, Clock, Send, TestTube } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export function SMSRemindersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Create a demo user ID if not logged in
  const effectiveUserId = user?.id || 'demo-user-' + (typeof window !== 'undefined' ? localStorage.getItem('demo-user-id') || Date.now() : Date.now());
  
  // Store demo user ID for consistency
  if (!user?.id && typeof window !== 'undefined' && !localStorage.getItem('demo-user-id')) {
    localStorage.setItem('demo-user-id', effectiveUserId);
  }
  
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [reminderMinutes, setReminderMinutes] = useState("15");
  const [testPhone, setTestPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [reminderType, setReminderType] = useState<"sms" | "voice">("voice"); // Default to voice since it works immediately!
  
  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log('🌍 User timezone detected:', userTimezone);

  // Fetch existing reminders
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: [`/api/reminders?userId=${effectiveUserId}`],
    enabled: !!effectiveUserId,
  });

  // Filter to show only SMS-enabled reminders
  const smsReminders = (reminders as any[]).filter((r: any) => r.smsEnabled);

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure userId is included
      const requestData = {
        ...data,
        userId: user?.id || data.userId
      };
      console.log('📝 Creating reminder with data:', requestData);
      const response = await apiRequest('/api/reminders', 'POST', requestData);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Reminder created successfully:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/reminders?userId=${effectiveUserId}`] });
      
      const reminderText = reminderMinutes === "0" 
        ? "at the exact time" 
        : `${reminderMinutes} minutes before`;
      
      toast({
        title: "✅ SMS Reminder Scheduled!",
        description: `You'll receive a text message ${reminderText}. Check the list below to see your scheduled reminder.`,
      });
      
      // Reset form
      setReminderTitle("");
      setReminderDescription("");
      setReminderDate("");
      setReminderTime("");
      setPhoneNumber("");
      setSmsConsent(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest(`/api/reminders/${id}`, 'PATCH', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reminders?userId=${effectiveUserId}`] });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/reminders/${id}`, 'DELETE');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reminders?userId=${effectiveUserId}`] });
      toast({
        title: "Reminder Deleted",
        description: "SMS reminder has been cancelled",
      });
    },
  });

  // Test SMS mutation
  const testSMSMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest('/api/sms/test', 'POST', { phoneNumber: phone });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test SMS Sent",
        description: "Check your phone for the test message",
      });
      setTestPhone("");
    },
    onError: (error) => {
      toast({
        title: "SMS Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScheduleReminder = () => {
    // Prevent multiple submissions
    if (createReminderMutation.isPending) {
      return;
    }

    if (!reminderTitle || !reminderDate || !reminderTime || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!smsConsent) {
      toast({
        title: "Consent Required",
        description: "Please agree to receive SMS messages",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time in local timezone
    const [year, month, day] = reminderDate.split('-').map(Number);
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hours, minutes);
    
    // The Date object is already in the user's local timezone
    // When we call toISOString(), it automatically converts to UTC
    console.log('📅 Local time selected:', localDate.toString());
    console.log('📅 Will be stored as UTC:', localDate.toISOString());
    console.log('📅 User timezone:', userTimezone);

    // Allow demo users to create reminders
    const currentUserId = effectiveUserId;
    console.log('🆔 Using user ID for reminder:', currentUserId);

    const reminderData = {
      userId: currentUserId,
      title: reminderTitle,
      description: reminderDescription,
      dueDate: localDate.toISOString(),
      smsEnabled: true,
      smsPhone: phoneNumber,
      reminderMinutes: parseInt(reminderMinutes),
      smsStatus: 'pending',
      timezone: userTimezone,
      reminderType: reminderType, // 'sms' or 'voice'
    };
    
    console.log('📝 Creating reminder with data:', reminderData);
    createReminderMutation.mutate(reminderData);
  };

  const handleTestSMS = () => {
    if (!testPhone) {
      toast({
        title: "Phone Required",
        description: "Please enter a phone number to test",
        variant: "destructive",
      });
      return;
    }
    testSMSMutation.mutate(testPhone);
  };

  const setToday = () => {
    const today = new Date();
    setReminderDate(today.toISOString().split('T')[0]);
  };

  const setNow = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setReminderTime(`${hours}:${minutes}`);
  };

  // Quick reminder templates
  const templates = [
    { icon: "💊", title: "Take medication", time: 15 },
    { icon: "🏥", title: "Doctor appointment", time: 60 },
    { icon: "🛒", title: "Pick up groceries", time: 30 },
    { icon: "📞", title: "Make phone call", time: 5 },
    { icon: "💧", title: "Drink water", time: 0 },
    { icon: "🏃", title: "Go for a walk", time: 10 },
  ];

  const useTemplate = (template: any) => {
    setReminderTitle(template.title);
    setReminderMinutes(template.time.toString());
    setShowTemplates(false);
    
    // Set time to now + 30 minutes for quick setup
    const future = new Date();
    future.setMinutes(future.getMinutes() + 30);
    setReminderDate(future.toISOString().split('T')[0]);
    setReminderTime(future.toTimeString().slice(0, 5));
  };

  // Quick time buttons
  const quickSetTime = (minutesFromNow: number) => {
    const future = new Date();
    future.setMinutes(future.getMinutes() + minutesFromNow);
    setReminderDate(future.toISOString().split('T')[0]);
    setReminderTime(future.toTimeString().slice(0, 5));
    
    toast({
      title: `⏰ Set for ${minutesFromNow} minutes from now`,
      description: future.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">SMS Reminders</h1>
          <p className="text-sm text-gray-500">Never forget anything important</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 max-w-2xl mx-auto">
        {/* Quick Templates */}
        {showTemplates && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Quick Reminders</h2>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <Button
                  key={template.title}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => useTemplate(template)}
                >
                  <span className="text-2xl mr-2">{template.icon}</span>
                  <span className="text-left">
                    <div className="font-medium">{template.title}</div>
                    <div className="text-xs text-gray-500">
                      {template.time === 0 ? "At time" : `${template.time} min before`}
                    </div>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Time Buttons */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Remind me in:</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => quickSetTime(5)}
              className="font-medium"
            >
              5 min
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => quickSetTime(15)}
              className="font-medium"
            >
              15 min
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => quickSetTime(30)}
              className="font-medium"
            >
              30 min
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => quickSetTime(60)}
              className="font-medium"
            >
              1 hour
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => quickSetTime(120)}
              className="font-medium"
            >
              2 hours
            </Button>
          </div>
        </div>

        {/* Schedule New Reminder */}
        <Card className="mb-4 border-2 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              New Reminder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Input
                id="title"
                placeholder="What to remember?"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                className="text-lg font-medium"
                data-testid="input-reminder-title"
              />
            </div>

            <div className="flex gap-2">
              <Input
                id="date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="flex-1"
                data-testid="input-reminder-date"
              />
              <Input
                id="time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="flex-1"
                data-testid="input-reminder-time"
              />
            </div>

            <div>
              <Input
                id="phone"
                type="tel"
                placeholder="Your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-number"
              />
            </div>

            {/* Voice/SMS Toggle */}
            <div className="flex items-center gap-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">🎉 Voice Calls Work Now!</p>
                <p className="text-xs text-gray-600">SMS needs approval (1-3 weeks)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReminderType('voice')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    reminderType === 'voice' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  data-testid="button-reminder-voice"
                >
                  📞 Call
                </button>
                <button
                  type="button"
                  onClick={() => setReminderType('sms')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    reminderType === 'sms' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  data-testid="button-reminder-sms"
                >
                  💬 Text
                </button>
              </div>
            </div>

            <select
              id="advance"
              className="w-full p-2 border rounded bg-white"
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(e.target.value)}
              data-testid="select-reminder-minutes"
            >
              <option value="0">🎯 At exact time</option>
              <option value="5">⏱ 5 min early</option>
              <option value="15">⏰ 15 min early</option>
              <option value="30">🕓 30 min early</option>
              <option value="60">🕐 1 hour early</option>
            </select>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent" 
                checked={smsConsent}
                onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                data-testid="checkbox-sms-consent"
              />
              <Label 
                htmlFor="consent" 
                className="text-sm font-normal cursor-pointer"
              >
                I agree to receive {reminderType === 'voice' ? 'voice call' : 'SMS'} reminders
              </Label>
            </div>

            <Button 
              onClick={handleScheduleReminder}
              disabled={createReminderMutation.isPending || !smsConsent}
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
              data-testid="button-schedule-reminder"
            >
              {createReminderMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Set Reminder
                </>
              )}
            </Button>
          </CardContent>
        </Card>


        {/* Active SMS Reminders */}
        {smsReminders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Reminders
            </h2>
            <div className="space-y-2">
              {smsReminders.map((reminder: any) => {
                const localDate = new Date(reminder.dueDate);
                const isToday = localDate.toDateString() === new Date().toDateString();
                const isPast = localDate < new Date();
                
                return (
                  <Card
                    key={reminder.id}
                    className={`p-4 ${isPast ? 'opacity-60' : ''} ${reminder.smsSent ? 'bg-green-50 border-green-200' : 'hover:shadow-md transition-shadow'}`}
                    data-testid={`reminder-${reminder.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{reminder.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">
                            {isToday ? 'Today' : format(localDate, 'MMM d')}
                          </span>
                          <span className="text-sm font-medium">
                            {format(localDate, 'h:mm a')}
                          </span>
                          {(reminder as any).reminderType === 'voice' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              📞 Voice
                            </span>
                          )}
                          {reminder.smsSent && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ Sent
                            </span>
                          )}
                        </div>
                      </div>
                      {!reminder.smsSent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReminderMutation.mutate(reminder.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-${reminder.id}`}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}