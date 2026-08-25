CREATE TABLE `memes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`image_key` text NOT NULL,
	`content_type` text DEFAULT 'image/png' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memes_image_key_unique` ON `memes` (`image_key`);