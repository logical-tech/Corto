ALTER TABLE "apikey" ALTER COLUMN "rateLimitTimeWindow" SET DEFAULT 60000;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "rateLimitMax" SET DEFAULT 120;--> statement-breakpoint
UPDATE "apikey" SET "rateLimitTimeWindow" = 60000, "rateLimitMax" = 120 WHERE "rateLimitTimeWindow" = 86400000 AND "rateLimitMax" = 10;
