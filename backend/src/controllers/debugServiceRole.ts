import type { Request, Response } from 'express';
import { Event, Task, Goal } from '@/models/index.js';

export async function debugServiceRole(req: Request, res: Response) {
  try {
    const [events, tasks, goals, eventCount, taskCount, goalCount] =
      await Promise.all([
        Event.find({}).limit(3).lean(),
        Task.find({}).limit(3).lean(),
        Goal.find({}).limit(3).lean(),
        Event.countDocuments(),
        Task.countDocuments(),
        Goal.countDocuments(),
      ]);

    res.json({
      events,
      events_count: eventCount,
      tasks,
      tasks_count: taskCount,
      goals,
      goals_count: goalCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
