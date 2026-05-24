import {
  normalizeBusiness,
  normalizeEstate,
  normalizeEvent,
  normalizeGoal,
  normalizeHobby,
  normalizeLearning,
  normalizeMedicalDocument,
  normalizeOtherAsset,
  normalizeProgressPhoto,
  normalizeRelationShip,
  normalizeTask,
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
