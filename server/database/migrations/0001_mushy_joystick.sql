ALTER TABLE "activities" ALTER COLUMN "color" SET DEFAULT '#64748b';--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "activity_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "name" text;