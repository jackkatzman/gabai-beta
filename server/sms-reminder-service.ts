import { db } from './db';
import { reminders, users, groups, groupMembers } from '@shared/schema';
import { eq, and, lte, gte, or } from 'drizzle-orm';
import { sendReminderSMS, makeReminderCall, twilioClient } from './services/sms';

const TWILIO_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

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

    // Get the user's timezone (from reminder or user profile)
    const userTimezone = reminder.timezone || 'America/New_York';
    
    // Format the message with proper timezone display
    const formattedDate = formatDateInTimezone(new Date(reminder.dueDate), userTimezone);
    
    // Check if this is a group reminder
    if (reminder.groupId) {
      console.log(`📱 Sending group reminder for group: ${reminder.groupId}`);
      
      // Get group and user info
      const [group] = await db.select().from(groups).where(eq(groups.id, reminder.groupId));
      if (!group) {
        throw new Error('Group not found');
      }

      const [user] = await db.select().from(users).where(eq(users.id, reminder.userId));
      const senderName = user?.name || 'Someone';

      // Get all group members
      const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, reminder.groupId));
      
      if (members.length === 0) {
        console.log(`⚠️ Group ${reminder.groupId} has no members`);
        // Mark as sent with skipped status to prevent endless retries
        await db
          .update(reminders)
          .set({
            smsSent: true,
            smsSentAt: new Date(),
            smsStatus: 'skipped:no-members',
          })
          .where(eq(reminders.id, reminderId));
        return { sid: 'no-members', messageId: 'no-members', success: true };
      }

      // Send SMS to each member with viral messaging
      const results = [];
      for (const member of members) {
        try {
          // Viral message format: "From [sender]: [reminder]. Get GabAI at gabai.ai"
          const viralMessage = `From ${senderName}: ${reminder.title} - Due: ${formattedDate}. Get GabAI at gabai.ai`;
          
          const result = await sendReminderSMS(
            member.phone,
            viralMessage,
            reminder.description || ''
          );
          
          if (result.success) {
            console.log(`✅ Sent group reminder to ${member.name} (${member.phone})`);
            results.push({ member: member.name, phone: member.phone, status: 'sent', sid: result.messageId });
          } else {
            console.error(`❌ Failed to send to ${member.name} (${member.phone}): ${result.error}`);
            results.push({ member: member.name, phone: member.phone, status: 'failed', error: result.error });
          }
        } catch (error) {
          console.error(`❌ Error sending to ${member.name} (${member.phone}):`, error);
          results.push({ member: member.name, phone: member.phone, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      // Update reminder status
      // CRITICAL: Retry logic to prevent spam while allowing recovery from total failures:
      // - All sent: smsSent=true, allows no retry
      // - All failed: smsSent=false, allows automatic retry (transient Twilio errors)
      // - Partial: smsSent=true, prevents retry to avoid spamming successful recipients
      const sentCount = results.filter(r => r.status === 'sent').length;
      const failedCount = results.filter(r => r.status !== 'sent').length;
      const allSent = sentCount === members.length;
      const noneSent = sentCount === 0;
      
      await db
        .update(reminders)
        .set({
          smsSent: noneSent ? false : true, // False only if ALL failed (allows retry)
          smsSentAt: sentCount > 0 ? new Date() : undefined, // Only set if at least one sent
          smsStatus: allSent ? 'sent' : noneSent ? 'failed' : `partial:${sentCount}/${members.length}`,
        })
        .where(eq(reminders.id, reminderId));

      console.log(`📱 Group reminder sent to ${sentCount}/${members.length} members`);
      
      // For partial failures, throw error to surface in scheduler logs for manual follow-up
      // This prevents silent failures while avoiding automatic retry spam
      if (!allSent && !noneSent) {
        const failedMembers = results
          .filter(r => r.status !== 'sent')
          .map(r => `${r.member} (${r.phone})`)
          .join(', ');
        
        const error = new Error(
          `Partial group reminder failure: ${sentCount}/${members.length} sent successfully. ` +
          `Failed members: ${failedMembers}. Manual follow-up required.`
        );
        console.error('⚠️ Partial failure:', error.message);
        throw error;
      }
      
      return { sid: 'group-reminder', messageId: 'group-reminder', success: allSent, groupResults: results };
    }

    // Regular single-recipient reminder
    if (!reminder.smsEnabled || !reminder.smsPhone) {
      throw new Error('SMS not enabled or phone number not set');
    }

    const reminderTitle = `${reminder.title} - Due: ${formattedDate}`;
    const reminderDescription = reminder.description || '';

    // Check if reminder prefers voice call (based on reminderType field or default to SMS)
    const useVoiceCall = (reminder as any).reminderType === 'voice' || (reminder as any).preferVoice === true;
    
    // Send reminder via SMS or voice call
    const result = useVoiceCall 
      ? await makeReminderCall(
          reminder.smsPhone,
          reminder.title,
          reminder.description || undefined
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
      // TIMEZONE FIX: Use the exact reminderMinutes value (0 means send at exact time, not 15 minutes early)
      const minutesBefore = reminder.reminderMinutes ?? 0; // Default to 0 (exact time) not 15
      reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

      console.log(`📱 Checking reminder "${reminder.title}":`, {
        dueDate: reminder.dueDate,
        sendTime: reminderTime.toISOString(),
        currentTime: now.toISOString(),
        minutesBefore: minutesBefore,
        shouldSend: reminderTime <= now
      });

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