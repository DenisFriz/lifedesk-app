export type SubscriptionTier = 'free' | 'plus' | 'pro';

export type SubscriptionLimits = {
  goals?: number;
  tasks?: number;
  calendarEntries?: number;
  events?: number;
  assets?: number;
  bankAccounts?: number;
  workouts?: number;
  projects?: number;
  unlimited?: boolean;
};

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> =
  {
    free: {
      goals: 10,
      tasks: 20,
      calendarEntries: 10,
      events: 10,
      assets: 1,
      bankAccounts: 1,
      workouts: 3,
      projects: 5,
    },
    plus: {
      goals: 100,
      tasks: 200,
      calendarEntries: 100,
      events: 100,
      assets: 10,
    },
    pro: {
      unlimited: true,
    },
  };
