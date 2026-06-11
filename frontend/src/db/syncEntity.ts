import {
  normalizeBusiness,
  normalizeClient,
  normalizeEstate,
  normalizeEvent,
  normalizeExpense,
  normalizeGoal,
  normalizeHobby,
  normalizeIncome,
  normalizeLearning,
  normalizeMarketingCampaign,
  normalizeMarketingContent,
  normalizeMarketingStrategy,
  normalizeMedicalDocument,
  normalizeNote,
  normalizeOtherAsset,
  normalizeProblem,
  normalizeProgressPhoto,
  normalizeProject,
  normalizeRelationShip,
  normalizeTask,
  normalizeTimeEntry,
  normalizeVehicle,
  normalizeWorkout,
  normalizeWorkoutPlan
} from '@/utils/normalizeEntities'
import { db } from '.'

type SyncEntityMap = {
  table: any
  normalize: (x: any) => any
}

const syncMap: Record<string, SyncEntityMap> = {
  goals: {
    table: db.goals,
    normalize: normalizeGoal
  },
  tasks: {
    table: db.tasks,
    normalize: normalizeTask
  },
  events: {
    table: db.events,
    normalize: normalizeEvent
  },
  vehicles: {
    table: db.vehicles,
    normalize: normalizeVehicle
  },
  estates: {
    table: db.estates,
    normalize: normalizeEstate
  },
  otherassets: {
    table: db.otherassets,
    normalize: normalizeOtherAsset
  },
  learning: {
    table: db.learning,
    normalize: normalizeLearning
  },
  relationships: {
    table: db.relationships,
    normalize: normalizeRelationShip
  },
  medicaldocuments: {
    table: db.medicaldocuments,
    normalize: normalizeMedicalDocument
  },
  workouts: {
    table: db.workouts,
    normalize: normalizeWorkout
  },
  workoutplans: {
    table: db.workoutplans,
    normalize: normalizeWorkoutPlan
  },
  progressphotos: {
    table: db.progressphotos,
    normalize: normalizeProgressPhoto
  },
  hobbies: {
    table: db.hobbies,
    normalize: normalizeHobby
  },
  businesses: {
    table: db.businesses,
    normalize: normalizeBusiness
  },
  incomes: {
    table: db.incomes,
    normalize: normalizeIncome
  },
  expenses: {
    table: db.expenses,
    normalize: normalizeExpense
  },
  problems: {
    table: db.problems,
    normalize: normalizeProblem
  },
  timeentries: {
    table: db.timeentries,
    normalize: normalizeTimeEntry
  },
  projects: {
    table: db.projects,
    normalize: normalizeProject
  },
  clients: {
    table: db.clients,
    normalize: normalizeClient
  },
  marketingstrategies: {
    table: db.marketingstrategies,
    normalize: normalizeMarketingStrategy
  },
  marketingcampaigns: {
    table: db.marketingcampaigns,
    normalize: normalizeMarketingCampaign
  },
  marketingcontents: {
    table: db.marketingcontents,
    normalize: normalizeMarketingContent
  },
  notes: {
    table: db.notes,
    normalize: normalizeNote
  }
}

export async function syncEntity(entityName: string, serverData: any[]) {
  const config = syncMap[entityName]

  if (!config) {
    console.warn(`No sync config found for entity: ${entityName}`)
    return
  }

  const { table, normalize } = config

  const normalized = (serverData ?? []).map(normalize)

  await table.bulkPut(normalized)
}
