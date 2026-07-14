export const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; WorldPulse/1.0)',
  Accept: 'application/json',
} as const

export const TRADINGVIEW_HEADERS = {
  Origin: 'https://www.tradingview.com',
  Accept: 'application/json',
} as const

export const TRADINGVIEW_CALENDAR_URL =
  'https://economic-calendar.tradingview.com/events'

export const FOREX_FACTORY_CALENDAR_URL =
  'https://nfs.faireconomy.media/ff_calendar_thisweek.json'

export const YAHOO_SCREENER_URL =
  'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=3'

export const YAHOO_CHART_URL =
  'https://query1.finance.yahoo.com/v8/finance/chart'

export const CACHE_TTL = {
  calendar: 60 * 60 * 1000,
  movers: 30 * 1000,
  commodities: 30 * 1000,
  crypto: 45 * 1000,
  fx: 30 * 1000,
} as const

export const MAJOR_COUNTRIES = ['US', 'EU', 'GB', 'JP', 'CN', 'DE', 'FR'] as const

export const CALENDAR_LOOKAHEAD_DAYS = 7

export const EVENT_STALE_MS = 30 * 60_000

export const CALENDAR_EVENTS_LIMIT = 5

export const CRYPTO_MOVERS_LIMIT = 3

export const MARKET_MOVERS_LIMIT = 5

export const COMMODITY_SYMBOLS = [
  { symbol: 'CL=F', name: 'WTI Oil' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'NG=F', name: 'Nat Gas' },
] as const

export const FX_SYMBOLS = [
  { symbol: 'EURUSD=X', pair: 'EUR/USD', decimals: 4 },
  { symbol: 'GBPUSD=X', pair: 'GBP/USD', decimals: 4 },
  { symbol: 'USDJPY=X', pair: 'USD/JPY', decimals: 2 },
  { symbol: 'USDCHF=X', pair: 'USD/CHF', decimals: 4 },
  { symbol: 'AUDUSD=X', pair: 'AUD/USD', decimals: 4 },
] as const

export const CRYPTO_SYMBOLS = [
  { yahoo: 'BTC-USD', symbol: 'BTC', name: 'Bitcoin' },
  { yahoo: 'ETH-USD', symbol: 'ETH', name: 'Ethereum' },
  { yahoo: 'SOL-USD', symbol: 'SOL', name: 'Solana' },
  { yahoo: 'BNB-USD', symbol: 'BNB', name: 'BNB' },
] as const
