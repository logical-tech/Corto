import type { Context } from "hono";
import type { CreateApiKeyInput } from "../../schemas";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
} from "../handlers/api-keys";
import { presentApiKey } from "../presenters";
import type { AppEnv } from "../types";

export const listApiKeysController = async (c: Context<AppEnv>) => {
  const result = await listApiKeys(c.req.raw.headers);
  return c.json({ keys: result.apiKeys.map((key) => presentApiKey(key)) });
};

export const createApiKeyController = async (
  c: Context<AppEnv>,
  data: CreateApiKeyInput,
) => {
  const key = await createApiKey(c.req.raw.headers, data);
  return c.json({ apiKey: presentApiKey(key, true) }, 201);
};

export const deleteApiKeyController = async (c: Context<AppEnv>, id: string) => {
  await deleteApiKey(c.req.raw.headers, id);
  return c.body(null, 204);
};
