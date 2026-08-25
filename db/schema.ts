import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const memes = sqliteTable('memes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  imageKey: text('image_key').notNull().unique(),
  contentType: text('content_type').notNull().default('image/png'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_memes_created_at').on(table.createdAt)]);

export const memeTags = sqliteTable('meme_tags', {
  memeId: text('meme_id').notNull().references(() => memes.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
}, (table) => [
  primaryKey({ columns: [table.memeId, table.tag] }),
  index('idx_meme_tags_tag').on(table.tag),
]);
