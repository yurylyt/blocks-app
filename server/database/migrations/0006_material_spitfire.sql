ALTER TABLE "running_timers" ALTER COLUMN "started_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "running_timers" ALTER COLUMN "started_at" SET DEFAULT now();