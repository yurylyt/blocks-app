import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { resolve } from 'node:path'
import { useDb } from '../database/client'

export default defineNitroPlugin(async () => {
  const db = useDb()
  await migrate(db, { migrationsFolder: resolve('server/database/migrations') })
})
