import type {
  CalendarEvent,
  CalendarImpact,
  CommodityQuote,
  CryptoQuote,
  CryptoQuoteInternal,
  FxRate,
  MarketMover,
} from './schema.ts'
import {
  parseCalendarEvent,
  parseCommodityQuote,
  parseCryptoQuote,
  parseCryptoQuoteInternal,
  parseFfCalendarResponse,
  parseFxRate,
  parseMarketMover,
  parseTradingViewCalendarResponse,
  parseYahooChartResponse,
  parseYahooQuoteResult,
  parseYahooScreenerResponse,
} from './schema.ts'
import {
  CACHE_TTL,
  CALENDAR_EVENTS_LIMIT,
  CALENDAR_LOOKAHEAD_DAYS,
  COMMODITY_SYMBOLS,
  CRYPTO_MOVERS_LIMIT,
  CRYPTO_SYMBOLS,
  EVENT_STALE_MS,
  FOREX_FACTORY_CALENDAR_URL,
  FX_SYMBOLS,
  MAJOR_COUNTRIES,
  MARKET_MOVERS_LIMIT,
  TRADINGVIEW_CALENDAR_URL,
  TRADINGVIEW_HEADERS,
  YAHOO_CHART_URL,
  YAHOO_HEADERS,
  YAHOO_SCREENER_URL,
} from './constant.ts'

type CacheEntry<T> = { expiresAt: number; data: T }

const calendarCache: { entry?: CacheEntry<CalendarEvent[]> } = {}
const moversCache: { entry?: CacheEntry<MarketMover[]> } = {}
const commoditiesCache: { entry?: CacheEntry<CommodityQuote[]> } = {}
const cryptoCache: { entry?: CacheEntry<CryptoQuoteInternal[]> } = {}
const fxCache: { entry?: CacheEntry<FxRate[]> } = {}

const majorCountries = new Set<string>(MAJOR_COUNTRIES)

function normalizeImpact(impact: string): CalendarImpact {
  const value = impact.toLowerCase()
  if (value.includes('high')) return 'High'
  if (value.includes('medium') || value.includes('med')) return 'Medium'
  return 'Low'
}

function formatEventTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function tvImportance(importance: number): CalendarImpact {
  if (importance >= 1) return 'High'
  if (importance === 0) return 'Medium'
  return 'Low'
}

function toCalendarEvent(raw: unknown): CalendarEvent | null {
  const parsed = parseCalendarEvent(raw)
  return parsed.success ? parsed.data : null
}

