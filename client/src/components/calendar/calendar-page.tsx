import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Mic, Check, Edit, Trash2, Calendar, Clock, CalendarDays, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useVoice } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Reminder } from "@shared/schema";
import { format, isToday, isTomorrow, isPast, startOfDay, endOfDay, addDays } from "date-fns";
import { CalendarSync } from "@/components/calendar-sync";
import { calendarApi } from "@/lib/calendar";

interface CalendarPageProps {
  user: User;
}

const categories = [
  { value: "appointment", label: "Appointment", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "meeting", label: "Meeting", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "health", label: "Health", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "work", label: "Work", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "personal", label: "Personal", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
];

export function CalendarPage({ user }: CalendarPageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    category: "appointment",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get reminders/appointments
  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders", user.id],
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: (reminderData: any) => api.createReminder(reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", user.id] });
      setIsCreateDialogOpen(false);
      setNewReminder({
        title: "",
        description: "",
        dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        category: "appointment",
      });
      toast({
        title: "Appointment Created",
        description: "Your appointment has been added to the calendar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Appointment",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => api.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", user.id] });
      toast({
        title: "Appointment Deleted",
        description: "Your appointment has been removed from the calendar.",
      });
    },
  });

  // Voice input for creating appointments
  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      setNewReminder(prev => ({ ...prev, title: text }));
      setIsVoiceMode(false);
    },
    onError: (error) => {
      console.error("Voice input error:", error);
      setIsVoiceMode(false);
    },
  });

  const handleCreateReminder = () => {
    if (newReminder.title.trim()) {
      createReminderMutation.mutate({
        userId: user.id,
        title: newReminder.title.trim(),
        description: newReminder.description.trim() || undefined,
        dueDate: new Date(newReminder.dueDate),
        category: newReminder.category,
      });
    }
  };

  const handleVoiceMode = () => {
    setIsVoiceMode(true);
    toggleRecording();
  };

  // Group reminders by date
  const groupRemindersByDate = (reminders: Reminder[]) => {
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(new Date(), 1));
    
    const grouped = {
      overdue: [] as Reminder[],
      today: [] as Reminder[],
      tomorrow: [] as Reminder[],
      upcoming: [] as Reminder[],
    };

    reminders.forEach(reminder => {
      const reminderDate = startOfDay(new Date(reminder.dueDate));
      
      if (reminderDate < today && !reminder.completed) {
        grouped.overdue.push(reminder);
      } else if (reminderDate.getTime() === today.getTime()) {
        grouped.today.push(reminder);
      } else if (reminderDate.getTime() === tomorrow.getTime()) {
        grouped.tomorrow.push(reminder);
      } else {
        grouped.upcoming.push(reminder);
      }
    });

    return grouped;
  };

  const formatReminderTime = (dueDate: string | Date) => {
    const date = new Date(dueDate);
    return date.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatReminderDate = (dueDate: string | Date) => {
    const date = new Date(dueDate);
    return date.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const handleExportEvent = async (reminderId: string) => {
    try {
      await calendarApi.exportEvent(reminderId);
      toast({
        title: "Event Exported!",
        description: "Calendar event file has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export event. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const groupedReminders = groupRemindersByDate(reminders);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarDays className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Calendar
            </h2>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-10 h-10 rounded-full p-0">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Appointment</DialogTitle>
                <DialogDescription>
                  Schedule a new appointment or meeting in your calendar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="title"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Dentist appointment, Team meeting..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleVoiceMode}
                      disabled={isRecording || isTranscribing}
                      className="shrink-0"
                    >
                      <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
                    </Button>
                  </div>
                  {isTranscribing && (
                    <p className="text-sm text-gray-500 mt-1">Processing speech...</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newReminder.description}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Date & Time</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newReminder.dueDate}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newReminder.category}
                    onValueChange={(value) => setNewReminder(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateReminder}
                    disabled={!newReminder.title.trim() || createReminderMutation.isPending}
                    className="flex-1"
                  >
                    {createReminderMutation.isPending ? "Creating..." : "Create Appointment"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Overdue */}
        {groupedReminders.overdue.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Overdue ({groupedReminders.overdue.length})
            </h3>
            <div className="space-y-2">
              {groupedReminders.overdue.map((reminder) => {
                const categoryInfo = getCategoryInfo(reminder.category || "appointment");
                return (
                  <Card key={reminder.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {reminder.title}
                            </h4>
                            <Badge className={categoryInfo.color}>
                              {categoryInfo.label}
                            </Badge>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatReminderDate(reminder.dueDate)}</span>
                            <span>{formatReminderTime(reminder.dueDate)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportEvent(reminder.id)}
                            className="text-gray-400 hover:text-blue-500"
                            title="Export to calendar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteReminderMutation.mutate(reminder.id)}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete appointment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Today */}
        {groupedReminders.today.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today ({groupedReminders.today.length})
            </h3>
            <div className="space-y-2">
              {groupedReminders.today.map((reminder) => {
                const categoryInfo = getCategoryInfo(reminder.category || "appointment");
                return (
                  <Card key={reminder.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {reminder.title}
                            </h4>
                            <Badge className={categoryInfo.color}>
                              {categoryInfo.label}
                            </Badge>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {reminder.description}
                            </p>
                          )}
                          <div className="text-sm text-gray-500">
                            {formatReminderTime(reminder.dueDate)}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportEvent(reminder.id)}
                            className="text-gray-400 hover:text-blue-500"
                            title="Export to calendar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteReminderMutation.mutate(reminder.id)}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete appointment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tomorrow */}
        {groupedReminders.tomorrow.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Tomorrow ({groupedReminders.tomorrow.length})
            </h3>
            <div className="space-y-2">
              {groupedReminders.tomorrow.map((reminder) => {
                const categoryInfo = getCategoryInfo(reminder.category || "appointment");
                return (
                  <Card key={reminder.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {reminder.title}
                            </h4>
                            <Badge className={categoryInfo.color}>
                              {categoryInfo.label}
                            </Badge>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {reminder.description}
                            </p>
                          )}
                          <div className="text-sm text-gray-500">
                            {formatReminderTime(reminder.dueDate)}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportEvent(reminder.id)}
                            className="text-gray-400 hover:text-blue-500"
                            title="Export to calendar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteReminderMutation.mutate(reminder.id)}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete appointment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {groupedReminders.upcoming.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming ({groupedReminders.upcoming.length})
            </h3>
            <div className="space-y-2">
              {groupedReminders.upcoming.map((reminder) => {
                const categoryInfo = getCategoryInfo(reminder.category || "appointment");
                return (
                  <Card key={reminder.id} className="border-l-4 border-l-gray-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {reminder.title}
                            </h4>
                            <Badge className={categoryInfo.color}>
                              {categoryInfo.label}
                            </Badge>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatReminderDate(reminder.dueDate)}</span>
                            <span>{formatReminderTime(reminder.dueDate)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportEvent(reminder.id)}
                            className="text-gray-400 hover:text-blue-500"
                            title="Export to calendar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteReminderMutation.mutate(reminder.id)}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete appointment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {reminders.length === 0 && (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No appointments scheduled
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create your first appointment or ask GabAi to schedule one for you.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Appointment
            </Button>
          </div>
        )}

        {/* Calendar Sync Section */}
        {reminders.length > 0 && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <CalendarSync />
          </div>
        )}
      </div>
    </div>
  );
}