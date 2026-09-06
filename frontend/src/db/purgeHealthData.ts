import { db } from '.'

// Keep in sync with backend/src/utils/deleteHealthData.ts
const HEALTH_HARD_DELETE_TABLES = [
  'medicaldocuments',
  'bodymeasurements',
  'workouts',
  'workoutplans',
  'progressphotos'
]

const HEALTH_CATEGORY_TABLES = ['problems', 'goals', 'tasks']
const HEALTH_CATEGORY_VALUES = ['health_body', 'health_mind']

export async function purgeLocalHealthData(): Promise<void> {
  try {
    // Hard-clear entire health-dedicated tables
    for (const tableName of HEALTH_HARD_DELETE_TABLES) {
      const table = (db as any)[tableName]
      if (table) {
        await table.clear()
      }
    }

    // Category-filtered delete from mixed tables
    for (const tableName of HEALTH_CATEGORY_TABLES) {
      const table = (db as any)[tableName]
      if (table) {
        await table.where('category').anyOf(HEALTH_CATEGORY_VALUES).delete()
      }
    }
  } catch (error) {
    console.error('[purgeLocalHealthData] Error purging health data from IndexedDB:', error)
    throw error
  }
}
