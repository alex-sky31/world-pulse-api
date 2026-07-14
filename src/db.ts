import pg from 'pg'
import { logger } from './logger.ts'

let pool: pg.Pool | undefined

export function getDbPool() {
  if (!process.env.DATABASE_URL) return undefined

  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=worldpulse,public',
  })
  return pool
}

export async function checkDb(): Promise<'connected' | 'disconnected' | 'skipped'> {
  const db = getDbPool()
  if (!db) return 'skipped'

  try {
    await db.query('SELECT 1')
    return 'connected'
  } catch {
    return 'disconnected'
  }
}

export async function connectDb() {
  const status = await checkDb()

  if (status === 'connected') {
    logger.info('Database connected')
  } else if (status === 'disconnected') {
    logger.error('Database connection failed')
  }

  return status
}

export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = undefined
  }
}
