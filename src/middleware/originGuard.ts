import type { RequestHandler } from 'express'
import { logger } from '../logger.ts'

const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []),
]
  .map((origin) => origin?.trim().replace(/\/$/, ''))
  .filter(Boolean) as string[]

export function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.replace(/\/$/, '')
  return LOCALHOST.test(normalized) || allowedOrigins.includes(normalized)
}

export const originGuard: RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    next()
    return
  }

  const origin = req.get('origin')
  if (!origin) {
    logger.warn(`${req.method} ${req.originalUrl} blocked — no origin`)
    res.status(403).json({ error: 'Origin not allowed' })
    return
  }

  if (isAllowedOrigin(origin)) {
    next()
    return
  }

  logger.warn(`${req.method} ${req.originalUrl} blocked — origin: ${origin}`)
  res.status(403).json({ error: 'Origin not allowed' })
}
