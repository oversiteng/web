ALTER TABLE "users" ADD COLUMN "nin_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nba_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX "notifications_task_idx" ON "notifications" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "outbound_emails_user_idx" ON "outbound_emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_user_created_idx" ON "payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_gateway_ref_idx" ON "payments" USING btree ("gateway_ref");--> statement-breakpoint
CREATE INDEX "payout_transactions_wallet_idx" ON "payout_transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "payout_transactions_agent_created_idx" ON "payout_transactions" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "task_chats_task_created_idx" ON "task_chats" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "task_chats_receiver_idx" ON "task_chats" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "task_reports_status_idx" ON "task_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_property_idx" ON "tasks" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "tasks_agent_status_idx" ON "tasks" USING btree ("agent_id","status");--> statement-breakpoint
CREATE INDEX "tasks_user_status_idx" ON "tasks" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");