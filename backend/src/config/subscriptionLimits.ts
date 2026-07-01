export type SubscriptionTier = 'free' | 'plus' | 'pro';

export const HARD_CAPPED_KEYS: (keyof SubscriptionLimits)[] = [
  'vehicle',
  'offlineBankAccount',
  'estate',
  'otherAsset',
  'timeEntries',
  'medicalDocuments',
  'problems',
  'income',
  'expense',
  'business',
  'projects',
  'clients',
  'marketingStrategy',
  'marketingCampaign',
  'marketingContent',
];

export type SubscriptionLimits = {
  goals: number;
  tasks: number;
  calendarEntries: number;
  events: number;
  vehicle?: number;
  vehicle_photos?: number;
  vehicle_repairs?: number;
  problems?: number;
  estate?: number;
  otherAsset?: number;
  offlineBankAccount: number;
  offlineAccountSnapshot?: number;
  medicalDocuments?: number;
  workouts: number;
  workoutPlans: number;
  bodyMeasurements: number;
  hobbies: number;
  learning: number;
  relationships: number;
  business: number;
  progressPhotos: number;
  projectsAndClients?: number;
  marketingStrategy: number;
  marketingCampaign: number;
  marketingContent: number;
  budgetEntries: number;
  campaign?: number;
  content?: number;
  income: number;
  expense: number;
  timeEntries: number;
  projects: number;
  clients: number;
  ai_assistant: boolean;
  community_read: boolean;
  community_submit: boolean;
  community_like: boolean;
  community_comment: boolean;
  communityIdeas?: number;
  notes_words_limit: number;
  push_notifications: boolean;
};

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> =
  {
    free: {
      goals: 10,
      tasks: 20,
      calendarEntries: 40,
      events: 10,
      vehicle: 1,
      vehicle_photos: 5,
      vehicle_repairs: 1,
      estate: 1,
      otherAsset: 1,
      offlineBankAccount: 1,
      offlineAccountSnapshot: 5,
      problems: 10,
      medicalDocuments: 5,
      workouts: 3,
      workoutPlans: 3,
      bodyMeasurements: 3,
      hobbies: 3,
      learning: 3,
      relationships: 3,
      business: 1,
      progressPhotos: 3,
      projectsAndClients: 5,
      marketingStrategy: 1,
      marketingCampaign: 1,
      marketingContent: 1,
      budgetEntries: 20,
      campaign: 1,
      income: 20,
      expense: 20,
      timeEntries: 5,
      projects: 5,
      clients: 5,
      content: 1,
      community_read: true,
      community_submit: false,
      community_like: false,
      community_comment: false,
      communityIdeas: 5,
      notes_words_limit: 1000,
      ai_assistant: false,
      push_notifications: false,
    },
    plus: {
      goals: 100,
      tasks: 200,
      calendarEntries: 400,
      events: 100,
      vehicle: 4,
      vehicle_photos: 5,
      vehicle_repairs: 3,
      estate: 4,
      otherAsset: 4,
      offlineBankAccount: 5,
      offlineAccountSnapshot: 10,
      problems: 50,
      medicalDocuments: 50,
      workouts: 10,
      workoutPlans: 10,
      bodyMeasurements: 10,
      hobbies: 10,
      learning: 10,
      relationships: 10,
      business: 3,
      progressPhotos: 10,
      projectsAndClients: 5,
      marketingStrategy: 5,
      marketingCampaign: 5,
      marketingContent: 5,
      budgetEntries: 200,
      campaign: 1,
      income: 200,
      expense: 200,
      timeEntries: 50,
      projects: 50,
      clients: 50,
      ai_assistant: false,
      content: 1,
      community_read: true,
      community_submit: true,
      community_like: true,
      community_comment: true,
      communityIdeas: 10,
      notes_words_limit: 25000,
      push_notifications: true,
    },
    pro: {
      goals: 1000,
      tasks: 2000,
      calendarEntries: 4000,
      events: 1000,
      hobbies: 100,
      learning: 100,
      relationships: 100,
      business: 30,
      timeEntries: 500,
      offlineBankAccount: 50,
      vehicle: 40,
      vehicle_photos: 5,
      vehicle_repairs: 5,
      estate: 40,
      otherAsset: 40,
      problems: 500,
      income: 2000,
      expense: 2000,
      medicalDocuments: 500,
      workouts: 100,
      workoutPlans: 100,
      bodyMeasurements: 100,
      budgetEntries: 2000,
      progressPhotos: 100,
      projects: 500,
      clients: 500,
      marketingStrategy: 50,
      marketingCampaign: 50,
      marketingContent: 50,
      ai_assistant: true,
      community_read: true,
      community_submit: true,
      community_like: true,
      community_comment: true,
      notes_words_limit: 100000,
      push_notifications: true,
    },
  };
