import { ComponentType } from 'react'

import Accounts from './pages/Accounts'
import AdminUsers from './pages/AdminUsers'
import Analytics from './pages/Analytics'

import Assets from './pages/Assets'
import AssetsCars from './pages/AssetsCars'
import AssetsEstates from './pages/AssetsEstates'
import AssetsGoals from './pages/AssetsGoals'
import AssetsOther from './pages/AssetsOther'
import AssetsTasks from './pages/AssetsTasks'

import BodyGoals from './pages/BodyGoals'
import BodyMeasurements from './pages/BodyMeasurements'
import BodyProblems from './pages/BodyProblems'
import BodyTasks from './pages/BodyTasks'

import Budget from './pages/Budget'
import BusinessGoals from './pages/BusinessGoals'
import BusinessOverview from './pages/BusinessOverview'
import BusinessTasks from './pages/BusinessTasks'

import Calendar from './pages/Calendar'
import Clients from './pages/Clients'
import CommunityHub from './pages/CommunityHub'

import Finances from './pages/Finances'
import FinancesGoals from './pages/FinancesGoals'
import FinancesProblems from './pages/FinancesProblems'
import FinancesTasks from './pages/FinancesTasks'

import Fitness from './pages/Fitness'
import FitnessGoals from './pages/FitnessGoals'
import FitnessTasks from './pages/FitnessTasks'

import HealthBody from './pages/HealthBody'
import HealthDocuments from './pages/HealthDocuments'
import HealthMind from './pages/HealthMind'

import Home from './pages/Home'

import Hobbies from './pages/Hobbies'
import HobbiesGoals from './pages/HobbiesGoals'
import HobbiesTasks from './pages/HobbiesTasks'

import Learning from './pages/Learning'
import LearningGoals from './pages/LearningGoals'
import LearningTasks from './pages/LearningTasks'

import Login from './pages/Login'

import MainEvents from './pages/MainEvents'
import MainGoals from './pages/MainGoals'
import MainTasks from './pages/MainTasks'

import ManageBusinesses from './pages/ManageBusinesses'
import Marketing from './pages/Marketing'

import Overview from './pages/Overview'

import PageNotFound from './pages/PageNotFound'

import Profile from './pages/Profile'
import ProgressPhotos from './pages/ProgressPhotos'
import Projects from './pages/Projects'

import Register from './pages/Register'
import Relationships from './pages/Relationships'
import RelationshipsGoals from './pages/RelationshipsGoals'
import RelationshipsTasks from './pages/RelationshipsTasks'

import Revenue from './pages/Revenue'

import Tasks from './pages/Tasks'
import TangibleAssets from './pages/TangibleAssets'
import TimeReports from './pages/TimeReports'
import Transactions from './pages/Transactions'

import Upgrade from './pages/Upgrade'

import WorkoutPlans from './pages/WorkoutPlans'
import Workouts from './pages/Workouts'

import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'

interface AppRoute {
  path: string
  name: string
  element: ComponentType
}

