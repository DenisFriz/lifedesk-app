import {
  SUBSCRIPTION_LIMITS,
  SubscriptionLimits,
} from '@/config/subscriptionLimits.js';
import { modelMap } from '@/models/index.js';
import { UsageKey, UserUsage } from '@/models/UserUsage.js';
import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import { cloudinary } from '@/lib/cloudinary.js';

const router = Router();

const cloudinaryCleanup: Record<string, (record: any) => string[]> = {
  vehicle: (record) =>
    (record.images ?? []).map((img: any) => img.public_id).filter(Boolean),
  user: (record) => [record.profile_image_public_id].filter(Boolean),
  medicaldocument: (record) => [record.public_id].filter(Boolean),
};

const entityToLimitKey: Record<string, string> = {
  task: 'tasks',
  goal: 'goals',
  calendarentry: 'calendarEntries',
  event: 'events',
  vehicle: 'vehicle',
  estate: 'estate',
  otherasset: 'otherAsset',
  offlineaccount: 'offlineBankAccount',
  offlineaccountsnapshot: 'offlineAccountSnapshot',
  healthtrackingentry: 'healthTrackingEnties',
  medicaldocument: 'medicalDocuments',
  workout: 'workouts',
  workoutplan: 'workoutPlans',
  bodymeasurement: 'bodyMeasurements',
  hobby: 'hobbies',
  learning: 'learning',
  relationship: 'relationships',
  business: 'business',
  projectsandclients: 'projectsAndClients',
  marketingstrategy: 'marketingStrategy',
  marketingcampaign: 'marketingCampaign',
  marketingcontent: 'marketingContent',
  progressphoto: 'progressPhotos',
  campaign: 'campaign',
  income: 'income',
  expense: 'expense',
  problem: 'problem',
  timeentry: 'timeEntries',
  content: 'content',
  project: 'projects',
  recurringincome: 'recurringIncomes',
  recurringexpense: 'recurringExpenses',
  communityidea: 'communityIdeas',
  client: 'clients',
};

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

    sanitized[key] = value === '' ? null : value;
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

    const records = await Model.find({ created_by: req.user._id }).lean();

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
      created_by: req.user!._id,
    };

    const records = await Model.find(conditions).lean();

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

    const record = await Model.findOne({ id }).lean();

    if (!record) {
      return res.status(404).json({ error: 'Not found' });
    }

    if ((record as any).created_by !== req.user!._id) {
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

    if (modelKey === 'communityidea') {
      if (!limits.community_submit) {
        return res.status(403).json({
          error: 'Submitting ideas requires Plus or Pro.',
        });
      }

      const ideaLimit = limits.communityIdeas;
      if (typeof ideaLimit === 'number') {
        const usage = await UserUsage.findOne({ user_id: userId })
          .lean()
          .select('communityIdeas');

        if (!usage) {
          return res.status(404).json({
            error: 'Usage not found',
          });
        }

        const used = (usage as any).communityIdeas ?? 0;

        if (used >= ideaLimit) {
          return res.status(403).json({
            error: `Limit reached for ${modelKey}. Upgrade your plan.`,
          });
        }
      }

      const [record] = await Promise.all([
        Model.create({
          ...sanitizeInput(req.body),
          created_by: userId,
        }),
        UserUsage.updateOne({ user_id: userId }, { $inc: { communityIdeas: 1 } }),
      ]);

      return res.status(201).json(record);
    }

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

    const usage = await UserUsage.findOne({ user_id: userId })
      .lean()
      .select(limitKey);

    if (!usage) {
      return res.status(404).json({
        error: 'Usage not found',
      });
    }

    const used = (usage[limitKey] as number) ?? 0;

    if (used >= limit) {
      console.log('reached limit');
      return res.status(403).json({
        error: `Limit reached for ${modelKey}. Upgrade your plan.`,
      });
    }

    const [record] = await Promise.all([
      Model.create({
        ...sanitizeInput(req.body),
        created_by: userId,
      }),
      UserUsage.updateOne({ user_id: userId }, { $inc: { [limitKey]: 1 } }),
    ]);

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

    const entity = Array.isArray(entityParam) ? entityParam[0] : entityParam;
    const modelKey = entity.toLowerCase();

    const Model = modelMap[modelKey];

    if (!Model) {
      return res.status(400).json({ error: `Unknown entity: ${modelKey}` });
    }

    const body = sanitizeInput(req.body);

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ObjectId' });
    }

    const clientUpdatedAt = body.updatedAt
      ? new Date(body.updatedAt).getTime()
      : null;

    const filter: any = { _id: id };
    if (clientUpdatedAt) {
      filter.updatedAt = { $lte: new Date(clientUpdatedAt) };
    }

    const updated = await Model.findOneAndUpdate(
      filter,
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    );

    if (!updated) {
      const record = await Model.findOne({ _id: id }).lean();
      if (!record) {
        return res.status(404).json({ error: 'Not found or forbidden' });
      }
      return res.status(409).json({
        error: 'Conflict: stale update',
        server: record,
      });
    }

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

    const record = await Model.findOne({
      _id: id,
      created_by: userId,
    }).lean();

    if (!record) {
      return res.status(404).json({
        error: 'Not found or forbidden',
      });
    }

    const publicIds = cloudinaryCleanup[modelKey]?.(record) ?? [];
    if (publicIds.length > 0) {
      try {
        await cloudinary.api.delete_resources(publicIds);
      } catch (cloudinaryErr: any) {
        console.error(
          `Failed to delete Cloudinary resources for ${modelKey}:`,
          cloudinaryErr.message,
        );
      }
    }

    await Model.deleteOne({ _id: id });

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
      created_by: req.user!._id,
    }));

    const created = await Model.insertMany(records);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
