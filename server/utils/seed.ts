import { useDb, schema } from '../database/client'

const DEFAULT_ACTIVITIES: Array<{ name: string, color: string }> = [
  { name: 'Deep work', color: 'indigo' },
  { name: 'Reading', color: 'sky' },
  { name: 'Writing', color: 'emerald' },
  { name: 'Exercise', color: 'amber' },
  { name: 'Meetings', color: 'red' }
]

export async function seedDefaultActivities(userId: number) {
  const db = useDb()
  await db.insert(schema.activities).values(
    DEFAULT_ACTIVITIES.map(a => ({ userId, name: a.name, color: a.color }))
  )
}
