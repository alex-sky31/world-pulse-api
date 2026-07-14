import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pg from 'pg'
import { getDbPool } from '../db.ts'
import { BCRYPT_ROUNDS, JWT_EXPIRES_IN } from './constant.ts'
import type { AuthResponse, AuthUser, LoginBody, RegisterBody } from './schema.ts'
import { parseAuthResponse } from './schema.ts'

type UserRow = {
  id: string
  email: string
  display_name: string
  password_hash: string
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return secret
}

function toAuthUser(row: Pick<UserRow, 'id' | 'email' | 'display_name'>): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  }
}

function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  })
}

function buildAuthResponse(user: AuthUser): AuthResponse {
  const payload = parseAuthResponse({
    user,
    token: signToken(user),
  })

  if (!payload.success) {
    throw new Error('Invalid auth response payload')
  }

  return payload.data
}

export async function registerUser(input: RegisterBody): Promise<AuthResponse> {
  const pool = getDbPool()
  if (!pool) {
    throw new Error('Database not configured')
  }

  getJwtSecret()

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const email = input.email.toLowerCase()

  try {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, password_hash`,
      [email, passwordHash, input.displayName],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Failed to create user')
    }

    return buildAuthResponse(toAuthUser(row))
  } catch (error) {
    if (error instanceof pg.DatabaseError && error.code === '23505') {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }
    throw error
  }
}

export async function loginUser(input: LoginBody): Promise<AuthResponse> {
  const pool = getDbPool()
  if (!pool) {
    throw new Error('Database not configured')
  }

  getJwtSecret()

  const email = input.email.toLowerCase()
  const result = await pool.query<UserRow>(
    `SELECT id, email, display_name, password_hash
     FROM users
     WHERE email = $1`,
    [email],
  )

  const row = result.rows[0]
  if (!row) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const valid = await bcrypt.compare(input.password, row.password_hash)
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  return buildAuthResponse(toAuthUser(row))
}
