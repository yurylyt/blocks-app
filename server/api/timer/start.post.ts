import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody<{ activityId?: number, startedDate?: string }>(event)

  const activityId = Number(body?.activityId)
  if (!Number.isFinite(activityId)) throw createError({ statusCode: 400, message: 'Invalid activityId' })

  const startedDate = String(body?.startedDate || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startedDate)) {
    throw createError({ statusCode: 400, message: 'Invalid startedDate' })
  }

  const db = useDb()

  const [activity] = await db.select({ id: schema.activities.id }).from(schema.activities)
    .where(and(eq(schema.activities.id, activityId), eq(schema.activities.userId, userId)))
  if (!activity) throw createError({ statusCode: 404, message: 'Activity not found' })

  const [existing] = await db.select({ id: schema.runningTimers.id }).from(schema.runningTimers)
    .where(eq(schema.runningTimers.userId, userId))
  if (existing) throw createError({ statusCode: 409, message: 'Timer already running' })

  const [row] = await db.insert(schema.runningTimers).values({
    userId,
    activityId,
    startedDate,
    half: 1
  }).returning()

  return row
})
