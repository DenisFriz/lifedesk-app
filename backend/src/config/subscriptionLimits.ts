export type SubscriptionTier = 'free' | 'plus' | 'pro';

export type SubscriptionLimits = {
  goals?: number;
  tasks?: number;
  calendarEntries?: number;
  events?: number;
  vehicle?: number;
  estate?: number;
  otherAsset?: number;
  offlineBankAccount?: number;
  healthTrackingEnties?: number;
  medicalDocuments?: number;
  workouts?: number;
  workoutPlans?: number;
  measurements?: number;
  hobbies?: number;
  learning?: number;
  relationships?: number;
  business?: number;
  bodyMeasurements?: number;
  progressPhotos?: number;
  projectsAndClients?: number;
  marketingStrategy?: number;
  campaign?: number;
  content?: number;
  unlimited?: boolean;
};

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> =
  {
    free: {
      goals: 10,
      tasks: 20,
      calendarEntries: 10,
      events: 10,
      vehicle: 1,
      estate: 1,
      otherAsset: 1,
      offlineBankAccount: 1,
      healthTrackingEnties: 10,
      medicalDocuments: 5,
      workouts: 3,
      workoutPlans: 3,
      measurements: 3,
      hobbies: 3,
      learning: 3,
      relationships: 3,
      business: 1,
      bodyMeasurements: 3,
      progressPhotos: 5,
      projectsAndClients: 5,
      marketingStrategy: 1,
      campaign: 1,
      content: 1,
    },
    plus: {
      goals: 100,
      tasks: 200,
      calendarEntries: 400,
      events: 100,
      vehicle: 1,
      estate: 1,
      otherAsset: 1,
      offlineBankAccount: 5,
      healthTrackingEnties: 10,
      medicalDocuments: 5,
      workouts: 3,
      workoutPlans: 3,
      measurements: 3,
      hobbies: 3,
      learning: 3,
      relationships: 3,
      business: 1,
      bodyMeasurements: 5,
      progressPhotos: 10,
      projectsAndClients: 5,
      marketingStrategy: 1,
      campaign: 1,
      content: 1,
    },
    pro: {
      unlimited: true,
    },
  };
