import type { Request, Response } from 'express';
import { Event, Task, Goal } from '@/models/index.js';

export async function debugServiceRole(req: Request, res: Response) {
  try {
    const [events, tasks, goals] = await Promise.all([
      Event.find({}).lean(),
      Task.find({}).lean(),
      Goal.find({}).lean(),
    ]);

    res.json({
      events: events.slice(0, 3),
      events_count: events.length,
      tasks: tasks.slice(0, 3),
      tasks_count: tasks.length,
      goals: goals.slice(0, 3),
      goals_count: goals.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
