import { z } from 'zod'

export const tvCalendarEventSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  country: z.string(),
  date: z.string(),
  importance: z.number(),
  forecast: z.number().nullable().optional(),
  previous: z.number().nullable().optional(),
})

export const tradingViewCalendarResponseSchema = z.object({
  result: z.array(tvCalendarEventSchema).optional(),
})

export const ffCalendarEventSchema = z.object({
  title: z.string(),
  country: z.string(),
  date: z.string(),
  impact: z.string(),
  forecast: z.string().optional(),
  previous: z.string().optional(),
})

export const ffCalendarResponseSchema = z.array(ffCalendarEventSchema)

export const yahooScreenerQuoteSchema = z.object({
  symbol: z.string(),
  shortName: z.string().optional(),
  regularMarketPrice: z.number().optional(),
  regularMarketChangePercent: z.number().optional(),
})

export const yahooScreenerResponseSchema = z.object({
  finance: z
    .object({
      result: z
        .array(
          z.object({
            quotes: z.array(yahooScreenerQuoteSchema).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
})

export const yahooChartMetaSchema = z.object({
  regularMarketPrice: z.number().optional(),
  chartPreviousClose: z.number().optional(),
})

export const yahooChartResponseSchema = z.object({
  chart: z
    .object({
      result: z
        .array(
          z.object({
            meta: yahooChartMetaSchema.optional(),
          }),
        )
        .optional(),
    })
    .optional(),
})

export const yahooQuoteResultSchema = z.object({
  price: z.number(),
  changePercent: z.number(),
})

export const calendarImpactSchema = z.enum(['Low', 'Medium', 'High'])

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  country: z.string(),
  datetime: z.string(),
  timeLabel: z.string(),
  impact: calendarImpactSchema,
  forecast: z.string().optional(),
  previous: z.string().optional(),
})

export const calendarResponseSchema = z.object({
  events: z.array(calendarEventSchema),
  updatedAt: z.string(),
})

export const marketMoverSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changePercent: z.number(),
  type: z.enum(['crypto', 'stock']),
})

export const moversResponseSchema = z.object({
  movers: z.array(marketMoverSchema),
  updatedAt: z.string(),
})

export const commodityQuoteSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changePercent: z.number(),
})

export const commoditiesResponseSchema = z.object({
  commodities: z.array(commodityQuoteSchema),
  updatedAt: z.string(),
})

export const cryptoQuoteInternalSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changePercent: z.number(),
})

export const cryptoQuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  changePercent: z.number(),
})

export const cryptoResponseSchema = z.object({
  coins: z.array(cryptoQuoteSchema),
  updatedAt: z.string(),
})

export const fxRateSchema = z.object({
  pair: z.string(),
  rate: z.number(),
  changePercent: z.number(),
})

export const fxResponseSchema = z.object({
  rates: z.array(fxRateSchema),
  updatedAt: z.string(),
})

export type TvCalendarEvent = z.infer<typeof tvCalendarEventSchema>
export type FfCalendarEvent = z.infer<typeof ffCalendarEventSchema>
export type YahooScreenerQuote = z.infer<typeof yahooScreenerQuoteSchema>
export type YahooQuoteResult = z.infer<typeof yahooQuoteResultSchema>
export type CalendarImpact = z.infer<typeof calendarImpactSchema>
export type CalendarEvent = z.infer<typeof calendarEventSchema>
export type MarketMover = z.infer<typeof marketMoverSchema>
export type CommodityQuote = z.infer<typeof commodityQuoteSchema>
export type CryptoQuoteInternal = z.infer<typeof cryptoQuoteInternalSchema>
export type CryptoQuote = z.infer<typeof cryptoQuoteSchema>
export type FxRate = z.infer<typeof fxRateSchema>

export function parseTradingViewCalendarResponse(raw: unknown) {
  return tradingViewCalendarResponseSchema.safeParse(raw)
}

export function parseFfCalendarResponse(raw: unknown) {
  return ffCalendarResponseSchema.safeParse(raw)
}

export function parseYahooScreenerResponse(raw: unknown) {
  return yahooScreenerResponseSchema.safeParse(raw)
}

export function parseYahooChartResponse(raw: unknown) {
  return yahooChartResponseSchema.safeParse(raw)
}

export function parseYahooQuoteResult(raw: unknown) {
  return yahooQuoteResultSchema.safeParse(raw)
}

export function parseCalendarEvent(raw: unknown) {
  return calendarEventSchema.safeParse(raw)
}

export function parseCalendarResponse(raw: unknown) {
  return calendarResponseSchema.safeParse(raw)
}

export function parseMarketMover(raw: unknown) {
  return marketMoverSchema.safeParse(raw)
}

export function parseMoversResponse(raw: unknown) {
  return moversResponseSchema.safeParse(raw)
}

export function parseCommodityQuote(raw: unknown) {
  return commodityQuoteSchema.safeParse(raw)
}

export function parseCommoditiesResponse(raw: unknown) {
  return commoditiesResponseSchema.safeParse(raw)
}

export function parseCryptoQuoteInternal(raw: unknown) {
  return cryptoQuoteInternalSchema.safeParse(raw)
}

export function parseCryptoQuote(raw: unknown) {
  return cryptoQuoteSchema.safeParse(raw)
}

export function parseCryptoResponse(raw: unknown) {
  return cryptoResponseSchema.safeParse(raw)
}

export function parseFxRate(raw: unknown) {
  return fxRateSchema.safeParse(raw)
}

export function parseFxResponse(raw: unknown) {
  return fxResponseSchema.safeParse(raw)
}
