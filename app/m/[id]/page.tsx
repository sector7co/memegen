import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMeme } from '@/db/memes';

export const runtime = 'edge';
function trustedOrigin() { return process.env.SITE_ORIGIN ?? 'http://localhost:3000'; }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const meme = await getMeme(id);
  if (!meme) return { title: 'Meme not found — memegen', openGraph: { images: [] }, twitter: { images: [] } };
  const image = new URL(`/api/images/${meme.image_key}`, trustedOrigin()).toString();
  const title = `${meme.title} — memegen`;
  const description = 'Made with memegen. No ads, no watermark.';
  return {
    title, description,
    openGraph: { title, description, type: 'website', images: [{ url: image, width: 1080, height: 1080, alt: meme.title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function MemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meme = await getMeme(id);
  if (!meme) notFound();
  const image = `/api/images/${meme.image_key}`;
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f3ee] px-5 py-10 text-[#171714]">
      <article className="w-full max-w-2xl">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-lg font-black tracking-[-0.04em]"><span className="grid size-8 place-items-center rounded-lg bg-[#ff5c35] text-white">M</span>memegen</Link>
        <div className="rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_20px_60px_rgba(46,38,22,.13)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={meme.title} width="1080" height="1080" className="aspect-square w-full rounded-[20px] object-cover" />
          <div className="grid grid-cols-2 gap-2 pt-3">
            <a href={image} download="memegen.png" className="rounded-xl bg-[#ff5c35] px-4 py-3 text-center text-sm font-black text-white">Download image</a>
            <Link href="/" className="rounded-xl bg-[#171714] px-4 py-3 text-center text-sm font-black text-white">Make your own</Link>
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-[-.04em]">{meme.title}</h1>
        {meme.tags && <div className="mt-3 flex flex-wrap gap-2">{meme.tags.split('|').map((tag) => <span key={tag} className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/55">#{tag}</span>)}</div>}
        {meme.context_url && <a href={meme.context_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-black hover:border-[#ff5c35] hover:text-[#d94221]">View context ↗</a>}
        <p className="mt-1 text-sm text-black/50">Made with memegen. No ads, no watermark.</p>
      </article>
    </main>
  );
}
