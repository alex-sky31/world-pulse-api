import type { AiModelsResponse, RankingsDailyResponse } from './schema.ts'
import {
  parseAiModelRank,
  parseAiModelsResponse,
  parseAiProviderShare,
  parseRankingsDailyResponse,
} from './schema.ts'
import {
  CACHE_TTL_MS,
  OPENROUTER_RANKINGS_URL,
  PROVIDER_LABELS,
  RANKINGS_WINDOW_DAYS,
  TOP_MODELS_LIMIT,
  TOP_PROVIDERS_LIMIT,
} from './constant.ts'

type CacheEntry = { expiresAt: number; data: AiModelsResponse }

const cache: { entry?: CacheEntry } = {}

function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getTrailingWindow(days: number) {
  const end = new Date()
  end.setUTCHours(0, 0, 0, 0)
  end.setUTCDate(end.getUTCDate() - 1)

  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))

  return { start: formatUtcDate(start), end: formatUtcDate(end) }
}

function parseProvider(slug: string) {
  if (slug === 'other') return 'other'
  return slug.split('/')[0] ?? slug
}

function formatModelLabel(slug: string) {
  if (slug === 'other') return 'Other models'

  const modelPart = slug.split('/')[1] ?? slug
  const base = modelPart.split(':')[0] ?? modelPart

  return base
    .split('-')
    .map((word) => {
      if (word.length <= 3 && /^\d/.test(word)) return word.toUpperCase()
      if (/^v\d/i.test(word)) return word.toUpperCase()
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function providerLabel(id: string) {
  return PROVIDER_LABELS[id] ?? id.replace(/-/g, ' ')
}

function toSharePercent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 1000) / 10
}

async function fetchRankings(
  apiKey: string,
  startDate: string,
  endDate: string,
): Promise<RankingsDailyResponse> {
  const url = new URL(OPENROUTER_RANKINGS_URL)
  url.searchParams.set('start_date', startDate)
  url.searchParams.set('end_date', endDate)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      response.status === 401
        ? 'Invalid OpenRouter API key'
        : `OpenRouter rankings unavailable (${response.status})${body ? `: ${body.slice(0, 120)}` : ''}`,
    )
  }

  const parsed = parseRankingsDailyResponse(await response.json())
  if (!parsed.success) {
    throw new Error('Invalid OpenRouter rankings response')
  }

  return parsed.data
}

function buildAiModelsPayload(raw: RankingsDailyResponse): AiModelsResponse {
  const providerTotals = new Map<string, number>()
  const latestDate = raw.meta.end_date
  const latestModelTotals = new Map<string, number>()
  let weekTotalTokens = 0
  let latestDayTotalTokens = 0

  for (const row of raw.data) {
    const tokens = Number(row.total_tokens)
    if (!Number.isFinite(tokens) || tokens <= 0) continue

    weekTotalTokens += tokens

    const provider = parseProvider(row.model_permaslug)
    providerTotals.set(
      provider,
      (providerTotals.get(provider) ?? 0) + tokens,
    )

    if (row.date === latestDate) {
      latestDayTotalTokens += tokens
      latestModelTotals.set(
        row.model_permaslug,
        (latestModelTotals.get(row.model_permaslug) ?? 0) + tokens,
      )
    }
  }

  const providers = [...providerTotals.entries()]
    .map(([id, tokens]) =>
      parseAiProviderShare({
        id,
        name: providerLabel(id),
        sharePercent: toSharePercent(tokens, weekTotalTokens),
      }),
    )
    .flatMap((result) => (result.success ? [result.data] : []))
    .sort((a, b) => b.sharePercent - a.sharePercent)
    .slice(0, TOP_PROVIDERS_LIMIT)

  const models = [...latestModelTotals.entries()]
    .map(([slug, tokens]) =>
      parseAiModelRank({
        id: slug,
        name: formatModelLabel(slug),
        provider: providerLabel(parseProvider(slug)),
        sharePercent: toSharePercent(tokens, latestDayTotalTokens),
      }),
    )
    .flatMap((result) => (result.success ? [result.data] : []))
    .sort((a, b) => b.sharePercent - a.sharePercent)
    .slice(0, TOP_MODELS_LIMIT)

  const payload = parseAiModelsResponse({
    providers,
    models,
    windowLabel: `7d token share · models ${latestDate}`,
    asOf: raw.meta.as_of,
    source: 'OpenRouter',
  })

  if (!payload.success) {
    throw new Error('Invalid AI models payload')
  }

  return payload.data
}

export async function loadAiModels(): Promise<AiModelsResponse> {
  if (cache.entry && cache.entry.expiresAt > Date.now()) {
    return cache.entry.data
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('MISSING_API_KEY')
  }

  const { start, end } = getTrailingWindow(RANKINGS_WINDOW_DAYS)
  const raw = await fetchRankings(apiKey, start, end)
  const data = buildAiModelsPayload(raw)

  cache.entry = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  }

  return data
}
