import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (_db) return _db
  const url = useRuntimeConfig().databaseUrl
  if (!url) {
    throw new Error('DATABASE_URL must be set to a PostgreSQL connection string')
  }
  const client = postgres(url)
  _db = drizzle(client, { schema })
  return _db
}

export { schema }
