import { SUBSCRIPTION_LIMITS } from '@/config/subscriptionLimits.js';
import { modelMap } from '@/models/index.js';
import { UsageKey, UserUsage } from '@/models/UserUsage.js';
import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';

const router = Router();

function sanitizeInput(data: any): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Block MongoDB operators and system fields
    if (
      key.startsWith('$') ||
      key.startsWith('_') ||
      ['id', 'created_by', 'created_at', 'updated_at'].includes(key)
    ) {
      continue;
    }

    // Only allow alphanumeric and underscore keys
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

router.use((req: Request, res: Response, next) => {
  let entity = req.params.entity;

  if (Array.isArray(entity)) {
    entity = entity[0];
  }

  if (!entity) return next();

  const modelKey = entity.toLowerCase();

  if (!modelMap[modelKey]) {
    return res.status(404).json({
      error: `Unknown entity: ${modelKey}`,
    });
  }

  next();
});

router.get('/:entity', async (req: Request, res: Response) => {
  try {
    let { entity } = req.params;

    if (Array.isArray(entity)) {
      entity = entity[0];
    }

    entity = entity.toLowerCase();

    const Model = modelMap[entity];

    if (!Model) {
      return res.status(400).json({ error: `Unknown entity: ${entity}` });
    }

    const records = await Model.find({ created_by: req.user._id });

    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:entity/filter', async (req: Request, res: Response) => {
  try {
    let { entity } = req.params;

    if (Array.isArray(entity)) {
      entity = entity[0];
    }

    const modelKey = entity.toLowerCase();

    const Model = modelMap[modelKey];
    if (!Model) {
      return res.status(400).json({ error: `Unknown entity: ${modelKey}` });
    }

    const conditions = {
      ...sanitizeInput(req.body),
      created_by: req.user!.id,
    };

    const records = await Model.find(conditions);

    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:entity/:id', async (req: Request, res: Response) => {
  try {
    const entityParam = req.params.entity;
    const id = req.params.id;

    const entity = Array.isArray(entityParam) ? entityParam[0] : entityParam;

    const modelKey = entity.toLowerCase();

    const Model = modelMap[modelKey];

    if (!Model) {
      return res.status(400).json({ error: `Unknown entity: ${modelKey}` });
    }

    const record = await Model.findOne({ id });

    if (!record) {
      return res.status(404).json({ error: 'Not found' });
    }

    if ((record as any).created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:entity', async (req: Request, res: Response) => {
  try {
    const entityParam = req.params.entity;
    const entity = Array.isArray(entityParam) ? entityParam[0] : entityParam;

    const modelKey = entity.toLowerCase();
    const Model = modelMap[modelKey];

    if (!Model) {
      return res.status(400).json({
        error: `Unknown entity: ${modelKey}`,
      });
    }

    const user = req.user;
    const userId = user._id;

    const tier = user.subscription_tier;
    const limits = SUBSCRIPTION_LIMITS[tier];

    // unlimited plan
    if (limits.unlimited) {
      const record = await Model.create({
        ...sanitizeInput(req.body),
        created_by: userId,
      });

      return res.status(201).json(record);
    }

    const entityToLimitKey: Record<string, keyof typeof limits> = {
      task: 'tasks',
      goal: 'goals',
      event: 'events',
      project: 'projects',
      asset: 'assets',
      bankaccount: 'bankAccounts',
      workout: 'workouts',
      calendarentry: 'calendarEntries',
    };

    const limitKey = entityToLimitKey[modelKey] as UsageKey;

    if (!limitKey) {
      return res.status(400).json({
        error: `Unknown limit key for ${modelKey}`,
      });
    }

    const limit = limits[limitKey];

    // no limit
    if (typeof limit !== 'number') {
      const record = await Model.create({
        ...sanitizeInput(req.body),
        created_by: userId,
      });

      return res.status(201).json(record);
    }

    const usage = await UserUsage.findOne({ user_id: userId });

    if (!usage) {
      return res.status(404).json({
        error: 'Usage not found',
      });
    }

    const used = usage[limitKey] ?? 0;

    if (used >= limit) {
      console.log('reached limit');
      return res.status(403).json({
        error: `Limit reached for ${modelKey}. Upgrade your plan.`,
      });
    }

    const record = await Model.create({
      ...sanitizeInput(req.body),
      created_by: userId,
    });

    await UserUsage.updateOne({ user_id: userId }, { $inc: { [limitKey]: 1 } });

    return res.status(201).json(record);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:entity/:id', async (req: Request, res: Response) => {
  try {
    const entityParam = req.params.entity;
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid ObjectId',
      });
    }

    const entity = Array.isArray(entityParam) ? entityParam[0] : entityParam;

    const modelKey = entity.toLowerCase();

    const Model = modelMap[modelKey];

    if (!Model) {
      return res.status(400).json({
        error: `Unknown entity: ${modelKey}`,
      });
    }

    const record = await Model.findOne({ _id: id });

    if (!record) {
      return res.status(404).json({
        error: 'Not found or forbidden',
      });
    }

    const updated = await Model.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...sanitizeInput(req.body),
        },
      },
      { new: true },
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:entity/:id', async (req: Request, res: Response) => {
  try {
    const entityParam = req.params.entity;
    const idParam = req.params.id;
    const userId = req.user._id;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid user id (not ObjectId)',
      });
    }

    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    const entity = Array.isArray(entityParam) ? entityParam[0] : entityParam;
    const modelKey = entity.toLowerCase();

    const Model = modelMap[modelKey];

    if (!Model) {
      return res.status(400).json({
        error: `Unknown entity: ${modelKey}`,
      });
    }

    const record = await Model.findOneAndDelete({
      _id: id,
      created_by: userId,
    });

    if (!record) {
      return res.status(404).json({
        error: 'Not found or forbidden',
      });
    }

    const entityToLimitKey: Record<string, string> = {
      task: 'tasks',
      goal: 'goals',
      event: 'events',
      project: 'projects',
      asset: 'assets',
      bankaccount: 'bankAccounts',
      workout: 'workouts',
      calendarentry: 'calendarEntries',
    };

    const limitKey = entityToLimitKey[modelKey];

    if (limitKey) {
      await UserUsage.updateOne(
        { user_id: userId },
        {
          $inc: {
            [limitKey]: -1,
          },
        },
      );
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:entity/bulk', async (req: Request, res: Response) => {
  try {
    const entityParam = req.params.entity;

    const entity = Array.isArray(entityParam) ? entityParam[0] : entityParam;

    const modelKey = entity.toLowerCase();

    const Model = modelMap[modelKey];

    if (!Model) {
      return res.status(400).json({
        error: `Unknown entity: ${modelKey}`,
      });
    }

    const records = (req.body.records || []).map((r: any) => ({
      ...sanitizeInput(r),
      created_by: req.user!.id,
    }));

    const created = await Model.insertMany(records);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
