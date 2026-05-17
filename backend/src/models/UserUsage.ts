import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export type UsageKey =
  | 'goals'
  | 'tasks'
  | 'calendarEntries'
  | 'events'
  | 'assets'
  | 'bankAccounts'
  | 'workouts'
  | 'projects';

export interface IUserUsage {
  user_id: Types.ObjectId;

  goals: number;
  tasks: number;
  calendarEntries: number;
  events: number;

  assets: number;
  bankAccounts: number;
  workouts: number;
  projects: number;

  updated_at: string;
  created_at: string;
}

export type IUserUsageDocument = HydratedDocument<IUserUsage>;

const UserUsageSchema = new Schema<IUserUsageDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    goals: { type: Number, default: 0 },
    tasks: { type: Number, default: 0 },
    calendarEntries: { type: Number, default: 0 },
    events: { type: Number, default: 0 },

    assets: { type: Number, default: 0 },
    bankAccounts: { type: Number, default: 0 },
    workouts: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const UserUsage: Model<IUserUsageDocument> = mongoose.model(
  'UserUsage',
  UserUsageSchema,
);
