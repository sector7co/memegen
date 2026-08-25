import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData();
  const image = form.get('image');
  const rawTitle = form.get('title');
  if (!(image instanceof File) || image.type !== 'image/png') return NextResponse.json({ error: 'A PNG image is required.' }, { status: 400 });
  if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Images must be smaller than 8 MB.' }, { status: 413 });

  const id = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  const imageKey = `memes/${id}.png`;
  const title = typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim().slice(0, 160) : 'A meme made with memegen';

  await env.FILES.put(imageKey, image.stream(), {
    httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { memeId: id },
  });
  try {
    await env.DB.prepare(`INSERT INTO memes (id, title, image_key, content_type, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, title, imageKey, 'image/png', Date.now()).run();
  } catch (error) {
    await env.FILES.delete(imageKey);
    throw error;
  }
  return NextResponse.json({ id, url: `/m/${id}` }, { status: 201 });
}
