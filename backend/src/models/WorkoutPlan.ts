import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IWorkoutPlan } from '@/types/index.js';

const workoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    name: { type: String, required: true },
    type: String,
    description: String,
    exercises: [Schema.Types.Mixed],
    scheduled_days: [String],
    active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

workoutPlanSchema.pre<IWorkoutPlan>('save', function (this: IWorkoutPlan) {
  this.updated_at = new Date().toISOString();
});

export const WorkoutPlan: Model<IWorkoutPlan> = mongoose.model<IWorkoutPlan>(
  'WorkoutPlan',
  workoutPlanSchema,
);
