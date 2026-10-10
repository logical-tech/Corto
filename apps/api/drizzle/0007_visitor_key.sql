ALTER TABLE "link_clicks" ADD COLUMN "visitor_key" varchar(64);--> statement-breakpoint
ALTER TABLE "link_clicks" ADD COLUMN "bot" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "link_clicks" SET "bot" = true WHERE "user_agent" IS NULL OR "user_agent" ~* '(?<!cu)bot|crawl|spider|slurp|preview|scanner|headless|phantom|lighthouse|facebookexternalhit|whatsapp|embedly|vkshare|ms-office|microsoft office|curl|wget|python|httpx|aiohttp|go-http-client|okhttp|axios|node-fetch|undici|java\/|libwww|scrapy|postman|insomnia|monitor|uptime|pingdom|validator';--> statement-breakpoint
UPDATE "short_links" l SET "clicks" = (SELECT count(*) FROM "link_clicks" c WHERE c."link_id" = l."id" AND NOT c."bot");
