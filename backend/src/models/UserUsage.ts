import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export type UsageKey =
  | 'goals'
  | 'tasks'
  | 'calendarEntries'
  | 'events'
  | 'vehicle'
  | 'estate'
  | 'otherAsset'
  | 'offlineBankAccount'
  | 'healthTrackingEnties'
  | 'medicalDocuments'
  | 'workouts'
  | 'workoutPlans'
  | 'measurements'
  | 'hobbies'
  | 'learning'
  | 'relationships'
  | 'business'
  | 'projectsAndClients'
  | 'marketingStrategy'
  | 'campaign'
  | 'content';

export interface IUserUsage {
  user_id: Types.ObjectId;
  goals: number;
  tasks: number;
  calendarEntries: number;
  events: number;
  vehicle: number;
  estate: number;
  otherAsset: number;
  offlineBankAccount: number;
  healthTrackingEnties: number;
  medicalDocuments: number;
  workouts: number;
  workoutPlans: number;
  measurements: number;
  hobbies: number;
  learning: number;
  relationships: number;
  business: number;
  projectsAndClients: number;
  marketingStrategy: number;
  campaign: number;
  content: number;
  updated_at: string;
  created_at: string;
}

type IUserUsageDocument = HydratedDocument<IUserUsage>;

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

    vehicle: { type: Number, default: 0 },
    estate: { type: Number, default: 0 },
    otherAsset: { type: Number, default: 0 },
    offlineBankAccount: { type: Number, default: 0 },

    healthTrackingEnties: { type: Number, default: 0 },
    medicalDocuments: { type: Number, default: 0 },

    workouts: { type: Number, default: 0 },
    workoutPlans: { type: Number, default: 0 },
    measurements: { type: Number, default: 0 },

    hobbies: { type: Number, default: 0 },
    learning: { type: Number, default: 0 },
    relationships: { type: Number, default: 0 },

    business: { type: Number, default: 0 },
    projectsAndClients: { type: Number, default: 0 },

    marketingStrategy: { type: Number, default: 0 },
    campaign: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
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
