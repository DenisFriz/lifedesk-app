import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IWorkout } from '@/types/index.js';

const workoutSchema = new Schema<IWorkout>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    type: String,
    title: String,
    duration_minutes: Number,
    notes: String,
    date: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

workoutSchema.pre<IWorkout>('save', function (this: IWorkout) {
  this.updated_at = new Date().toISOString();
});

export const Workout: Model<IWorkout> = mongoose.model<IWorkout>(
  'Workout',
  workoutSchema,
);
