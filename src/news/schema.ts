import { z } from 'zod'

export const newsCategorySchema = z.enum(['world', 'tech'])

export const rssItemSchema = z.object({
  title: z.string().trim().min(1),
  link: z.string().trim().min(1),
  description: z.string().default(''),
  pubDate: z.string().default(''),
  category: z.string().default(''),
})

export const newsArticleSchema = z.object({
  id: z.string(),
  headline: z.string(),
  summary: z.string(),
  source: z.string(),
  region: z.string(),
  time: z.string(),
  url: z.string(),
  featured: z.boolean().optional(),
})

export const parsedArticleSchema = newsArticleSchema.extend({
  publishedAt: z.number(),
})

export const newsArticlesResponseSchema = z.object({
  articles: z.array(newsArticleSchema),
})

export type NewsCategory = z.infer<typeof newsCategorySchema>
export type RssItem = z.infer<typeof rssItemSchema>
export type NewsArticle = z.infer<typeof newsArticleSchema>
export type ParsedArticle = z.infer<typeof parsedArticleSchema>
export type NewsArticlesResponse = z.infer<typeof newsArticlesResponseSchema>

export function parseRssItem(raw: unknown) {
  return rssItemSchema.safeParse(raw)
}

export function parseParsedArticle(raw: unknown) {
  return parsedArticleSchema.safeParse(raw)
}

export function parseNewsArticle(raw: unknown) {
  return newsArticleSchema.safeParse(raw)
}

export function parseNewsArticlesResponse(raw: unknown) {
  return newsArticlesResponseSchema.safeParse(raw)
}
