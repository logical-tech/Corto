import { env } from "../../env";
import { getNotificationSettings } from "./settings";

type Milestone = { clicks: number };

const request = async (url: string, body: unknown) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok)
    throw new Error(`Notification request failed (${response.status})`);
};

export const notifyGoalMilestones = async ({
  slug,
  milestones,
}: {
  slug: string;
  milestones: Milestone[];
}) => {
  const settings = await getNotificationSettings();
  if (!settings.discordWebhookUrl && !settings.telegramBotToken) return;

  const shortUrl = `${env.SHORT_URL_BASE}/${slug}`;
  const goals = milestones.map(({ clicks }) => `${clicks} click`).join(", ");
  const text = `Shorts milestone reached: ${shortUrl} reached ${goals}.`;
  const notifications = [
    settings.discordWebhookUrl
      ? request(settings.discordWebhookUrl, {
          content: text,
          allowed_mentions: { parse: [] },
        })
      : null,
    settings.telegramBotToken && settings.telegramChatId
      ? request(
          `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`,
          {
            chat_id: settings.telegramChatId,
            text,
            disable_web_page_preview: true,
          }
        )
      : null,
  ].filter((notification): notification is Promise<void> =>
    Boolean(notification)
  );

  const results = await Promise.allSettled(notifications);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Milestone notification failed", result.reason);
    }
  }
};
