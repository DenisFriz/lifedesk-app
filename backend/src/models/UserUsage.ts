import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export type UsageKey =
  | 'goals'
  | 'tasks'
  | 'calendarEntries'
  | 'events'
  | 'vehicle'
  | 'vehicle_photos'
  | 'estate'
  | 'otherAsset'
  | 'offlineBankAccount'
  | 'healthTrackingEnties'
  | 'medicalDocuments'
  | 'workouts'
  | 'workoutPlans'
  | 'bodyMeasurements'
  | 'hobbies'
  | 'learning'
  | 'relationships'
  | 'business'
  | 'projectsAndClients'
  | 'marketingStrategy'
  | 'campaign'
  | 'timeEntries'
  | 'content'
  | 'communityIdeas'
  | 'ai_assistant';

export interface IUserUsage {
  user_id: Types.ObjectId;
  goals: number;
  tasks: number;
  calendarEntries: number;
  events: number;
  vehicle: number;
  vehicle_photos: number;
  estate: number;
  otherAsset: number;
  offlineBankAccount: number;
  offlineAccountSnapshot: number;
  healthTrackingEnties: number;
  medicalDocuments: number;
  workouts: number;
  workoutPlans: number;
  bodyMeasurements: number;
  hobbies: number;
  learning: number;
  relationships: number;
  business: number;
  projectsAndClients: number;
  marketingStrategy: number;
  marketingCampaign: number;
  marketingContent: number;
  campaign: number;
  content: number;
  timeEntries: number;
  projects: number;
  clients: number;
  communityIdeas: number;
  community_comment: boolean;
  ai_assistant: boolean;
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
    vehicle_photos: { type: Number, default: 0 },
    estate: { type: Number, default: 0 },
    otherAsset: { type: Number, default: 0 },
    offlineBankAccount: { type: Number, default: 0 },
    offlineAccountSnapshot: { type: Number, default: 0 },

    healthTrackingEnties: { type: Number, default: 0 },
    medicalDocuments: { type: Number, default: 0 },

    workouts: { type: Number, default: 0 },
    workoutPlans: { type: Number, default: 0 },
    bodyMeasurements: { type: Number, default: 0 },

    hobbies: { type: Number, default: 0 },
    learning: { type: Number, default: 0 },
    relationships: { type: Number, default: 0 },

    business: { type: Number, default: 0 },
    projectsAndClients: { type: Number, default: 0 },

    marketingStrategy: { type: Number, default: 0 },
    marketingCampaign: { type: Number, default: 0 },
    marketingContent: { type: Number, default: 0 },
    campaign: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    timeEntries: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    clients: { type: Number, default: 0 },
    communityIdeas: { type: Number, default: 0 },
    community_comment: { type: Boolean, default: false },
    ai_assistant: { type: Boolean, default: false },
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
