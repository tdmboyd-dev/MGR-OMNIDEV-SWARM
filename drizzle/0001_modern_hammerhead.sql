CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`objective` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`phase` text NOT NULL,
	`payload` text NOT NULL,
	`result` text DEFAULT '{}' NOT NULL,
	`attempts` text DEFAULT '0' NOT NULL,
	`lease_token` text,
	`lease_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_jobs_status_created` ON `jobs` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `runtime_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
