import type { QueryClient } from '@tanstack/react-query'
import { processSyncQueue } from '@/db/syncQueue'
import { pullEntitiesFromServer } from './entitiesSync'

let bootstrapInFlight = false

const entityMap = {
  Goal: 'goals',
  Task: 'tasks',
  Event: 'events',
  Vehicle: 'vehicles',
  Estate: 'estates',
  OtherAsset: 'otherassets',
  Learning: 'learning',
  RelationShip: 'relationships',
  MedicalDocument: 'medicaldocuments',
  Workout: 'workouts',
  WorkoutPlan: 'workoutplans',
  ProgressPhoto: 'progressphotos',
  Hobby: 'hobbies',
  Business: 'businesses'
} as const

export async function bootstrapSync(queryClient?: QueryClient): Promise<void> {
  if (bootstrapInFlight) return
  bootstrapInFlight = true
  try {
    // Flush local mutations first so pull reflects pending writes
    await processSyncQueue(queryClient)
    await pullEntitiesFromServer()
    await Promise.all([
      Object.values(entityMap).forEach(queryKey => {
        queryClient?.invalidateQueries({ queryKey: [queryKey] })
      })
    ])
  } finally {
    bootstrapInFlight = false
  }
}
