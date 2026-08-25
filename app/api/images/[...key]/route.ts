import { env } from 'cloudflare:workers';

export const runtime = 'edge';

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await context.params;
  const key = segments.join('/');
  if (!/^memes\/[a-z0-9]+\.png$/.test(key)) return new Response('Not found', { status: 404 });
  const object = await env.FILES.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('content-disposition', 'inline; filename="meme.png"');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(object.body, { headers });
}
