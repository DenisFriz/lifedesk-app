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

import PageNotFound from './lib/PageNotFound'

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

export interface AppRoute {
  path: string
  name: string
  element: ComponentType
}

export const appRoutes: AppRoute[] = [
  { path: '/Accounts', name: 'Accounts', element: Accounts },
  { path: '/AdminUsers', name: 'AdminUsers', element: AdminUsers },
  { path: '/Analytics', name: 'Analytics', element: Analytics },
  { path: '/Assets', name: 'Assets', element: Assets },
  { path: '/AssetsCars', name: 'AssetsCars', element: AssetsCars },
  { path: '/AssetsEstates', name: 'AssetsEstates', element: AssetsEstates },
  { path: '/AssetsGoals', name: 'AssetsGoals', element: AssetsGoals },
  { path: '/AssetsOther', name: 'AssetsOther', element: AssetsOther },
  { path: '/AssetsTasks', name: 'AssetsTasks', element: AssetsTasks },

  { path: '/BodyGoals', name: 'BodyGoals', element: BodyGoals },
  {
    path: '/BodyMeasurements',
    name: 'BodyMeasurements',
    element: BodyMeasurements
  },
  { path: '/BodyProblems', name: 'BodyProblems', element: BodyProblems },
  { path: '/BodyTasks', name: 'BodyTasks', element: BodyTasks },

  { path: '/Budget', name: 'Budget', element: Budget },
  { path: '/BusinessGoals', name: 'BusinessGoals', element: BusinessGoals },
  {
    path: '/BusinessOverview',
    name: 'BusinessOverview',
    element: BusinessOverview
  },
  { path: '/BusinessTasks', name: 'BusinessTasks', element: BusinessTasks },

  { path: '/Calendar', name: 'Calendar', element: Calendar },
  { path: '/Clients', name: 'Clients', element: Clients },
  { path: '/CommunityHub', name: 'CommunityHub', element: CommunityHub },

  { path: '/Finances', name: 'Finances', element: Finances },
  { path: '/FinancesGoals', name: 'FinancesGoals', element: FinancesGoals },
  {
    path: '/FinancesProblems',
    name: 'FinancesProblems',
    element: FinancesProblems
  },
  { path: '/FinancesTasks', name: 'FinancesTasks', element: FinancesTasks },

  { path: '/Fitness', name: 'Fitness', element: Fitness },
  { path: '/FitnessGoals', name: 'FitnessGoals', element: FitnessGoals },
  { path: '/FitnessTasks', name: 'FitnessTasks', element: FitnessTasks },

  { path: '/HealthBody', name: 'HealthBody', element: HealthBody },
  {
    path: '/HealthDocuments',
    name: 'HealthDocuments',
    element: HealthDocuments
  },
  { path: '/HealthMind', name: 'HealthMind', element: HealthMind },

  { path: '/Home', name: 'Home', element: Home },

  { path: '/Hobbies', name: 'Hobbies', element: Hobbies },
  { path: '/HobbiesGoals', name: 'HobbiesGoals', element: HobbiesGoals },
  { path: '/HobbiesTasks', name: 'HobbiesTasks', element: HobbiesTasks },

  { path: '/Learning', name: 'Learning', element: Learning },
  { path: '/LearningGoals', name: 'LearningGoals', element: LearningGoals },
  { path: '/LearningTasks', name: 'LearningTasks', element: LearningTasks },

  { path: '/MainEvents', name: 'MainEvents', element: MainEvents },
  { path: '/MainGoals', name: 'MainGoals', element: MainGoals },
  { path: '/MainTasks', name: 'MainTasks', element: MainTasks },

  {
    path: '/ManageBusinesses',
    name: 'ManageBusinesses',
    element: ManageBusinesses
  },
  { path: '/Marketing', name: 'Marketing', element: Marketing },

  { path: '/Overview', name: 'Overview', element: Overview },

  { path: '/Profile', name: 'Profile', element: Profile },
  { path: '/ProgressPhotos', name: 'ProgressPhotos', element: ProgressPhotos },
  { path: '/Projects', name: 'Projects', element: Projects },

  { path: '/Relationships', name: 'Relationships', element: Relationships },
  {
    path: '/RelationshipsGoals',
    name: 'RelationshipsGoals',
    element: RelationshipsGoals
  },
  {
    path: '/RelationshipsTasks',
    name: 'RelationshipsTasks',
    element: RelationshipsTasks
  },

  { path: '/Revenue', name: 'Revenue', element: Revenue },

  { path: '/Tasks', name: 'Tasks', element: Tasks },
  { path: '/TangibleAssets', name: 'TangibleAssets', element: TangibleAssets },
  { path: '/TimeReports', name: 'TimeReports', element: TimeReports },
  { path: '/Transactions', name: 'Transactions', element: Transactions },

  { path: '/Upgrade', name: 'Upgrade', element: Upgrade },

  { path: '/WorkoutPlans', name: 'WorkoutPlans', element: WorkoutPlans },
  { path: '/Workouts', name: 'Workouts', element: Workouts }
]

export const authRoutes: AppRoute[] = [
  { path: '/Login', name: 'Login', element: Login },
  { path: '/Register', name: 'Register', element: Register },
  { path: '/ForgotPassword', name: 'ForgotPassword', element: ForgotPassword },
  { path: '/ResetPassword', name: 'ResetPassword', element: ResetPassword },
  { path: '/PageNotFound', name: 'PageNotFound', element: PageNotFound }
]
