import type { NewsArticle, NewsCategory, ParsedArticle, RssItem } from './schema.ts'
import {
  parseNewsArticle,
  parseParsedArticle,
  parseRssItem,
} from './schema.ts'
import {
  ARTICLES_LIMIT,
  CACHE_TTL_MS,
  FEEDS_BY_CATEGORY,
  RSS_HEADERS,
  type FeedConfig,
  type FeedWithRegion,
} from './constant.ts'

const cache = new Map<NewsCategory, { expiresAt: number; articles: NewsArticle[] }>()

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
}

function extractTag(block: string, tag: string): string {
  const cdata = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    'i',
  )
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const match = block.match(cdata) ?? block.match(plain)
  return match?.[1]?.trim() ?? ''
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const parsed = parseRssItem({
      title: stripHtml(extractTag(block, 'title')),
      link: extractTag(block, 'link'),
      description: stripHtml(
        extractTag(block, 'description') ||
          extractTag(block, 'content:encoded') ||
          extractTag(block, 'summary'),
      ),
      pubDate: extractTag(block, 'pubDate') || extractTag(block, 'updated'),
      category: stripHtml(extractTag(block, 'category')),
    })

    if (parsed.success) {
      items.push(parsed.data)
    }
  }

  if (items.length > 0) return items

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1]
    const parsed = parseRssItem({
      title: stripHtml(extractTag(block, 'title')),
      link:
        block.match(/<link[^>]+href="([^"]+)"/i)?.[1] ?? extractTag(block, 'link'),
      description: stripHtml(
        extractTag(block, 'summary') || extractTag(block, 'content'),
      ),
      pubDate: extractTag(block, 'published') || extractTag(block, 'updated'),
      category: stripHtml(extractTag(block, 'category')),
    })

    if (parsed.success) {
      items.push(parsed.data)
    }
  }

  return items
}

async function fetchRssFeed(feed: FeedConfig): Promise<RssItem[]> {
  const response = await fetch(feed.url, { headers: RSS_HEADERS })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${feed.source}: ${response.status}`)
  }

  const xml = await response.text()
  return parseRssItems(xml)
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return 'just now'

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function toRegionLabel(category: string, fallback: string): string {
  const label = category.trim().toUpperCase()
  if (!label) return fallback
  return label.length > 18 ? `${label.slice(0, 18)}…` : label
}

async function fetchFeed(feed: FeedWithRegion): Promise<ParsedArticle[]> {
  const items = await fetchRssFeed(feed)

  return items.flatMap((item, index) => {
    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
    const parsed = parseParsedArticle({
      id: `${feed.source}-${publishedAt.getTime()}-${index}`,
      headline: item.title,
      summary: item.description || item.title,
      source: feed.source,
      region: toRegionLabel(item.category, feed.region),
      time: formatRelativeTime(publishedAt),
      url: item.link,
      publishedAt: publishedAt.getTime(),
    })

    return parsed.success ? [parsed.data] : []
  })
}

export async function loadArticles(category: NewsCategory): Promise<NewsArticle[]> {
  const cached = cache.get(category)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.articles
  }

  const feeds = FEEDS_BY_CATEGORY[category]
  const results = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed)))

  const articles = results
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, ARTICLES_LIMIT)
    .flatMap(({ publishedAt: _publishedAt, ...article }, index) => {
      const parsed = parseNewsArticle({
        ...article,
        featured: index === 0,
      })
      return parsed.success ? [parsed.data] : []
    })

  if (articles.length === 0) {
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason)
    throw new Error(
      errors[0] instanceof Error
        ? errors[0].message
        : 'Unable to load articles from news feeds',
    )
  }

  cache.set(category, {
    articles,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  return articles
}
