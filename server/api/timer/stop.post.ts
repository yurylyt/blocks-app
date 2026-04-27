import { and, eq, sql } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { HALF_BLOCK_MIN_MS, elapsedMs } from '~~/server/utils/timer'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const db = useDb()
  const [row] = await db.select().from(schema.runningTimers)
    .where(eq(schema.runningTimers.userId, userId))
  if (!row) throw createError({ statusCode: 404, message: 'No timer running' })

  const elapsed = elapsedMs(row.startedAt)
  let entryId: number | null = null

  if (row.half === 1) {
    if (row.firstEntryId == null && elapsed >= HALF_BLOCK_MIN_MS) {
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
      entryId = entry!.id
    } else if (row.firstEntryId != null) {
      entryId = row.firstEntryId
    }
  } else if (row.half === 2) {
    if (elapsed >= HALF_BLOCK_MIN_MS && row.firstEntryId != null) {
      await db.update(schema.entries).set({ blocks: 1 })
        .where(and(eq(schema.entries.id, row.firstEntryId), eq(schema.entries.userId, userId)))
    }
    entryId = row.firstEntryId
  }

  await db.delete(schema.runningTimers).where(eq(schema.runningTimers.id, row.id))

  return { entryId }
})
