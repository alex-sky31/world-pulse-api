import type { RequestHandler } from 'express'
import pino from 'pino'
import pretty from 'pino-pretty'

const isDev = process.env.NODE_ENV !== 'production'

const stream = isDev
  ? pretty({
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      singleLine: false,
      sync: true,
    })
  : pino.destination({ sync: false })

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  },
  stream,
)

export const requestLogger: RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    next()
    return
  }

  const start = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - start
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`

    if (res.statusCode >= 500) {
      logger.error(message)
      return
    }
    if (res.statusCode >= 400) {
      logger.warn(message)
      return
    }
    logger.info(message)
  })

  next()
}
