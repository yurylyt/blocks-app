import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { HALF_DURATION_MS, HALF_BLOCK_MIN_MS, elapsedMs } from '~~/server/utils/timer'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = useDb()
  const [row] = await db.select().from(schema.runningTimers)
    .where(eq(schema.runningTimers.userId, userId))

  return {
    config: { halfDurationMs: HALF_DURATION_MS, halfBlockMinMs: HALF_BLOCK_MIN_MS },
    timer: row
      ? {
          activityId: row.activityId,
          name: row.name,
          startedAt: row.startedAt,
          startedDate: row.startedDate,
          half: row.half,
          firstEntryId: row.firstEntryId,
          elapsedMs: elapsedMs(row.startedAt)
        }
      : null
  }
})
