import { Router, type RequestHandler } from 'express'
import { errorMessage } from '../http.ts'
import {
  parseCalendarResponse,
  parseCommoditiesResponse,
  parseCryptoResponse,
  parseFxResponse,
  parseMoversResponse,
} from './schema.ts'
import {
  getStaleCalendarEvents,
  getStaleCryptoCoins,
  loadCalendarEvents,
  loadCommodities,
  loadCrypto,
  loadFxRates,
  loadMarketMovers,
} from './service.ts'

export const marketsRouter = Router()

function sendValidatedResponse(
  res: Parameters<RequestHandler>[1],
  payload: unknown,
  validate: (raw: unknown) => { success: boolean; data?: unknown },
  invalidMessage: string,
) {
  const parsed = validate(payload)
  if (!parsed.success) {
    res.status(502).json({ error: invalidMessage })
    return
  }
  res.status(200).json(parsed.data)
}

const getCalendar: RequestHandler = async (_req, res) => {
  try {
    const events = await loadCalendarEvents()
    sendValidatedResponse(
      res,
      { events, updatedAt: new Date().toISOString() },
      parseCalendarResponse,
      'Invalid calendar payload',
    )
  } catch (error) {
    const stale = getStaleCalendarEvents()
    if (stale) {
      sendValidatedResponse(
        res,
        { events: stale, updatedAt: new Date().toISOString() },
        parseCalendarResponse,
        'Invalid calendar payload',
      )
      return
    }
    res.status(502).json({
      error: errorMessage(error, 'Failed to load calendar'),
    })
  }
}

const getMovers: RequestHandler = async (_req, res) => {
  try {
    const movers = await loadMarketMovers()
    sendValidatedResponse(
      res,
      { movers, updatedAt: new Date().toISOString() },
      parseMoversResponse,
      'Invalid movers payload',
    )
  } catch (error) {
    res.status(502).json({
      error: errorMessage(error, 'Failed to load movers'),
    })
  }
}

const getCommodities: RequestHandler = async (_req, res) => {
  try {
    const commodities = await loadCommodities()
    sendValidatedResponse(
      res,
      { commodities, updatedAt: new Date().toISOString() },
      parseCommoditiesResponse,
      'Invalid commodities payload',
    )
  } catch (error) {
    res.status(502).json({
      error: errorMessage(error, 'Failed to load commodities'),
    })
  }
}

const getCrypto: RequestHandler = async (_req, res) => {
  try {
    const coins = await loadCrypto()
    sendValidatedResponse(
      res,
      { coins, updatedAt: new Date().toISOString() },
      parseCryptoResponse,
      'Invalid crypto payload',
    )
  } catch (error) {
    const stale = getStaleCryptoCoins()
    if (stale) {
      sendValidatedResponse(
        res,
        { coins: stale, updatedAt: new Date().toISOString() },
        parseCryptoResponse,
        'Invalid crypto payload',
      )
      return
    }
    res.status(502).json({
      error: errorMessage(error, 'Failed to load crypto'),
    })
  }
}

const getFx: RequestHandler = async (_req, res) => {
  try {
    const rates = await loadFxRates()
    sendValidatedResponse(
      res,
      { rates, updatedAt: new Date().toISOString() },
      parseFxResponse,
      'Invalid FX payload',
    )
  } catch (error) {
    res.status(502).json({
      error: errorMessage(error, 'Failed to load FX rates'),
    })
  }
}

function registerRoute(path: string, handler: RequestHandler) {
  marketsRouter.route(path).get(handler).post(handler).patch(handler).put(handler)
}

registerRoute('/crypto', getCrypto)
registerRoute('/fx', getFx)
registerRoute('/commodities', getCommodities)
registerRoute('/movers', getMovers)
registerRoute('/calendar', getCalendar)
