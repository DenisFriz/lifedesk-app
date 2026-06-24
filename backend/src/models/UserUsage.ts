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
  | 'problems'
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
  | 'budgetEntries'
  | 'progressPhotos'
  | 'campaign'
  | 'timeEntries'
  | 'content'
  | 'communityIdeas'
  | 'notes_words_limit';

export interface IUserUsage {
  user_id: Types.ObjectId;
  goals: number;
  tasks: number;
  calendarEntries: number;
  events: number;
  vehicle: number;
  vehicle_photos: number;
  estate: number;
  problems: number;
  otherAsset: number;
  offlineBankAccount: number;
  offlineAccountSnapshot: number;
  medicalDocuments: number;
  workouts: number;
  workoutPlans: number;
  bodyMeasurements: number;
  hobbies: number;
  learning: number;
  relationships: number;
  business: number;
  income: number;
  expense: number;
  projectsAndClients: number;
  marketingStrategy: number;
  marketingCampaign: number;
  marketingContent: number;
  budgetEntries: number;
  progressPhotos: number;
  campaign: number;
  content: number;
  timeEntries: number;
  projects: number;
  clients: number;
  communityIdeas: number;
  community_comment: boolean;
  community_like: boolean;
  notes_words_limit: number;
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

    problems: { type: Number, default: 0 },
    medicalDocuments: { type: Number, default: 0 },

    workouts: { type: Number, default: 0 },
    workoutPlans: { type: Number, default: 0 },
    bodyMeasurements: { type: Number, default: 0 },

    hobbies: { type: Number, default: 0 },
    learning: { type: Number, default: 0 },
    relationships: { type: Number, default: 0 },
    income: { type: Number, default: 0 },
    expense: { type: Number, default: 0 },

    business: { type: Number, default: 0 },
    projectsAndClients: { type: Number, default: 0 },
    budgetEntries: { type: Number, default: 0 },
    progressPhotos: { type: Number, default: 0 },

    marketingStrategy: { type: Number, default: 0 },
    marketingCampaign: { type: Number, default: 0 },
    marketingContent: { type: Number, default: 0 },
    campaign: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    timeEntries: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    clients: { type: Number, default: 0 },
    communityIdeas: { type: Number, default: 0 },
    notes_words_limit: { type: Number, default: 0 },
    community_comment: { type: Boolean, default: false },
    community_like: { type: Boolean, default: false },
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
