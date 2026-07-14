import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { aiRouter } from './ai/route.ts'
import { authRouter } from './auth/route.ts'
import { checkDb, connectDb } from './db.ts'
import { infraRouter } from './infra/route.ts'
import { logger, requestLogger } from './logger.ts'
import { marketsRouter } from './markets/route.ts'
import { isAllowedOrigin, originGuard } from './middleware/originGuard.ts'
import { runMigrations } from './migrate.ts'
import { newsRouter } from './news/route.ts'

const PORT = Number(process.env.PORT) || 3000

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, origin ?? true)
        return
      }
      callback(null, false)
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())
app.use(requestLogger)

app.get('/health', async (_req, res) => {
  const db = await checkDb()
  const ok = db !== 'disconnected'

  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    db,
  })
})

app.use(originGuard)

app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

app.use('/api/auth', authRouter)
app.use('/api/markets', marketsRouter)
app.use('/api/news', newsRouter)
app.use('/api/infra', infraRouter)
app.use('/api/ai', aiRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

async function start() {
  await connectDb()
  await runMigrations()

  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'World Pulse API started')
  })
}

start().catch((error) => {
  logger.error({ err: error }, 'Failed to start API')
  process.exit(1)
})