export const appRoutes: AppRoute[] = [
  { path: '/accounts', name: 'Accounts', element: Accounts },
  { path: '/admin-users', name: 'AdminUsers', element: AdminUsers },
  { path: '/analytics', name: 'Analytics', element: Analytics },
  { path: '/assets', name: 'Assets', element: Assets },
  { path: '/assets-cars', name: 'AssetsCars', element: AssetsCars },
  { path: '/assets-estates', name: 'AssetsEstates', element: AssetsEstates },
  { path: '/assets-goals', name: 'AssetsGoals', element: AssetsGoals },
  { path: '/assets-other', name: 'AssetsOther', element: AssetsOther },
  { path: '/assets-tasks', name: 'AssetsTasks', element: AssetsTasks },

  { path: '/body-goals', name: 'BodyGoals', element: BodyGoals },
  {
    path: '/body-measurements',
    name: 'BodyMeasurements',
    element: BodyMeasurements
  },
  { path: '/body-problems', name: 'BodyProblems', element: BodyProblems },
  { path: '/body-tasks', name: 'BodyTasks', element: BodyTasks },

  { path: '/budget', name: 'Budget', element: Budget },
  { path: '/business-budget', name: 'BusinessBudget', element: Budget },
  { path: '/business-goals', name: 'BusinessGoals', element: BusinessGoals },
  {
    path: '/business-overview',
    name: 'BusinessOverview',
    element: BusinessOverview
  },
  { path: '/business-tasks', name: 'BusinessTasks', element: BusinessTasks },

  { path: '/calendar', name: 'Calendar', element: Calendar },
  { path: '/clients', name: 'Clients', element: Clients },
  { path: '/community-hub', name: 'CommunityHub', element: CommunityHub },

  { path: '/finances', name: 'Finances', element: Finances },
  { path: '/finances-goals', name: 'FinancesGoals', element: FinancesGoals },
  {
    path: '/finances-problems',
    name: 'FinancesProblems',
    element: FinancesProblems
  },
  { path: '/finances-tasks', name: 'FinancesTasks', element: FinancesTasks },

  { path: '/fitness', name: 'Fitness', element: Fitness },
  { path: '/fitness-goals', name: 'FitnessGoals', element: FitnessGoals },
  { path: '/fitness-tasks', name: 'FitnessTasks', element: FitnessTasks },

  { path: '/health-body', name: 'HealthBody', element: HealthBody },
  {
    path: '/health-documents',
    name: 'HealthDocuments',
    element: HealthDocuments
  },
  { path: '/health-mind', name: 'HealthMind', element: HealthMind },

  { path: '/home', name: 'Home', element: Home },

  { path: '/hobbies', name: 'Hobbies', element: Hobbies },
  { path: '/hobbies-goals', name: 'HobbiesGoals', element: HobbiesGoals },
  { path: '/hobbies-tasks', name: 'HobbiesTasks', element: HobbiesTasks },

  { path: '/learning', name: 'Learning', element: Learning },
  { path: '/learning-goals', name: 'LearningGoals', element: LearningGoals },
  { path: '/learning-tasks', name: 'LearningTasks', element: LearningTasks },

  { path: '/main-events', name: 'MainEvents', element: MainEvents },
  { path: '/main-goals', name: 'MainGoals', element: MainGoals },
  { path: '/main-tasks', name: 'MainTasks', element: MainTasks },

  {
    path: '/manage-businesses',
    name: 'ManageBusinesses',
    element: ManageBusinesses
  },
  { path: '/marketing', name: 'Marketing', element: Marketing },

  { path: '/overview', name: 'Overview', element: Overview },

  { path: '/profile', name: 'Profile', element: Profile },
  { path: '/progress-photos', name: 'ProgressPhotos', element: ProgressPhotos },
  { path: '/projects', name: 'Projects', element: Projects },

  { path: '/relationships', name: 'Relationships', element: Relationships },
  {
    path: '/relationships-goals',
    name: 'RelationshipsGoals',
    element: RelationshipsGoals
  },
  {
    path: '/relationships-tasks',
    name: 'RelationshipsTasks',
    element: RelationshipsTasks
  },

  { path: '/revenue', name: 'Revenue', element: Revenue },

  { path: '/tasks', name: 'Tasks', element: Tasks },
  { path: '/tangible-assets', name: 'TangibleAssets', element: TangibleAssets },
  { path: '/time-reports', name: 'TimeReports', element: TimeReports },
  { path: '/transactions', name: 'Transactions', element: Transactions },
  { path: '/business-transactions', name: 'BusinessTransactions', element: Transactions },

  { path: '/upgrade', name: 'Upgrade', element: Upgrade },

  { path: '/workout-plans', name: 'WorkoutPlans', element: WorkoutPlans },
  { path: '/workouts', name: 'Workouts', element: Workouts }
]

export const authRoutes: AppRoute[] = [
  { path: '/login', name: 'Login', element: Login },
  { path: '/register', name: 'Register', element: Register },
  { path: '/forgot-password', name: 'ForgotPassword', element: ForgotPassword },
  { path: '/reset-password', name: 'ResetPassword', element: ResetPassword },
  { path: '/page-not-found', name: 'PageNotFound', element: PageNotFound }
]
