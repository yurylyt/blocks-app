import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { isChimeSound } from '~~/shared/chime'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody<{ chimeSound?: string }>(event)

  const patch: { chimeSound?: string } = {}
  if (body?.chimeSound != null) {
    if (!isChimeSound(body.chimeSound)) {
      throw createError({ statusCode: 400, message: 'Invalid chimeSound' })
    }
    patch.chimeSound = body.chimeSound
  }

  if (Object.keys(patch).length === 0) return session.user

  const db = useDb()
  const [updated] = await db.update(schema.users).set(patch)
    .where(eq(schema.users.id, session.user.id))
    .returning()
  if (!updated) throw createError({ statusCode: 404, message: 'Not found' })

  await replaceUserSession(event, {
    ...session,
    user: {
      ...session.user,
      chimeSound: updated.chimeSound
    }
  })

  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    avatarUrl: updated.avatarUrl,
    chimeSound: updated.chimeSound
  }
})
