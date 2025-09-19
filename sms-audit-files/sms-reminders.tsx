import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronDown, MoreVertical, Edit2, Trash2, Users } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  
  const [reminderText, setReminderText] = useState("");
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reminderType, setReminderType] = useState<"sms" | "voice">("voice");
  const [smsConsent, setSmsConsent] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  
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

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      const requestData = {
        ...data,
        userId: user?.id || data.userId
      };
      const response = await apiRequest('/api/reminders', 'POST', requestData);
      return await response.json();
    },
    onSuccess: () => {
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
    if (!targetPhone) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number or select a contact",
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

    const localDate = new Date(reminderDateTime);
    
    const reminderData = {
      userId: effectiveUserId,
      title: reminderText,
      description: selectedContact ? `Reminder for: ${selectedContact.name}` : '',
      dueDate: localDate.toISOString(),
      smsEnabled: true,
      smsPhone: targetPhone,
      reminderMinutes: 0, // Default to exact time
      smsStatus: 'pending',
      timezone: userTimezone,
      reminderType: reminderType,
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
    setPhoneNumber(reminder.smsPhone);
    setReminderType(reminder.reminderType || 'voice');
  };

  const handleContactPicker = async () => {
    // Check if we're in APK environment
    if (typeof window !== 'undefined' && (window as any).cordova && navigator.contacts) {
      try {
        navigator.contacts.pickContact(
          (contact: any) => {
            if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
              const phone = contact.phoneNumbers[0].value.replace(/\D/g, '');
              setSelectedContact({
                name: contact.displayName || contact.name?.formatted || 'Contact',
                phone: phone
              });
              setPhoneNumber(phone);
              toast({
                title: "Contact Selected",
                description: `Will send reminder to ${contact.displayName || 'selected contact'}`,
              });
            } else {
              toast({
                title: "No Phone Number",
                description: "This contact doesn't have a phone number",
                variant: "destructive",
              });
            }
          },
          (error: any) => {
            console.error('Contact picker error:', error);
            toast({
              title: "Contact Selection Failed",
              description: "Could not access contacts",
              variant: "destructive",
            });
          }
        );
      } catch (error) {
        console.error('Contact picker not available:', error);
        toast({
          title: "Contacts Not Available",
          description: "Contact picker is not available on this device",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Contacts Not Available",
        description: "Contact picker is only available in the mobile app",
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

            <Button 
              onClick={handleScheduleReminder}
              disabled={createReminderMutation.isPending || updateReminderMutation.isPending}
              className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700"
              data-testid="button-schedule-reminder"
            >
              {createReminderMutation.isPending || updateReminderMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {editingReminder ? 'Updating...' : 'Scheduling...'}
                </span>
              ) : (
                editingReminder ? 'Update Reminder' : 'Set Reminder'
              )}
            </Button>

            {/* More Options Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2">
                  More options
                  <ChevronDown className="inline-block ml-1 h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>Reminder Options</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  {/* Phone Number Input */}
                  {!selectedContact && (
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1"
                        data-testid="input-phone-number"
                      />
                    </div>
                  )}

                  {/* Voice/SMS Toggle */}
                  <div>
                    <Label>Reminder Type</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={reminderType === 'voice' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReminderType('voice')}
                        className="flex-1"
                        data-testid="button-type-voice"
                      >
                        📞 Voice Call
                      </Button>
                      <Button
                        variant={reminderType === 'sms' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReminderType('sms')}
                        className="flex-1"
                        data-testid="button-type-sms"
                      >
                        💬 Text Message
                      </Button>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="consent" 
                      checked={smsConsent}
                      onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                      data-testid="checkbox-consent"
                    />
                    <Label 
                      htmlFor="consent" 
                      className="text-sm font-normal cursor-pointer"
                    >
                      I consent to receive automated {reminderType === 'voice' ? 'voice call' : 'SMS text message'} reminders at this number from Booah LLC (GabAi Reminder App). Message frequency varies. Message & data rates may apply. Reply STOP to unsubscribe.
                    </Label>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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