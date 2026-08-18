import { auth } from "../../auth";
import type { CreateApiKeyInput } from "../../schemas";

export const listApiKeys = (headers: Headers) =>
  auth.api.listApiKeys({ headers });

export const createApiKey = (headers: Headers, data: CreateApiKeyInput) =>
  auth.api.createApiKey({
    headers,
    body: {
      name: data.name,
      expiresIn: data.expiresIn,
    },
  });

export const deleteApiKey = (headers: Headers, keyId: string) =>
  auth.api.deleteApiKey({ headers, body: { keyId } });
