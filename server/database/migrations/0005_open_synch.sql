CREATE TABLE "running_timers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "running_timers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"activity_id" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"started_date" text NOT NULL,
	"half" integer DEFAULT 1 NOT NULL,
	"first_entry_id" integer
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "chime_sound" text DEFAULT 'chime-1' NOT NULL;--> statement-breakpoint
ALTER TABLE "running_timers" ADD CONSTRAINT "running_timers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "running_timers" ADD CONSTRAINT "running_timers_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "running_timers" ADD CONSTRAINT "running_timers_first_entry_id_entries_id_fk" FOREIGN KEY ("first_entry_id") REFERENCES "public"."entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "running_timers_user_unique" ON "running_timers" USING btree ("user_id");