import { env } from 'cloudflare:workers';

export type MemeRecord = {
  id: string;
  title: string;
  image_key: string;
  context_url: string | null;
  created_at: number;
  tags: string;
};

export type MemeSummary = {
  id: string;
  title: string;
  imageUrl: string;
  contextUrl: string | null;
  createdAt: number;
  tags: string[];
};

function toSummary(row: MemeRecord): MemeSummary {
  return {
    id: row.id,
    title: row.title,
    imageUrl: `/api/images/${row.image_key}`,
    contextUrl: row.context_url,
    createdAt: row.created_at,
    tags: row.tags ? row.tags.split('|') : [],
  };
}

function escapeLike(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

export async function listMemes(query = '', requestedLimit = 12) {
  const limit = Math.min(Math.max(Math.floor(requestedLimit) || 12, 1), 30);
  const normalized = query.trim().toLocaleLowerCase().slice(0, 80);
  const pattern = `%${escapeLike(normalized)}%`;
  const result = await env.DB.prepare(
    `SELECT m.id, m.title, m.image_key, m.context_url, m.created_at,
            COALESCE(GROUP_CONCAT(mt.tag, '|'), '') AS tags
     FROM memes m
     LEFT JOIN meme_tags mt ON mt.meme_id = m.id
     WHERE (? = '' OR LOWER(m.title) LIKE ? ESCAPE '\\'
       OR EXISTS (
         SELECT 1 FROM meme_tags matched
         WHERE matched.meme_id = m.id
           AND LOWER(matched.tag) LIKE ? ESCAPE '\\'
       ))
     GROUP BY m.id, m.title, m.image_key, m.context_url, m.created_at
     ORDER BY m.created_at DESC
     LIMIT ?`,
  ).bind(normalized, pattern, pattern, limit).all<MemeRecord>();
  return result.results.map(toSummary);
}

export async function getMeme(id: string) {
  if (!/^[a-z0-9]{12}$/.test(id)) return null;
  return env.DB.prepare(
    `SELECT m.id, m.title, m.image_key, m.context_url, m.created_at,
            COALESCE(GROUP_CONCAT(mt.tag, '|'), '') AS tags
     FROM memes m
     LEFT JOIN meme_tags mt ON mt.meme_id = m.id
     WHERE m.id = ?
     GROUP BY m.id, m.title, m.image_key, m.context_url, m.created_at
     LIMIT 1`,
  ).bind(id).first<MemeRecord>();
}

export async function createMemeMetadata(input: {
  id: string;
  title: string;
  imageKey: string;
  contextUrl: string | null;
  tags: string[];
}) {
  const statements = [
    env.DB.prepare('INSERT INTO memes (id, title, image_key, content_type, context_url, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(input.id, input.title, input.imageKey, 'image/png', input.contextUrl, Date.now()),
    ...input.tags.map((tag) => env.DB.prepare('INSERT INTO meme_tags (meme_id, tag) VALUES (?, ?)').bind(input.id, tag)),
  ];
  await env.DB.batch(statements);
}
