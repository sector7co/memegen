CREATE TABLE `meme_tags` (
	`meme_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`meme_id`, `tag`),
	FOREIGN KEY (`meme_id`) REFERENCES `memes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_meme_tags_tag` ON `meme_tags` (`tag`);--> statement-breakpoint
CREATE INDEX `idx_memes_created_at` ON `memes` (`created_at`);--> statement-breakpoint
PRAGMA optimize;
