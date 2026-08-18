CREATE TABLE "link_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text NOT NULL,
	"clicks" bigint NOT NULL,
	"reached_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "discord_webhook_url" text;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "telegram_bot_token" text;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "telegram_chat_id" text;--> statement-breakpoint
ALTER TABLE "link_goals" ADD CONSTRAINT "link_goals_link_id_short_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."short_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "link_goals_link_clicks_unique" ON "link_goals" USING btree ("link_id","clicks");--> statement-breakpoint
CREATE INDEX "link_goals_link_clicks_idx" ON "link_goals" USING btree ("link_id","clicks");