import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Mic, Check, Edit, Trash2, Calendar, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useVoice } from "@/hooks/use-voice";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Reminder } from "@/types";
import { format, isToday, isTomorrow, isPast } from "date-fns";

interface RemindersPageProps {
  user: User;
}

const categories = [
  { value: "health", label: "Health", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "work", label: "Work", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "family", label: "Family", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "personal", label: "Personal", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "shopping", label: "Shopping", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
];

const recurringOptions = [
  { value: "", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function RemindersPage({ user }: RemindersPageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    dueDate: "",
    category: "",
    recurring: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get reminders
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["/api/reminders", user.id],
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: (reminderData: Omit<Reminder, "id" | "createdAt" | "updatedAt">) =>
      api.createReminder(reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", user.id] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Reminder Created",
        description: "Your reminder has been created successfully.",
      });
    },
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Reminder> }) =>
      api.updateReminder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", user.id] });
      toast({
        title: "Reminder Updated",
        description: "Your reminder has been updated.",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => api.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", user.id] });
      toast({
        title: "Reminder Deleted",
        description: "Your reminder has been deleted.",
      });
    },
  });

  // Voice input for creating reminders
  const { isRecording, isTranscribing, toggleRecording } = useVoice({
    onTranscriptionComplete: (text) => {
      // Parse voice input for reminder details
      const parsed = parseVoiceReminder(text);
      setNewReminder(prev => ({
        ...prev,
        title: parsed.title,
        description: parsed.description,
        dueDate: parsed.dueDate || prev.dueDate,
      }));
      setIsVoiceMode(false);
    },
  });

  const resetForm = () => {
    setNewReminder({
      title: "",
      description: "",
      dueDate: "",
      category: "",
      recurring: "",
    });
  };

  const handleCreateReminder = () => {
    if (!newReminder.title.trim() || !newReminder.dueDate) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and due date for the reminder.",
        variant: "destructive",
      });
      return;
    }

    createReminderMutation.mutate({
      userId: user.id,
      title: newReminder.title.trim(),
      description: newReminder.description.trim() || undefined,
      dueDate: newReminder.dueDate,
      category: newReminder.category || undefined,
      recurring: newReminder.recurring || undefined,
      completed: false,
    });
  };

  const handleVoiceReminder = () => {
    setIsVoiceMode(true);
    setIsCreateDialogOpen(true);
    toggleRecording();
  };

  const handleCompleteReminder = (reminder: Reminder) => {
    updateReminderMutation.mutate({
      id: reminder.id,
      updates: { completed: !reminder.completed },
    });
  };

  const getCategoryInfo = (categoryValue: string) => {
    return categories.find(cat => cat.value === categoryValue) || 
           { value: categoryValue, label: categoryValue, color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" };
  };

  // Group reminders by time
  const groupedReminders = reminders.reduce((acc, reminder) => {
    const dueDate = new Date(reminder.dueDate);
    let group: string;

    if (isPast(dueDate) && !reminder.completed) {
      group = "overdue";
    } else if (isToday(dueDate)) {
      group = "today";
    } else if (isTomorrow(dueDate)) {
      group = "tomorrow";
    } else {
      group = "upcoming";
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(reminder);
    return acc;
  }, {} as Record<string, Reminder[]>);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reminders
          </h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-10 h-10 rounded-full p-0">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Reminder</DialogTitle>
              </DialogHeader>
              <CreateReminderForm
                newReminder={newReminder}
                setNewReminder={setNewReminder}
                onSubmit={handleCreateReminder}
                onVoiceInput={handleVoiceReminder}
                isLoading={createReminderMutation.isPending}
                isVoiceMode={isVoiceMode}
                isRecording={isRecording}
                isTranscribing={isTranscribing}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Voice Reminder */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <Button
          onClick={handleVoiceReminder}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2"
        >
          <Mic className="h-4 w-4" />
          <span>Set reminder with voice</span>
        </Button>
      </div>

      {/* Reminders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedReminders).map(([group, groupReminders]) => {
          if (groupReminders.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 capitalize">
                {group === "overdue" ? "Overdue" : group}
                {group === "overdue" && (
                  <span className="ml-2 text-red-500">({groupReminders.length})</span>
                )}
              </h3>
              
              <div className="space-y-3">
                {groupReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onComplete={handleCompleteReminder}
                    onDelete={(id) => deleteReminderMutation.mutate(id)}
                    isOverdue={group === "overdue"}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {reminders.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No reminders yet. Create your first reminder!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CreateReminderFormProps {
  newReminder: any;
  setNewReminder: (reminder: any) => void;
  onSubmit: () => void;
  onVoiceInput: () => void;
  isLoading: boolean;
  isVoiceMode: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
}

function CreateReminderForm({
  newReminder,
  setNewReminder,
  onSubmit,
  onVoiceInput,
  isLoading,
  isVoiceMode,
  isRecording,
  isTranscribing,
}: CreateReminderFormProps) {
  return (
    <div className="space-y-4">
      {/* Voice Input Button */}
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onVoiceInput}
          disabled={isRecording || isTranscribing}
          className="flex items-center space-x-2"
        >
          <Mic className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
          <span>Voice Input</span>
        </Button>
        
        {(isRecording || isTranscribing) && (
          <div className="flex items-center space-x-2">
            {isRecording && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Recording...</span>
              </>
            )}
            {isTranscribing && (
              <>
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Processing...</span>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={newReminder.title}
          onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
          placeholder="What do you need to remember?"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={newReminder.description}
          onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
          placeholder="Additional details (optional)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date & Time *</Label>
        <Input
          id="dueDate"
          type="datetime-local"
          value={newReminder.dueDate}
          onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={newReminder.category}
          onValueChange={(value) => setNewReminder({ ...newReminder, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
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

      <div>
        <Label htmlFor="recurring">Recurring</Label>
        <Select
          value={newReminder.recurring}
          onValueChange={(value) => setNewReminder({ ...newReminder, recurring: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select recurrence" />
          </SelectTrigger>
          <SelectContent>
            {recurringOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={onSubmit}
        disabled={!newReminder.title.trim() || !newReminder.dueDate || isLoading}
        className="w-full"
      >
        Create Reminder
      </Button>
    </div>
  );
}

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  isOverdue: boolean;
}

function ReminderCard({ reminder, onComplete, onDelete, isOverdue }: ReminderCardProps) {
  const categoryInfo = getCategoryInfo(reminder.category || "");
  const dueDate = new Date(reminder.dueDate);

  return (
    <Card className={`${isOverdue && !reminder.completed ? "border-red-300 dark:border-red-700" : ""}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className={`font-medium ${
                reminder.completed 
                  ? "line-through text-gray-500 dark:text-gray-400" 
                  : "text-gray-900 dark:text-white"
              }`}>
                {reminder.title}
              </h4>
              {isOverdue && !reminder.completed && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
            
            {reminder.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {reminder.description}
              </p>
            )}
            
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(dueDate, "MMM d, yyyy 'at' h:mm a")}
              </span>
              {reminder.recurring && (
                <Badge variant="outline" className="text-xs">
                  {reminder.recurring}
                </Badge>
              )}
            </div>
            
            {reminder.category && (
              <Badge className={`text-xs ${categoryInfo.color}`}>
                {categoryInfo.label}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onComplete(reminder)}
              className={`w-8 h-8 p-0 ${
                reminder.completed 
                  ? "text-green-600 hover:text-green-700" 
                  : "text-gray-400 hover:text-green-600"
              }`}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(reminder.id)}
              className="w-8 h-8 p-0 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to parse voice input for reminders
function parseVoiceReminder(text: string) {
  const lowerText = text.toLowerCase();
  
  // Extract time patterns
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)/i,
    /(\d{1,2})\s*(am|pm)/i,
    /(morning|afternoon|evening|tonight)/i,
  ];
  
  // Extract date patterns
  const datePatterns = [
    /(today|tomorrow|next week|next month)/i,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  ];
  
  let dueDate = "";
  
  // Simple parsing - this could be enhanced with a proper NLP library
  if (lowerText.includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
    dueDate = tomorrow.toISOString().slice(0, 16);
  } else if (lowerText.includes("today")) {
    const today = new Date();
    today.setHours(today.getHours() + 1, 0, 0, 0); // Default to next hour
    dueDate = today.toISOString().slice(0, 16);
  }
  
  return {
    title: text,
    description: "",
    dueDate,
  };
}

function getCategoryInfo(categoryValue: string) {
  return categories.find(cat => cat.value === categoryValue) || 
         { value: categoryValue, label: categoryValue, color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" };
}
