import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const memes = sqliteTable('memes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  imageKey: text('image_key').notNull().unique(),
  contentType: text('content_type').notNull().default('image/png'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
