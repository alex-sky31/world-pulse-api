import { z } from 'zod'

export const datacenterTypeSchema = z.enum([
  'hyperscaler',
  'colocation',
  'enterprise',
])

export const datacenterStatusSchema = z.enum([
  'operational',
  'degraded',
  'outage',
])

export const datacenterSchema = z.object({
  id: z.string(),
  provider: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  city: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  type: datacenterTypeSchema.optional(),
  status: datacenterStatusSchema.optional(),
  capacityMw: z.number().optional(),
  notes: z.string().optional(),
})

export const datacentersDataSchema = z.object({
  datacenters: z.array(datacenterSchema),
})

export const datacentersResponseSchema = datacentersDataSchema.extend({
  updatedAt: z.string(),
})

export type DatacenterType = z.infer<typeof datacenterTypeSchema>
export type DatacenterStatus = z.infer<typeof datacenterStatusSchema>
export type Datacenter = z.infer<typeof datacenterSchema>
export type DatacentersResponse = z.infer<typeof datacentersResponseSchema>

export function parseDatacenter(raw: unknown) {
  return datacenterSchema.safeParse(raw)
}

export function parseDatacentersData(raw: unknown) {
  return datacentersDataSchema.safeParse(raw)
}

export function parseDatacentersResponse(raw: unknown) {
  return datacentersResponseSchema.safeParse(raw)
}
