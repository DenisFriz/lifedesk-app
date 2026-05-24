import { backend } from '@/api/backend'
import { syncEntity } from '@/db/syncEntity'

export const ENTITIES = [
  'Goal',
  'Task',
  'Event',
  'Vehicle',
  'Estate',
  'OtherAsset',
  'Learning',
  'RelationShip',
  'MedicalDocument',
  'Workout',
  'WorkoutPlan',
  'ProgressPhoto',
  'Hobby',
  'Business'
] as const

const entityMap: Record<(typeof ENTITIES)[number], string> = {
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
}

export async function pullEntitiesFromServer() {
  await Promise.all(
    ENTITIES.map(async entity => {
      const serverData = await backend.entities[entity].list('-createdAt')

      const localEntityName = entityMap[entity]

      await syncEntity(localEntityName, serverData)
    })
  )
}
