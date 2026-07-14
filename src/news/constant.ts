import type { NewsCategory } from './schema.ts'

export type FeedConfig = {
  url: string
  source: string
}

export type FeedWithRegion = FeedConfig & { region: string }

export const RSS_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; WorldPulse/1.0; +https://github.com/alex-sky31/world-pulse-api)',
  Accept: 'application/rss+xml, application/xml, text/xml, */*',
} as const

export const CACHE_TTL_MS = 5 * 60 * 1000

export const ARTICLES_LIMIT = 12

export const WORLD_FEEDS: FeedWithRegion[] = [
  {
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    source: 'BBC',
    region: 'WORLD',
  },
  {
    url: 'https://www.theguardian.com/world/rss',
    source: 'THE GUARDIAN',
    region: 'WORLD',
  },
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    source: 'NYT',
    region: 'WORLD',
  },
  {
    url: 'https://www.france24.com/en/rss',
    source: 'FRANCE 24',
    region: 'WORLD',
  },
]

export const TECH_FEEDS: FeedWithRegion[] = [
  {
    url: 'https://www.theverge.com/rss/index.xml',
    source: 'THE VERGE',
    region: 'TECH',
  },
  {
    url: 'https://techcrunch.com/feed/',
    source: 'TECHCRUNCH',
    region: 'TECH',
  },
  {
    url: 'https://www.wired.com/feed/rss',
    source: 'WIRED',
    region: 'TECH',
  },
  {
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    source: 'ARS TECHNICA',
    region: 'TECH',
  },
]

export const FEEDS_BY_CATEGORY: Record<NewsCategory, FeedWithRegion[]> = {
  world: WORLD_FEEDS,
  tech: TECH_FEEDS,
}
