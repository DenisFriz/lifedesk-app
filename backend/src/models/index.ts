export { User } from './User.js';
export { Task } from './Task.js';
export { Goal } from './Goal.js';
export { Problem } from './Problem.js';
export { Event } from './Event.js';
export { Business } from './Business.js';
export { Project } from './Project.js';
export { Contact } from './Contact.js';
export { Client } from './Client.js';
export { Hobby } from './Hobby.js';
export { LearningItem } from './LearningItem.js';
export { Note } from './Note.js';
export { Income } from './Income.js';
export { Expense } from './Expense.js';
export { RecurringIncome } from './RecurringIncome.js';
export { RecurringExpense } from './RecurringExpense.js';
export { BodyMeasurement } from './BodyMeasurement.js';
export { Workout } from './Workout.js';
export { ProgressPhoto } from './ProgressPhoto.js';
export { MedicalDocument } from './MedicalDocument.js';
export { TangibleAsset } from './TangibleAsset.js';
export { WorkoutPlan } from './WorkoutPlan.js';
export { OfflineAccount } from './OfflineAccount.js';
export { MarketingStrategy } from './MarketingStrategy.js';
export { MarketingCampaign } from './MarketingCampaign.js';
export { Idea } from './Idea.js';
export { ContentIdea } from './ContentIdea.js';
export { CommunityComment } from './CommunityComment.js';
export { BankBalanceSnapshot } from './BankBalanceSnapshot.js';
export { TimeEntry } from './TimeEntry.js';
export { Subscription } from './Subscription.js';

import mongoose from 'mongoose';
import { User } from './User.js';
import { Task } from './Task.js';
import { Goal } from './Goal.js';
import { Problem } from './Problem.js';
import { Event } from './Event.js';
import { Business } from './Business.js';
import { Project } from './Project.js';
import { Contact } from './Contact.js';

import { Hobby } from './Hobby.js';
import { LearningItem } from './LearningItem.js';
import { Note } from './Note.js';
import { Income } from './Income.js';
import { Expense } from './Expense.js';
import { RecurringIncome } from './RecurringIncome.js';
import { RecurringExpense } from './RecurringExpense.js';
import { BodyMeasurement } from './BodyMeasurement.js';
import { Workout } from './Workout.js';
import { ProgressPhoto } from './ProgressPhoto.js';
import { MedicalDocument } from './MedicalDocument.js';
import { TangibleAsset } from './TangibleAsset.js';
import { WorkoutPlan } from './WorkoutPlan.js';
import { OfflineAccount } from './OfflineAccount.js';
import { MarketingStrategy } from './MarketingStrategy.js';
import { MarketingCampaign } from './MarketingCampaign.js';
import { Idea } from './Idea.js';
import { ContentIdea } from './ContentIdea.js';
import { CommunityComment } from './CommunityComment.js';
import { BankBalanceSnapshot } from './BankBalanceSnapshot.js';
import { TimeEntry } from './TimeEntry.js';
import { Subscription } from './Subscription.js';
import { Client } from './Client.js';
import { UserPlan } from './UserPlan.js';
import { CommunityIdea } from './CommunityIdea.js';

export const modelMap: Record<string, mongoose.Model<any>> = {
  user: User,
  task: Task,
  goal: Goal,
  problem: Problem,
  event: Event,
  business: Business,
  project: Project,
  contact: Contact,
  client: Client,
  hobby: Hobby,
  learningitem: LearningItem,
  note: Note,
  income: Income,
  expense: Expense,
  recurringincome: RecurringIncome,
  recurringexpense: RecurringExpense,
  bodymeasurement: BodyMeasurement,
  workout: Workout,
  progressphoto: ProgressPhoto,
  medicaldocument: MedicalDocument,
  tangibleasset: TangibleAsset,
  workoutplan: WorkoutPlan,
  offlineaccount: OfflineAccount,
  marketingstrategy: MarketingStrategy,
  marketingcampaign: MarketingCampaign,
  idea: Idea,
  contentidea: ContentIdea,
  communitycomment: CommunityComment,
  bankbalancesnapshot: BankBalanceSnapshot,
  subscription: Subscription,
  timeentry: TimeEntry,
  userplan: UserPlan,
  communityidea: CommunityIdea,
};
