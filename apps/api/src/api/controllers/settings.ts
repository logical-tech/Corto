import type { Context } from "hono";
import {
  getSettings,
  getRegistrationEnabled,
  updateSettings,
} from "../handlers/settings";
import type { UpdateSettingsInput } from "../../schemas";
import { env } from "../../env";
import type { AppEnv } from "../types";

export const registrationController = async (c: Context<AppEnv>) =>
  c.json({ enabled: await getRegistrationEnabled() });

export const authStatusController = (c: Context<AppEnv>) =>
  c.json({ passkeyEnabled: env.PASSKEY_ENABLED });

export const getSettingsController = async (c: Context<AppEnv>) =>
  c.json(await getSettings());

export const updateSettingsController = async (
  c: Context<AppEnv>,
  data: UpdateSettingsInput
) => c.json(await updateSettings(data));
