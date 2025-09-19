import { db } from './db';
import { reminders, users } from '@shared/schema';
import { eq, and, lte, gte, or } from 'drizzle-orm';
import { sendReminderSMS, makeReminderCall } from './services/sms';

// Convert UTC date to user's timezone for display
function formatDateInTimezone(date: Date, timezone: string): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}, falling back to UTC`);
    return date.toLocaleString('en-US');
  }
}

export async function sendSMSReminder(reminderId: string) {
  try {
    const [reminder] = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, reminderId));

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    if (!reminder.smsEnabled || !reminder.smsPhone) {
      throw new Error('SMS not enabled or phone number not set');
    }

    // Get the user's timezone (from reminder or user profile)
    const userTimezone = reminder.timezone || 'America/New_York';
    
    // Format the message with proper timezone display
    const formattedDate = formatDateInTimezone(new Date(reminder.dueDate), userTimezone);
    const reminderTitle = `${reminder.title} - Due: ${formattedDate}`;
    const reminderDescription = reminder.description || '';

    // Check if reminder prefers voice call (based on reminderType field or default to SMS)
    const useVoiceCall = (reminder as any).reminderType === 'voice' || (reminder as any).preferVoice === true;
    
    // Send reminder via SMS or voice call
    const result = useVoiceCall 
      ? await makeReminderCall(
          reminder.smsPhone,
          reminder.title,
          reminder.description
        )
      : await sendReminderSMS(
          reminder.smsPhone,
          reminderTitle,
          reminderDescription
        );
    
    if (!result.success) {
      throw new Error(result.error || `Failed to send ${useVoiceCall ? 'voice call' : 'SMS'}`);
    }
    
    console.log(`📱 ${useVoiceCall ? 'Voice call' : 'SMS'} reminder initiated successfully`);
    

    // Update reminder status
    await db
      .update(reminders)
      .set({
        smsSent: true,
        smsSentAt: new Date(),
        smsStatus: 'sent',
      })
      .where(eq(reminders.id, reminderId));

    console.log(`📱 SMS reminder sent successfully: ${result.messageId}`);
    return { sid: result.messageId, ...result };
  } catch (error) {
    console.error('📱 Failed to send SMS reminder:', error);
    
    // Update status to failed
    await db
      .update(reminders)
      .set({
        smsStatus: 'failed',
      })
      .where(eq(reminders.id, reminderId));
    
    throw error;
  }
}

// Check and send pending SMS reminders
export async function checkAndSendPendingReminders() {
  try {
    const now = new Date();
    console.log(`📱 Checking for pending SMS reminders at ${now.toISOString()}`);
    
    // Find reminders that:
    // - Have SMS enabled
    // - Haven't been sent yet
    // - Are due within their reminder window
    const pendingReminders = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.smsEnabled, true),
          eq(reminders.smsSent, false),
          eq(reminders.completed, false),
          lte(reminders.dueDate, new Date(now.getTime() + 24 * 60 * 60 * 1000)) // Due within 24 hours
        )
      );

    console.log(`📱 Found ${pendingReminders.length} pending reminders`);
    const processedReminders = [];

    for (const reminder of pendingReminders) {
      // Calculate when to send the reminder
      const reminderTime = new Date(reminder.dueDate);
      reminderTime.setMinutes(reminderTime.getMinutes() - (reminder.reminderMinutes || 15));

      console.log(`📱 Checking reminder "${reminder.title}": Due at ${reminder.dueDate}, Send at ${reminderTime.toISOString()}, Now: ${now.toISOString()}`);

      // If it's time to send the reminder
      if (reminderTime <= now) {
        try {
          await sendSMSReminder(reminder.id);
          console.log(`✅ Sent SMS reminder for: ${reminder.title}`);
          processedReminders.push({
            id: reminder.id,
            title: reminder.title,
            status: 'sent'
          });
        } catch (error) {
          console.error(`❌ Failed to send SMS for reminder ${reminder.id}:`, error);
          processedReminders.push({
            id: reminder.id,
            title: reminder.title,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        console.log(`⏰ Not time yet for reminder: ${reminder.title}`);
      }
    }

    return processedReminders;
  } catch (error) {
    console.error('Error checking pending reminders:', error);
    return [];
  }
}

// Test SMS functionality
export async function sendTestSMS(phoneNumber: string) {
  try {
    const result = await twilioClient.messages.create({
      body: '🎉 GabAI SMS reminders are working! You will receive text message reminders for your scheduled events.',
      to: phoneNumber,
      from: TWILIO_FROM_NUMBER,
    });

    console.log(`📱 Test SMS sent successfully: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('📱 Failed to send test SMS:', error);
    throw error;
  }
}