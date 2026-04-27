ALTER TABLE "running_timers" ALTER COLUMN "activity_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "running_timers" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "running_timers" ADD CONSTRAINT "running_timers_activity_xor_name" CHECK (("running_timers"."activity_id" IS NULL) <> ("running_timers"."name" IS NULL));