async function fetchTradingViewCalendar(): Promise<CalendarEvent[]> {
  const from = new Date()
  const to = new Date()
  to.setDate(to.getDate() + CALENDAR_LOOKAHEAD_DAYS)

  const url = new URL(TRADINGVIEW_CALENDAR_URL)
  url.searchParams.set('from', from.toISOString())
  url.searchParams.set('to', to.toISOString())

  const response = await fetch(url, { headers: TRADINGVIEW_HEADERS })

  if (!response.ok) {
    throw new Error(`TradingView calendar unavailable (${response.status})`)
  }

  const parsedResponse = parseTradingViewCalendarResponse(await response.json())
  if (!parsedResponse.success) {
    throw new Error('Invalid TradingView calendar response')
  }

  const now = Date.now()

  const events = (parsedResponse.data.result ?? [])
    .filter((event) => new Date(event.date).getTime() >= now - EVENT_STALE_MS)
    .sort((a, b) => {
      const aMajor = majorCountries.has(a.country) ? 1 : 0
      const bMajor = majorCountries.has(b.country) ? 1 : 0
      if (bMajor !== aMajor) return bMajor - aMajor
      if (b.importance !== a.importance) return b.importance - a.importance
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
    .slice(0, CALENDAR_EVENTS_LIMIT)
    .flatMap((event, index) => {
      const date = new Date(event.date)
      const calendarEvent = toCalendarEvent({
        id: `tv-${event.id}-${index}`,
        title: event.title,
        country: event.country,
        datetime: date.toISOString(),
        timeLabel: formatEventTime(date),
        impact: tvImportance(event.importance),
        forecast: event.forecast != null ? String(event.forecast) : undefined,
        previous: event.previous != null ? String(event.previous) : undefined,
      })
      return calendarEvent ? [calendarEvent] : []
    })

  if (events.length === 0) {
    throw new Error('No upcoming economic events found')
  }

  return events
}

async function fetchForexFactoryCalendar(): Promise<CalendarEvent[]> {
  const response = await fetch(FOREX_FACTORY_CALENDAR_URL, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Calendar feed unavailable (${response.status})`)
  }

  const parsedResponse = parseFfCalendarResponse(await response.json())
  if (!parsedResponse.success) {
    throw new Error('Invalid ForexFactory calendar response')
  }

  const now = Date.now()

  const events = parsedResponse.data
    .filter((event) => new Date(event.date).getTime() >= now - EVENT_STALE_MS)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, CALENDAR_EVENTS_LIMIT)
    .flatMap((event, index) => {
      const date = new Date(event.date)
      const calendarEvent = toCalendarEvent({
        id: `ff-${date.getTime()}-${index}`,
        title: event.title,
        country: event.country,
        datetime: date.toISOString(),
        timeLabel: formatEventTime(date),
        impact: normalizeImpact(event.impact),
        forecast: event.forecast || undefined,
        previous: event.previous || undefined,
      })
      return calendarEvent ? [calendarEvent] : []
    })

  if (events.length === 0) {
    throw new Error('No upcoming economic events found')
  }

  return events
}

export async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  if (calendarCache.entry && calendarCache.entry.expiresAt > Date.now()) {
    return calendarCache.entry.data
  }

  let events: CalendarEvent[] = []

  try {
    events = await fetchTradingViewCalendar()
  } catch {
    events = await fetchForexFactoryCalendar()
  }

  calendarCache.entry = {
    data: events,
    expiresAt: Date.now() + CACHE_TTL.calendar,
  }

  return events
}

export function getStaleCalendarEvents(): CalendarEvent[] | undefined {
  return calendarCache.entry?.data.length
    ? calendarCache.entry.data
    : undefined
}

async function fetchCryptoMovers(): Promise<MarketMover[]> {
  const quotes = await loadCryptoQuotes()

  return [...quotes]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, CRYPTO_MOVERS_LIMIT)
    .flatMap((coin) => {
      const parsed = parseMarketMover({
        id: `crypto-${coin.symbol}`,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.price,
        changePercent: coin.changePercent,
        type: 'crypto',
      })
      return parsed.success ? [parsed.data] : []
    })
}

async function fetchStockMovers(): Promise<MarketMover[]> {
  const response = await fetch(YAHOO_SCREENER_URL, { headers: YAHOO_HEADERS })

  if (!response.ok) {
    throw new Error(`Yahoo Finance unavailable (${response.status})`)
  }

  const parsedResponse = parseYahooScreenerResponse(await response.json())
  if (!parsedResponse.success) {
    throw new Error('Invalid Yahoo screener response')
  }

  const quotes = parsedResponse.data.finance?.result?.[0]?.quotes ?? []

  return quotes.flatMap((quote) => {
    if (quote.regularMarketPrice == null) return []

    const parsed = parseMarketMover({
      id: `stock-${quote.symbol}`,
      symbol: quote.symbol,
      name: quote.shortName ?? quote.symbol,
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent ?? 0,
      type: 'stock',
    })

    return parsed.success ? [parsed.data] : []
  })
}

export async function loadMarketMovers(): Promise<MarketMover[]> {
  if (moversCache.entry && moversCache.entry.expiresAt > Date.now()) {
    return moversCache.entry.data
  }

  const results = await Promise.allSettled([
    fetchCryptoMovers(),
    fetchStockMovers(),
  ])

  const movers = results
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, MARKET_MOVERS_LIMIT)

  if (movers.length === 0) {
    throw new Error('Unable to load market movers')
  }

  moversCache.entry = {
    data: movers,
    expiresAt: Date.now() + CACHE_TTL.movers,
  }

  return movers
}

async function fetchCryptoQuotesFromYahoo(): Promise<CryptoQuoteInternal[]> {
  const results = await Promise.allSettled(
    CRYPTO_SYMBOLS.map(async (coin) => {
      const { price, changePercent } = await fetchYahooQuote(coin.yahoo)
      return parseCryptoQuoteInternal({
        symbol: coin.symbol,
        name: coin.name,
        price,
        changePercent,
      })
    }),
  )

  const quotes = results.flatMap((result) => {
    if (result.status !== 'fulfilled' || !result.value.success) return []
    return [result.value.data]
  })

  if (quotes.length === 0) {
    throw new Error('Unable to load crypto quotes')
  }

  return quotes
}

async function loadCryptoQuotes(): Promise<CryptoQuoteInternal[]> {
  if (cryptoCache.entry && cryptoCache.entry.expiresAt > Date.now()) {
    return cryptoCache.entry.data
  }

  const quotes = await fetchCryptoQuotesFromYahoo()

  cryptoCache.entry = {
    data: quotes,
    expiresAt: Date.now() + CACHE_TTL.crypto,
  }

  return quotes
}

export function getStaleCryptoCoins(): CryptoQuote[] | undefined {
  if (!cryptoCache.entry?.data.length) return undefined

  const coins = cryptoCache.entry.data.flatMap((coin) => {
    const parsed = parseCryptoQuote({
      symbol: coin.symbol,
      price: coin.price,
      changePercent: coin.changePercent,
    })
    return parsed.success ? [parsed.data] : []
  })

  return coins.length > 0 ? coins : undefined
}

async function fetchYahooQuote(symbol: string) {
  const response = await fetch(
    `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    { headers: YAHOO_HEADERS },
  )

  if (!response.ok) {
    throw new Error(`Quote unavailable for ${symbol}`)
  }

  const parsedResponse = parseYahooChartResponse(await response.json())
  if (!parsedResponse.success) {
    throw new Error(`Invalid Yahoo chart response for ${symbol}`)
  }

  const meta = parsedResponse.data.chart?.result?.[0]?.meta
  const price = meta?.regularMarketPrice ?? 0
  const previous = meta?.chartPreviousClose ?? price
  const changePercent = previous ? ((price - previous) / previous) * 100 : 0

  const parsedQuote = parseYahooQuoteResult({ price, changePercent })
  if (!parsedQuote.success) {
    throw new Error(`Invalid quote data for ${symbol}`)
  }

  return parsedQuote.data
}

async function fetchCommodityQuote(
  symbol: string,
  name: string,
): Promise<CommodityQuote | null> {
  const { price, changePercent } = await fetchYahooQuote(symbol)
  const parsed = parseCommodityQuote({
    id: symbol,
    symbol,
    name,
    price,
    changePercent,
  })

  return parsed.success ? parsed.data : null
}

export async function loadCommodities(): Promise<CommodityQuote[]> {
  if (commoditiesCache.entry && commoditiesCache.entry.expiresAt > Date.now()) {
    return commoditiesCache.entry.data
  }

  const results = await Promise.allSettled(
    COMMODITY_SYMBOLS.map((item) =>
      fetchCommodityQuote(item.symbol, item.name),
    ),
  )

  const commodities = results.flatMap((result) =>
    result.status === 'fulfilled' && result.value ? [result.value] : [],
  )

  if (commodities.length === 0) {
    throw new Error('Unable to load commodity prices')
  }

  commoditiesCache.entry = {
    data: commodities,
    expiresAt: Date.now() + CACHE_TTL.commodities,
  }

  return commodities
}

export async function loadCrypto(): Promise<CryptoQuote[]> {
  const quotes = await loadCryptoQuotes()

  return quotes.flatMap((coin) => {
    const parsed = parseCryptoQuote({
      symbol: coin.symbol,
      price: coin.price,
      changePercent: coin.changePercent,
    })
    return parsed.success ? [parsed.data] : []
  })
}

export async function loadFxRates(): Promise<FxRate[]> {
  if (fxCache.entry && fxCache.entry.expiresAt > Date.now()) {
    return fxCache.entry.data
  }

  const results = await Promise.allSettled(
    FX_SYMBOLS.map(async (fx) => {
      const { price, changePercent } = await fetchYahooQuote(fx.symbol)
      return parseFxRate({
        pair: fx.pair,
        rate: price,
        changePercent,
      })
    }),
  )

  const rates = results.flatMap((result) => {
    if (result.status !== 'fulfilled' || !result.value.success) return []
    return [result.value.data]
  })

  if (rates.length === 0) {
    throw new Error('Unable to load FX rates')
  }

  fxCache.entry = {
    data: rates,
    expiresAt: Date.now() + CACHE_TTL.fx,
  }

  return rates
}
