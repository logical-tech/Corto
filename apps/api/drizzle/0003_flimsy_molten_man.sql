CREATE TABLE "advertising_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"delay_seconds" smallint DEFAULT 5 NOT NULL,
	"provider" varchar(32) DEFAULT 'adsterra' NOT NULL,
	"adsterra_banners" text DEFAULT '[]' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advertising_settings_delay_seconds" CHECK ("advertising_settings"."delay_seconds" BETWEEN 1 AND 60)
);
--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "ad_free" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "advertising_settings" ADD CONSTRAINT "advertising_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;