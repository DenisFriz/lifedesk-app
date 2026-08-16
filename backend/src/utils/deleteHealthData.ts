import { Types } from 'mongoose';
import { modelMap } from '@/models/index.js';
import { UserUsage } from '@/models/UserUsage.js';
import { cloudinary } from '@/lib/cloudinary.js';
import { extractCloudinaryInfo } from '@/utils/cloudinaryUrl.js';

const HEALTH_HARD_DELETE_ENTITIES = [
  'BodyMeasurement',
  'Workout',
  'WorkoutPlan',
  'ProgressPhoto',
  'MedicalDocument',
];

const CLOUDINARY_URL_FIELDS: Record<string, string> = {
  medicaldocument: 'file_url',
  progressphoto: 'image_url',
};

const HEALTH_CATEGORY_PREFIXES = ['health_body', 'health_mind'];

export async function deleteAllHealthData(userId: Types.ObjectId): Promise<void> {
  // Hard-delete dedicated health entities
  for (const entityName of HEALTH_HARD_DELETE_ENTITIES) {
    try {
      const model = modelMap[entityName.toLowerCase()];

      if (!model) {
        console.warn(
          `[deleteAllHealthData] Missing model in modelMap: ${entityName}`,
        );
        continue;
      }

      // Cleanup Cloudinary assets for entities with URL fields
      const urlField = CLOUDINARY_URL_FIELDS[entityName.toLowerCase()];
      if (urlField) {
        try {
          const records = await model
            .find({ created_by: userId })
            .select(urlField)
            .lean();

          const grouped: Record<string, string[]> = {};
          for (const rec of records) {
            const url = (rec as any)[urlField];
            if (!url) continue;
            const info = extractCloudinaryInfo(url);
            if (!info) continue;
            (grouped[info.resourceType] ??= []).push(info.publicId);
          }

          await Promise.allSettled(
            Object.entries(grouped).map(([resourceType, ids]) =>
              cloudinary.api.delete_resources(ids, {
                resource_type: resourceType as any,
              }),
            ),
          );
        } catch (err: any) {
          console.warn(
            `[deleteAllHealthData] Cloudinary cleanup failed for ${entityName}:`,
            err.message,
          );
        }
      }

      const result = await model.deleteMany({
        created_by: userId,
      });

      const deletedCount = result.deletedCount || 0;
      if (deletedCount > 0) {
        const limitKeyMap: Record<string, string> = {
          bodymeasurement: 'bodyMeasurements',
          workout: 'workouts',
          workoutplan: 'workoutPlans',
          progressphoto: 'progressPhotos',
          medicaldocument: 'medicalDocuments',
        };

        const limitKey = limitKeyMap[entityName.toLowerCase()];
        if (limitKey) {
          await UserUsage.updateOne(
            { user_id: userId },
            { $inc: { [limitKey]: -deletedCount } },
          ).catch((err: any) => {
            console.warn(
              `[deleteAllHealthData] Failed to decrement ${limitKey}:`,
              err.message,
            );
          });
        }
      }
    } catch (err: any) {
      console.warn(
        `[deleteAllHealthData] Hard delete failed for ${entityName}:`,
        err.message,
      );
    }
  }

  // Hard-delete health-tagged Task/Goal/Problem rows
  const healthEntities = ['task', 'goal', 'problem'];
  for (const entityName of healthEntities) {
    try {
      const model = modelMap[entityName];

      if (!model) {
        console.warn(
          `[deleteAllHealthData] Missing model in modelMap: ${entityName}`,
        );
        continue;
      }

      const result = await model.deleteMany({
        created_by: userId,
        category: { $in: HEALTH_CATEGORY_PREFIXES },
      });

      const deletedCount = result.deletedCount || 0;
      if (deletedCount > 0) {
        const limitKeyMap: Record<string, string> = {
          task: 'tasks',
          goal: 'goals',
          problem: 'problems',
        };

        const limitKey = limitKeyMap[entityName];
        if (limitKey) {
          await UserUsage.updateOne(
            { user_id: userId },
            { $inc: { [limitKey]: -deletedCount } },
          ).catch((err: any) => {
            console.warn(
              `[deleteAllHealthData] Failed to decrement ${limitKey}:`,
              err.message,
            );
          });
        }
      }
    } catch (err: any) {
      console.warn(
        `[deleteAllHealthData] Delete failed for health-tagged ${entityName}:`,
        err.message,
      );
    }
  }
}
