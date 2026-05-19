ALTER TABLE "entries" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "second_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "second_ended_at" timestamp with time zone;