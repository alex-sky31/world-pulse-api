import { z } from 'zod'

export const registerBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(2).max(50),
})

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
})

export const authResponseSchema = z.object({
  user: authUserSchema,
  token: z.string(),
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>

export function parseRegisterBody(raw: unknown) {
  return registerBodySchema.safeParse(raw)
}

export function parseLoginBody(raw: unknown) {
  return loginBodySchema.safeParse(raw)
}

export function parseAuthResponse(raw: unknown) {
  return authResponseSchema.safeParse(raw)
}
