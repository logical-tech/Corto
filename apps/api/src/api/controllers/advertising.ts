import type { Context } from "hono"
import {
  getAdvertisingSettings,
  updateAdvertisingSettings,
} from "../handlers/advertising"
import type { UpdateAdvertisingSettingsInput } from "../../schemas"
import type { AppEnv } from "../types"

export const getAdvertisingSettingsController = async (c: Context<AppEnv>) =>
  c.json(await getAdvertisingSettings(c.var.principal.userId))

export const updateAdvertisingSettingsController = async (
  c: Context<AppEnv>,
  data: UpdateAdvertisingSettingsInput
) => c.json(await updateAdvertisingSettings(c.var.principal.userId, data))
