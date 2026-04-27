import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const db = useDb()
  const [row] = await db.select().from(schema.runningTimers)
    .where(eq(schema.runningTimers.userId, userId))
  if (!row) throw createError({ statusCode: 404, message: 'No timer running' })

  if (row.half !== 1 || row.firstEntryId == null) {
    throw createError({ statusCode: 409, message: 'Not in awaiting-choice state' })
  }

  const [updated] = await db.update(schema.runningTimers)
    .set({ half: 2, startedAt: new Date() })
    .where(eq(schema.runningTimers.id, row.id))
    .returning()

  return updated
})
