import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { seedDefaultActivities } from '~~/server/utils/seed'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile', 'openid']
  },
  async onSuccess(event, { user }) {
    const db = useDb()
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.googleId, user.sub))

    let userId: number
    let chimeSound: string
    if (existing) {
      userId = existing.id
      chimeSound = existing.chimeSound
      await db.update(schema.users)
        .set({ email: user.email, name: user.name, avatarUrl: user.picture ?? null })
        .where(eq(schema.users.id, userId))
    } else {
      const [inserted] = await db.insert(schema.users).values({
        googleId: user.sub,
        email: user.email,
        name: user.name,
        avatarUrl: user.picture ?? null
      }).returning({ id: schema.users.id, chimeSound: schema.users.chimeSound })
      userId = inserted!.id
      chimeSound = inserted!.chimeSound
      await seedDefaultActivities(userId)
    }

    await setUserSession(event, {
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        avatarUrl: user.picture ?? null,
        chimeSound
      },
      loggedInAt: Date.now()
    })

    if (getCookie(event, 'menubar_auth') === '1') {
      deleteCookie(event, 'menubar_auth')
      const raw = getResponseHeader(event, 'set-cookie')
      const headers = (Array.isArray(raw) ? raw : raw ? [raw] : []) as string[]
      const entry = headers.find(h => h.startsWith('nuxt-session='))
      if (entry) {
        const value = entry.split(';')[0]!.slice('nuxt-session='.length)
        return sendRedirect(event, `blocks-menubar://auth/callback?session=${encodeURIComponent(value)}`)
      }
      return sendRedirect(event, '/login?error=menubar')
    }

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth')
  }
})
