import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MoreVertical, Edit2, Trash2, Users } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SMSRemindersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use the actual user ID - require authentication
  const effectiveUserId = user?.id;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user?.id) {
      console.log('🔒 User not authenticated, redirecting to login');
      window.location.href = '/api/auth/google';
    }
  }, [user]);
  
  const [reminderText, setReminderText] = useState("");
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reminderType, setReminderType] = useState<"sms" | "voice">("voice");
  const [smsConsent, setSmsConsent] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  
  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Load saved preferences
  useEffect(() => {
    const savedPhone = localStorage.getItem('reminder-phone');
    const savedConsent = localStorage.getItem('reminder-consent');
    if (savedPhone) setPhoneNumber(savedPhone);
    if (savedConsent === 'true') setSmsConsent(true);
  }, []);

  // Set default date/time to next hour
  useEffect(() => {
    if (!reminderDateTime && !editingReminder) {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      const localString = now.toISOString().slice(0, 16);
      setReminderDateTime(localString);
    }
  }, []);

  // Fetch existing reminders
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: [`/api/reminders?userId=${effectiveUserId}`],
    enabled: !!effectiveUserId,
  });

  // Filter to show only SMS-enabled reminders
  const smsReminders = (reminders as any[]).filter((r: any) => r.smsEnabled);

  // Fetch groups for group reminders
  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
    enabled: !!effectiveUserId,
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🔵 Creating reminder with data:', data);
      const requestData = {
        ...data,
        userId: user?.id || data.userId
      };
      console.log('🔵 Request data:', requestData);
      
      const response = await apiRequest('/api/reminders', 'POST', requestData);
      console.log('🔵 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Failed to create reminder: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Reminder created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Mutation success callback, reminder:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/reminders?userId=${effectiveUserId}`] });
      
      toast({
        title: "✅ Reminder Set!",
        description: `We'll ${reminderType === 'voice' ? 'call' : 'text'} you at the scheduled time.`,
      });
      
      // Reset form
      setReminderText("");
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      setReminderDateTime(now.toISOString().slice(0, 16));
      setEditingReminder(null);
      setSelectedContact(null);
      setSelectedGroupId("");
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
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
      toast({
        title: "Reminder Updated",
        description: "Your changes have been saved",
      });
      setEditingReminder(null);
      setReminderText("");
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      setReminderDateTime(now.toISOString().slice(0, 16));
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
        description: "The reminder has been cancelled",
      });
    },
  });

  const handleScheduleReminder = async () => {
    if (createReminderMutation.isPending || updateReminderMutation.isPending) {
      return;
    }

    if (!reminderText || !reminderDateTime) {
      toast({
        title: "Missing Information",
        description: "Please enter what to remember and when",
        variant: "destructive",
      });
      return;
    }

    const targetPhone = selectedContact?.phone || phoneNumber;
    // Skip phone validation if group is selected
    if (!targetPhone && !selectedGroupId) {
      toast({
        title: "Recipient Required",
        description: "Please enter a phone number, select a contact, or choose a group",
        variant: "destructive",
      });
      return;
    }

    if (!smsConsent) {
      toast({
        title: "Consent Required",
        description: "Please agree to receive reminders",
        variant: "destructive",
      });
      return;
    }

    // Save preferences locally
    localStorage.setItem('reminder-phone', targetPhone);
    localStorage.setItem('reminder-consent', 'true');
    
    // Save consent to database for AI to check
    if (user && smsConsent) {
      try {
        await apiRequest('/api/auth/sms-consent', 'POST', {
          consent: true,
          phone: targetPhone
        });
        console.log('✅ SMS consent saved to user preferences');
      } catch (error) {
        console.error('Failed to save SMS consent:', error);
      }
    }

    // TIMEZONE FIX: The datetime-local input gives us local time without timezone
    // We need to ensure it's properly converted to UTC for storage
    const localDate = new Date(reminderDateTime);
    
    // Debug logging to track timezone conversion
    console.log('📅 Creating reminder with timezone handling:', {
      inputValue: reminderDateTime,
      localDate: localDate.toString(),
      localTimeString: localDate.toLocaleTimeString(),
      utcISOString: localDate.toISOString(),
      userTimezone: userTimezone,
      currentTime: new Date().toString(),
    });
    
    const reminderData = {
      userId: effectiveUserId,
      title: reminderText,
      description: selectedContact ? `Reminder for: ${selectedContact.name}` : (selectedGroupId ? 'Group reminder' : ''),
      dueDate: localDate.toISOString(), // Stores in UTC
      smsEnabled: true,
      smsPhone: targetPhone || null, // null for group reminders
      reminderMinutes: 0, // Default to exact time (send at the specified time)
      smsStatus: 'pending',
      timezone: userTimezone, // Store user's timezone for display purposes
      reminderType: reminderType,
      groupId: selectedGroupId || null, // Add group ID if selected
    };
    
    if (editingReminder) {
      updateReminderMutation.mutate({ id: editingReminder.id, ...reminderData });
    } else {
      createReminderMutation.mutate(reminderData);
    }
  };

  const handleEditReminder = (reminder: any) => {
    setEditingReminder(reminder);
    setReminderText(reminder.title);
    const localDate = new Date(reminder.dueDate);
    setReminderDateTime(localDate.toISOString().slice(0, 16));
    setPhoneNumber(reminder.smsPhone || '');
    setReminderType(reminder.reminderType || 'voice');
    // Restore group selection if editing a group reminder
    setSelectedGroupId(reminder.groupId || '');
    // Clear contact if editing a group reminder
    if (reminder.groupId) {
      setSelectedContact(null);
    }
  };

  const handleContactPicker = async () => {
    // Use CordovaDirect for contact picking
    const { CordovaDirect } = await import('@/lib/cordova-direct');
    
    if (!CordovaDirect.isAvailable()) {
      toast({
        title: "Contacts Not Available",
        description: "Contact picker is only available in the mobile app",
        variant: "destructive",
      });
      return;
    }

    try {
      const contact = await CordovaDirect.pickContact();
      
      if (contact) {
        setSelectedContact(contact);
        setPhoneNumber(contact.phone);
        // Clear group selection when contact is picked
        setSelectedGroupId('');
        toast({
          title: "Contact Selected",
          description: `Will send reminder to ${contact.name}`,
        });
      } else {
        toast({
          title: "No Phone Number",
          description: "This contact doesn't have a phone number",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Contact picker error:', error);
      toast({
        title: "Contact Selection Failed",
        description: error.message || "Could not access contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Clean Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-medium">Reminders</h1>
      </div>

      {/* Minimal Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Main Input Section - Ultra Clean */}
          <div className="space-y-4">
            <Input
              placeholder="What should I remind you?"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              className="text-lg h-14 border-gray-200 focus:border-blue-500"
              data-testid="input-reminder-text"
            />

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  className="h-14 text-base border-gray-200 focus:border-blue-500"
                  data-testid="input-reminder-datetime"
                />
              </div>
              
              {/* Contact Picker Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 border-gray-200"
                onClick={handleContactPicker}
                data-testid="button-contact-picker"
              >
                <Users className="h-5 w-5" />
              </Button>
            </div>

            {selectedContact && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm">
                  Sending to: <strong>{selectedContact.name}</strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedContact(null);
                    setPhoneNumber("");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Phone Number Input - Now visible if no contact selected and no group selected */}
            {!selectedContact && !selectedGroupId && (
              <Input
                type="tel"
                placeholder="Phone number (e.g., +1234567890)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-14 text-base border-gray-200 focus:border-blue-500"
                data-testid="input-phone-number"
              />
            )}

            {/* Group Selection */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Or send to a group (Premium)
              </Label>
              <Select 
                value={selectedGroupId} 
                onValueChange={(value) => {
                  setSelectedGroupId(value);
                  if (value) {
                    setSelectedContact(null);
                    setPhoneNumber("");
                  }
                }}
              >
                <SelectTrigger 
                  className="h-14 text-base border-gray-200 focus:border-blue-500"
                  data-testid="select-group"
                >
                  <SelectValue placeholder="Select a group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {(groups as any[]).map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.members?.length || 0} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGroupId && (
                <button
                  onClick={() => setSelectedGroupId("")}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  data-testid="button-clear-group"
                >
                  Clear group selection
                </button>
              )}
            </div>

            {/* Voice/SMS Toggle */}
            <div className="flex gap-2">
              <Button
                variant={reminderType === 'voice' ? 'default' : 'outline'}
                onClick={() => setReminderType('voice')}
                className="flex-1 h-12"
              >
                📞 Voice Call
              </Button>
              <Button
                variant={reminderType === 'sms' ? 'default' : 'outline'}
                onClick={() => setReminderType('sms')}
                className="flex-1 h-12"
              >
                💬 Text Message
              </Button>
            </div>

            {/* Consent Checkbox - Now visible in main form */}
            <div className="flex items-start space-x-2 mb-4">
              <Checkbox 
                id="consent-main" 
                checked={smsConsent}
                onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                data-testid="checkbox-consent-main"
                className="mt-1"
              />
              <Label 
                htmlFor="consent-main" 
                className="text-xs font-normal cursor-pointer text-gray-600 dark:text-gray-400"
              >
                I consent to receive automated {reminderType === 'voice' ? 'voice calls' : 'SMS messages'} at the number provided. Message & data rates may apply.
              </Label>
            </div>

            <Button 
              onClick={handleScheduleReminder}
              disabled={createReminderMutation.isPending || updateReminderMutation.isPending || !smsConsent}
              className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              data-testid="button-schedule-reminder"
            >
              {createReminderMutation.isPending || updateReminderMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {editingReminder ? 'Updating...' : 'Scheduling...'}
                </span>
              ) : (
                !smsConsent ? 'Please accept consent to continue' : (editingReminder ? 'Update Reminder' : 'Set Reminder')
              )}
            </Button>
          </div>

          {/* Clean Reminders List */}
          {smsReminders.length > 0 && (
            <div className="pt-6 border-t">
              <h2 className="text-sm font-medium text-gray-500 mb-3">UPCOMING</h2>
              <div className="space-y-2">
                {smsReminders.map((reminder: any) => {
                  const localDate = new Date(reminder.dueDate);
                  const isToday = localDate.toDateString() === new Date().toDateString();
                  const isPast = localDate < new Date();
                  
                  return (
                    <div
                      key={reminder.id}
                      className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 ${
                        isPast ? 'opacity-50' : ''
                      } ${reminder.smsSent ? 'bg-green-50' : ''}`}
                      data-testid={`reminder-${reminder.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{reminder.title}</div>
                        <div className="text-sm text-gray-500">
                          {isToday ? 'Today' : format(localDate, 'MMM d')} at {format(localDate, 'h:mm a')}
                          {reminder.reminderType === 'voice' && ' • 📞'}
                          {reminder.smsSent && ' • ✓ Sent'}
                        </div>
                      </div>
                      
                      {!reminder.smsSent && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditReminder(reminder)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteReminderMutation.mutate(reminder.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && smsReminders.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No reminders scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}