export type Principal = {
  userId: string
  apiKey: boolean
  email?: string
  role?: string
}
export type AppEnv = { Variables: { principal: Principal } }
