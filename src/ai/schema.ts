import { z } from 'zod'

export const rankingsDailyItemSchema = z.object({
  date: z.string(),
  model_permaslug: z.string(),
  total_tokens: z.string(),
})

export const rankingsDailyResponseSchema = z.object({
  data: z.array(rankingsDailyItemSchema),
  meta: z.object({
    as_of: z.string(),
    start_date: z.string(),
    end_date: z.string(),
  }),
})

export const aiProviderShareSchema = z.object({
  id: z.string(),
  name: z.string(),
  sharePercent: z.number(),
})

export const aiModelRankSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  sharePercent: z.number(),
})

export const aiModelsResponseSchema = z.object({
  providers: z.array(aiProviderShareSchema),
  models: z.array(aiModelRankSchema),
  windowLabel: z.string(),
  asOf: z.string(),
  source: z.string(),
})

export type RankingsDailyItem = z.infer<typeof rankingsDailyItemSchema>
export type RankingsDailyResponse = z.infer<typeof rankingsDailyResponseSchema>
export type AiProviderShare = z.infer<typeof aiProviderShareSchema>
export type AiModelRank = z.infer<typeof aiModelRankSchema>
export type AiModelsResponse = z.infer<typeof aiModelsResponseSchema>

export function parseRankingsDailyResponse(raw: unknown) {
  return rankingsDailyResponseSchema.safeParse(raw)
}

export function parseAiProviderShare(raw: unknown) {
  return aiProviderShareSchema.safeParse(raw)
}

export function parseAiModelRank(raw: unknown) {
  return aiModelRankSchema.safeParse(raw)
}

export function parseAiModelsResponse(raw: unknown) {
  return aiModelsResponseSchema.safeParse(raw)
}
