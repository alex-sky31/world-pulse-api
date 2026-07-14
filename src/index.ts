import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { aiRouter } from './ai/route.ts'
import { infraRouter } from './infra/route.ts'
import { marketsRouter } from './markets/route.ts'
import { newsRouter } from './news/route.ts'

const PORT = Number(process.env.PORT) || 3000
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173').replace(
  /\/$/,
  '',
)

const app = express()

app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
)
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/markets', marketsRouter)
app.use('/api/news', newsRouter)
app.use('/api/infra', infraRouter)
app.use('/api/ai', aiRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`World Pulse API running on http://localhost:${PORT}`)
  console.log(`CORS origin: ${CORS_ORIGIN}`)
})
