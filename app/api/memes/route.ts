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

function normalizeContextUrl(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (value.length > 2048) return undefined;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const limit = Number(url.searchParams.get('limit') ?? 12);
  const memes = await listMemes(query, limit);
  return NextResponse.json({ memes, query });
}

export async function POST(request: Request) {
  if (process.env.DEPLOYMENT_MODE !== 'internal') {
    return NextResponse.json({ error: 'Publishing is disabled on this curated public demo.' }, { status: 403 });
  }
  const form = await request.formData();
  const image = form.get('image');
  const rawTitle = form.get('title');
  const tags = normalizeTags(form.get('tags'));
  const contextUrl = normalizeContextUrl(form.get('contextUrl'));
  if (!(image instanceof File) || image.type !== 'image/png') return NextResponse.json({ error: 'A PNG image is required.' }, { status: 400 });
  if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Images must be smaller than 8 MB.' }, { status: 413 });
  if (contextUrl === undefined) return NextResponse.json({ error: 'Context URL must be a valid HTTP or HTTPS URL.' }, { status: 400 });

  const id = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  const imageKey = `memes/${id}.png`;
  const title = typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim().slice(0, 160) : 'A meme made with memegen';

  await env.FILES.put(imageKey, image.stream(), {
    httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { memeId: id },
  });
  try {
    await createMemeMetadata({ id, title, imageKey, contextUrl, tags });
  } catch (error) {
    await env.FILES.delete(imageKey);
    throw error;
  }
  return NextResponse.json({
    id,
    url: `/m/${id}`,
    meme: { id, title, imageUrl: `/api/images/${imageKey}`, contextUrl, createdAt: Date.now(), tags },
  }, { status: 201 });
}
