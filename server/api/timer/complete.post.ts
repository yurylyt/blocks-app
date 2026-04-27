import { and, eq, sql } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { HALF_DURATION_MS, elapsedMs } from '~~/server/utils/timer'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const db = useDb()
  const [row] = await db.select().from(schema.runningTimers)
    .where(eq(schema.runningTimers.userId, userId))
  if (!row) throw createError({ statusCode: 404, message: 'No timer running' })

  const elapsed = elapsedMs(row.startedAt)
  if (elapsed < HALF_DURATION_MS) {
    throw createError({ statusCode: 400, message: 'Timer not yet complete' })
  }

  if (row.half === 1) {
    let firstEntryId = row.firstEntryId
    if (firstEntryId == null) {
      const [next] = await db.select({ m: sql<number>`COALESCE(MAX(${schema.entries.position}), -1)` })
        .from(schema.entries)
        .where(and(eq(schema.entries.userId, userId), eq(schema.entries.date, row.startedDate)))
      const position = (Number(next?.m ?? -1)) + 1

      const [entry] = await db.insert(schema.entries).values({
        userId,
        activityId: row.activityId,
        name: row.name,
        date: row.startedDate,
        blocks: 0.5,
        position
      }).returning({ id: schema.entries.id })
      firstEntryId = entry!.id

      await db.update(schema.runningTimers).set({ firstEntryId })
        .where(eq(schema.runningTimers.id, row.id))
    }

    return {
      state: 'awaiting-choice' as const,
      firstEntryId,
      activityId: row.activityId,
      startedDate: row.startedDate
    }
  }

  if (row.firstEntryId != null) {
    await db.update(schema.entries).set({ blocks: 1 })
      .where(and(eq(schema.entries.id, row.firstEntryId), eq(schema.entries.userId, userId)))
  }
  await db.delete(schema.runningTimers).where(eq(schema.runningTimers.id, row.id))

  return {
    state: 'completed' as const,
    firstEntryId: row.firstEntryId
  }
})
