import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDbPool } from './db.ts'
import { logger } from './logger.ts'

const schemaDir = join(dirname(fileURLToPath(import.meta.url)), '../db/schema')

export async function runMigrations() {
  const pool = getDbPool()
  if (!pool) {
    logger.warn('DATABASE_URL not set — skipping migrations')
    return
  }

  const files = readdirSync(schemaDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const name = file.replace(/\.sql$/, '')
    const applied = await pool.query(
      'SELECT 1 FROM worldpulse.schema_migrations WHERE name = $1',
      [name],
    )

    if ((applied.rowCount ?? 0) > 0) continue

    const sql = readFileSync(join(schemaDir, file), 'utf8')
    await pool.query(sql)
    logger.info({ migration: name }, 'Migration applied')
  }
}
