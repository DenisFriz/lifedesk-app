import { Types } from 'mongoose';
import { sendReminderQueue, reminderJobId, type ReminderEntityType } from './sendReminderQueue.js';

type DateTimeFields = {
  dateField: string;
  timeField: string;
};

const entityDateTimeFields: Record<ReminderEntityType, DateTimeFields> = {
  goal: { dateField: 'target_date', timeField: 'target_time' },
  task: { dateField: 'due_date', timeField: 'due_time' },
  event: { dateField: 'start_date', timeField: 'start_time' },
};

function formatTimeLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  if (minutes === 60) {
    return '1 hour';
  }
  if (minutes === 1440) {
    return '1 day';
  }
  if (minutes < 1440) {
    return `${Math.floor(minutes / 60)} hours`;
  }
  return `${Math.floor(minutes / 1440)} days`;
}

export async function scheduleReminders(
  entityType: ReminderEntityType,
  record: { _id: Types.ObjectId; title: string; reminders?: any[] } & Record<string, any>,
  userId: Types.ObjectId,
): Promise<void> {
  try {
    const { dateField, timeField } = entityDateTimeFields[entityType];

    const dateStr = record[dateField];
    const timeStr = record[timeField];

    if (!dateStr || !timeStr) {
      return;
    }

    const reminders = Array.isArray(record.reminders) ? record.reminders : [];
    if (reminders.length === 0) {
      return;
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      return;
    }

    const entityDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const now = Date.now();

    for (const reminderMinutes of reminders) {
      if (!Number.isFinite(reminderMinutes) || reminderMinutes <= 0) {
        continue;
      }

      const fireAtMs = entityDateTime.getTime() - reminderMinutes * 60000;

      if (fireAtMs <= now) {
        continue;
      }

      const delay = fireAtMs - now;
      const timeLabel = formatTimeLabel(reminderMinutes);
      const entityTypeLabel =
        entityType === 'event' ? 'Starting' : entityType === 'task' ? 'Due' : 'Target';
      const body = `${entityTypeLabel} in ${timeLabel}`;
      const url = `/${entityType}?id=${record._id}`;

      const jobId = reminderJobId(entityType, record._id.toString(), reminderMinutes);

      await sendReminderQueue.add(
        'send-reminder',
        {
          userId: userId.toString(),
          entityType,
          entityId: record._id.toString(),
          title: record.title,
          body,
          reminderMinutes,
          url,
        },
        {
          jobId,
          delay,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }
  } catch (error) {
    console.error('⏰ Failed to schedule reminders:', error);
  }
}

export async function cancelReminders(
  entityType: ReminderEntityType,
  record: { _id: Types.ObjectId; reminders?: any[] },
): Promise<void> {
  try {
    const reminders = Array.isArray(record.reminders) ? record.reminders : [];
    const minutesList: number[] = reminders.filter(
      (m) => Number.isFinite(m) && m > 0,
    );

    await Promise.all(
      minutesList.map(async (m) => {
        const jobId = reminderJobId(entityType, record._id.toString(), m);
        const job = await sendReminderQueue.getJob(jobId);
        if (job) {
          await job.remove();
        }
      }),
    );
  } catch (error) {
    console.error('⏰ Failed to cancel reminders:', error);
  }
}
