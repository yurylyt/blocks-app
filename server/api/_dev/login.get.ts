import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { seedDefaultActivities } from '~~/server/utils/seed'

export default defineEventHandler(async (event) => {
  if (process.env.NUXT_DEV_AUTO_LOGIN !== '1') {
    throw createError({ statusCode: 404, message: 'Not found' })
  }
  const q = getQuery(event)
  const email = String(q.email || 'test@example.com')
  const name = String(q.name || 'Test User')
  const googleId = `dev-${email}`

  const db = useDb()
  let [user] = await db.select().from(schema.users).where(eq(schema.users.googleId, googleId))
  if (!user) {
    const [ins] = await db.insert(schema.users).values({ googleId, email, name, avatarUrl: null }).returning()
    user = ins!
    await seedDefaultActivities(user.id)
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    loggedInAt: Date.now()
  })
  return sendRedirect(event, String(q.redirect || '/'))
})
