import { eq } from "drizzle-orm";
import { db } from "../../db";
import { appSettings } from "../../db/schema";
import type { UpdateSettingsInput } from "../../schemas";
import { decryptSecret, encryptSecret } from "../../secrets";

export const getSettings = async () => {
  const [settings] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, 1));
  return {
    registrationEnabled: settings?.registrationEnabled !== false,
    discordConfigured: Boolean(settings?.discordWebhookUrl),
    telegramConfigured: Boolean(
      settings?.telegramBotToken && settings.telegramChatId
    ),
  };
};

export const getRegistrationEnabled = async () => {
  const [settings] = await db
    .select({ enabled: appSettings.registrationEnabled })
    .from(appSettings)
    .where(eq(appSettings.id, 1));
  return settings?.enabled !== false;
};

export const getNotificationSettings = async () => {
  const [settings] = await db
    .select({
      discordWebhookUrl: appSettings.discordWebhookUrl,
      telegramBotToken: appSettings.telegramBotToken,
      telegramChatId: appSettings.telegramChatId,
    })
    .from(appSettings)
    .where(eq(appSettings.id, 1));
  return {
    discordWebhookUrl: decryptSecret(settings?.discordWebhookUrl ?? null),
    telegramBotToken: decryptSecret(settings?.telegramBotToken ?? null),
    telegramChatId: decryptSecret(settings?.telegramChatId ?? null),
  };
};

export const updateSettings = async (data: UpdateSettingsInput) => {
  const values: Partial<typeof appSettings.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (Object.hasOwn(data, "registrationEnabled")) {
    values.registrationEnabled = data.registrationEnabled;
  }
  if (Object.hasOwn(data, "discordWebhookUrl")) {
    values.discordWebhookUrl = data.discordWebhookUrl
      ? encryptSecret(data.discordWebhookUrl)
      : null;
  }
  if (Object.hasOwn(data, "telegramBotToken")) {
    values.telegramBotToken = data.telegramBotToken
      ? encryptSecret(data.telegramBotToken)
      : null;
    values.telegramChatId = data.telegramChatId
      ? encryptSecret(data.telegramChatId)
      : null;
  }
  await db.update(appSettings).set(values).where(eq(appSettings.id, 1));
  return getSettings();
};
