import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { createMemeMetadata, listMemes } from '@/db/memes';

export const runtime = 'edge';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function normalizeTags(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return [];
  return [...new Set(value
    .split(',')
    .map((tag) => tag.normalize('NFKC').trim().toLocaleLowerCase().replace(/^#/, ''))
    .filter((tag) => tag.length > 0 && tag.length <= 32))]
    .slice(0, 10);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const limit = Number(url.searchParams.get('limit') ?? 12);
  const memes = await listMemes(query, limit);
  return NextResponse.json({ memes, query });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const image = form.get('image');
  const rawTitle = form.get('title');
  const tags = normalizeTags(form.get('tags'));
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
    await createMemeMetadata({ id, title, imageKey, tags });
  } catch (error) {
    await env.FILES.delete(imageKey);
    throw error;
  }
  return NextResponse.json({
    id,
    url: `/m/${id}`,
    meme: { id, title, imageUrl: `/api/images/${imageKey}`, createdAt: Date.now(), tags },
  }, { status: 201 });
}
