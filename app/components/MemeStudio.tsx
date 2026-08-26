'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { memeTemplates, optionalMiddleSlot, type MemeTemplate, type TextSlot } from '../lib/templates';

type Post = { id: string; title: string; imageUrl: string; contextUrl: string | null; createdAt: number; tags: string[] };
type MemeStudioProps = { initialPosts: Post[]; internalMode: boolean };

const RECENT_POST_LIMIT = 12;
const OUTPUT_WIDTH = 1080;

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number) {
  let size = startSize;
  do {
    ctx.font = `900 ${size}px Impact, Arial Black, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size > 24);
  return size;
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not render image')), 'image/png');
  });
}

function titleFromCaptions(captions: Record<string, string>) {
  return Object.values(captions).map((caption) => caption.trim()).filter(Boolean).join(' — ').slice(0, 160);
}

export function MemeStudio({ initialPosts, internalMode }: MemeStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const customImageUrlRef = useRef<string | null>(null);
  const [template, setTemplate] = useState(memeTemplates[0]);
  const [captions, setCaptions] = useState<Record<string, string>>(memeTemplates[0].defaults);
  const [showMiddle, setShowMiddle] = useState(false);
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(OUTPUT_WIDTH);
  const [imageRevision, setImageRevision] = useState(0);
  const [tags, setTags] = useState(memeTemplates[0].tags.join(', '));
  const [contextUrl, setContextUrl] = useState('');
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState('Ready to make your point');
  const [saving, setSaving] = useState(false);

  const activeSlots = useMemo(() => template.allowMiddle && showMiddle
    ? [template.slots[0], optionalMiddleSlot, ...template.slots.slice(1)]
    : template.slots, [showMiddle, template]);

  useEffect(() => {
    if (isCustomImage) return;
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setCanvasHeight(Math.round(OUTPUT_WIDTH * image.height / image.width));
      setImageRevision((current) => current + 1);
    };
    image.onerror = () => setStatus('Could not load that template');
    image.src = template.image;
  }, [isCustomImage, template]);

  useEffect(() => () => {
    if (customImageUrlRef.current) URL.revokeObjectURL(customImageUrlRef.current);
  }, []);

  const draw = useCallback(() => {
    // The revision invalidates the callback when a same-size image finishes loading.
    void imageRevision;
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    canvas.width = OUTPUT_WIDTH;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, OUTPUT_WIDTH, canvasHeight);
    ctx.drawImage(image, 0, 0, OUTPUT_WIDTH, canvasHeight);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#080808';
    ctx.fillStyle = '#fff';

    for (const slot of activeSlots) {
      const text = captions[slot.id]?.trim().toUpperCase();
      if (!text) continue;
      const maxWidth = OUTPUT_WIDTH * slot.width;
      const size = fitText(ctx, text, maxWidth, OUTPUT_WIDTH * (slot.fontSize ?? 0.076));
      ctx.lineWidth = Math.max(7, size * 0.16);
      ctx.strokeText(text, OUTPUT_WIDTH * slot.x, canvasHeight * slot.y, maxWidth);
      ctx.fillText(text, OUTPUT_WIDTH * slot.x, canvasHeight * slot.y, maxWidth);
    }
  }, [activeSlots, canvasHeight, captions, imageRevision]);

  useEffect(() => draw(), [draw]);

  const chooseTemplate = (next: MemeTemplate) => {
    if (customImageUrlRef.current) {
      URL.revokeObjectURL(customImageUrlRef.current);
      customImageUrlRef.current = null;
    }
    setIsCustomImage(false);
    setTemplate(next);
    setCaptions(next.defaults);
    setShowMiddle(false);
    setTags(next.tags.join(', '));
    setContextUrl('');
    setStatus(`${next.name} selected`);
  };

  const setCaption = (slot: TextSlot, value: string) => {
    setCaptions((current) => ({ ...current, [slot.id]: value }));
  };

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!internalMode) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Choose an image file');
      return;
    }
    if (customImageUrlRef.current) URL.revokeObjectURL(customImageUrlRef.current);
    const url = URL.createObjectURL(file);
    customImageUrlRef.current = url;
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setCanvasHeight(Math.round(OUTPUT_WIDTH * image.height / image.width));
      setIsCustomImage(true);
      setTemplate({
        id: 'custom', name: file.name, image: url, tags: ['custom'], allowMiddle: true,
        slots: [
          { id: 'top', label: 'Top text', x: 0.5, y: 0.1, width: 0.9 },
          { id: 'bottom', label: 'Bottom text', x: 0.5, y: 0.9, width: 0.9 },
        ],
        defaults: { top: '', bottom: '' },
      });
      setCaptions({ top: '', bottom: '' });
      setShowMiddle(false);
      setTags('custom');
      setImageRevision((current) => current + 1);
      setStatus(`${file.name} is ready`);
    };
    image.src = url;
    event.target.value = '';
  };

  const copyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await canvasBlob(canvas);
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Clipboard image copy unavailable');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setStatus('Image copied — paste it anywhere');
    } catch {
      setStatus('Direct copy is unavailable here — use Share image instead');
    }
  };

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasBlob(canvas);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'memegen.png';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Downloaded as a PNG');
  };

  const shareImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasBlob(canvas);
    const file = new File([blob], 'memegen.png', { type: 'image/png' });
    try {
      if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [file] }))) throw new Error('File sharing unavailable');
      await navigator.share({ files: [file], title: 'Made with memegen' });
      setStatus('Shared as an image');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await download();
    }
  };

  const publish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || saving || !internalMode) return;
    setSaving(true);
    setStatus('Creating a share link…');
    try {
      const blob = await canvasBlob(canvas);
      const form = new FormData();
      form.set('image', blob, 'meme.png');
      form.set('title', titleFromCaptions(captions) || 'A meme made with memegen');
      form.set('tags', tags);
      form.set('contextUrl', contextUrl);
      const response = await fetch('/api/memes', { method: 'POST', body: form });
      if (!response.ok) throw new Error('Publish failed');
      const result = await response.json() as { url: string; meme: Post };
      await navigator.clipboard.writeText(new URL(result.url, window.location.origin).toString());
      setPosts((current) => [result.meme, ...current.filter((post) => post.id !== result.meme.id)].slice(0, RECENT_POST_LIMIT));
      setStatus('Share link copied');
    } catch {
      setStatus('Could not publish yet — your image is still safe here');
    } finally {
      setSaving(false);
    }
  };

  const searchPosts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearching(true);
    try {
      const response = await fetch(`/api/memes?q=${encodeURIComponent(query)}&limit=${RECENT_POST_LIMIT}`);
      if (!response.ok) throw new Error('Search failed');
      const result = await response.json() as { memes: Post[] };
      setPosts(result.memes);
    } catch {
      setStatus('Search is temporarily unavailable');
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#171714]">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f5f3ee]/90 px-5 py-3 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="#studio" className="flex items-center gap-2 text-lg font-black tracking-[-0.04em]"><span className="grid size-8 place-items-center rounded-lg bg-[#ff5c35] text-white">M</span>memegen</a>
          <nav className="flex items-center gap-2 text-sm font-semibold"><a className="hidden rounded-full px-4 py-2 hover:bg-black/5 sm:block" href="#templates">Templates</a><a className="rounded-full bg-[#171714] px-4 py-2 text-white" href="#self-host">Self-host free</a></nav>
        </div>
      </header>

      <section id="studio" className="mx-auto grid max-w-7xl gap-7 px-5 py-7 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-10 lg:py-10">
        <>
        <div className="order-1 lg:col-start-1 lg:row-start-1">
          <p className="mb-3 inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-black/55">No ads · No watermark · Yours to share</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.92] tracking-[-.065em] sm:text-7xl">Make the point.<br/><span className="text-[#ff5c35]">Then make it a meme.</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-black/60 sm:text-lg">Built for phones and fast-moving group chats. Copy the actual PNG, or hand the image directly to the iOS share sheet—never a surprise link.</p>
        </div>

          <div id="templates" className="order-3 lg:col-start-1 lg:row-start-2 lg:mt-1">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-black/45">Curated library</p><h2 className="text-xl font-black tracking-[-.04em]">14 launch templates</h2></div>
              {internalMode && <><button onClick={() => fileRef.current?.click()} className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-bold hover:bg-[#fff9f5]">＋ Upload image</button><input ref={fileRef} onChange={upload} type="file" accept="image/*" className="hidden" /></>}
            </div>
            {!internalMode && <p className="mb-4 max-w-2xl text-sm leading-6 text-black/50">The public demo only uses administrator-curated images. Internal deployments can enable private uploads and publishing.</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {memeTemplates.map((item) => <button onClick={() => chooseTemplate(item)} key={item.id} className="group text-left" aria-pressed={template.id === item.id && !isCustomImage}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl bg-black/5 object-cover shadow-sm transition group-hover:-translate-y-1 group-aria-pressed:ring-4 group-aria-pressed:ring-[#ff5c35]/30" />
                <span className="mt-2 block text-sm font-bold">{item.name}</span>
              </button>)}
            </div>
          </div>
        </>

        <aside className="order-2 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="rounded-[26px] border border-black/10 bg-white p-3 shadow-[0_20px_60px_rgba(46,38,22,.13)]">
            <canvas ref={canvasRef} width={OUTPUT_WIDTH} height={canvasHeight} aria-label="Live meme preview" style={{ aspectRatio: `${OUTPUT_WIDTH} / ${canvasHeight}` }} className="w-full rounded-[18px] bg-black object-contain" />
            <div className="space-y-2 pt-3">
              {activeSlots.map((slot) => <label key={slot.id} className="block"><span className="sr-only">{slot.label}</span><input value={captions[slot.id] ?? ''} onChange={(event) => setCaption(slot, event.target.value)} maxLength={90} placeholder={slot.placeholder ?? slot.label} className={`w-full rounded-xl border border-black/10 px-4 py-3 text-base font-bold uppercase outline-none ring-[#ff5c35]/25 focus:ring-4 ${slot.id === 'middle' ? 'bg-[#fff7ee]' : 'bg-[#f5f3ee]'}`} /></label>)}
              {template.allowMiddle && (showMiddle ? <button onClick={() => { setCaption(optionalMiddleSlot, ''); setShowMiddle(false); }} className="w-full rounded-xl border border-dashed border-black/20 px-4 py-2 text-sm font-bold text-black/45">Remove middle text</button> : <button onClick={() => setShowMiddle(true)} className="w-full rounded-xl border border-dashed border-black/20 px-4 py-2 text-sm font-bold text-black/45 hover:border-[#ff5c35] hover:text-[#d94221]">＋ Add middle text</button>)}
              {internalMode && <>
                <label className="block"><span className="mb-1 block px-1 text-[11px] font-bold uppercase tracking-[.1em] text-black/45">Tags · comma separated</span><input value={tags} onChange={(event) => setTags(event.target.value)} maxLength={250} placeholder="work, reaction, launch" className="w-full rounded-xl border border-black/10 bg-[#f5f3ee] px-4 py-3 text-sm font-semibold outline-none ring-[#ff5c35]/25 focus:ring-4" /></label>
                <label className="block"><span className="mb-1 block px-1 text-[11px] font-bold uppercase tracking-[.1em] text-black/45">Context URL · optional</span><input type="url" inputMode="url" value={contextUrl} onChange={(event) => setContextUrl(event.target.value)} maxLength={2048} placeholder="https://…" spellCheck={false} className="w-full rounded-xl border border-black/10 bg-[#f5f3ee] px-4 py-3 text-sm font-semibold outline-none ring-[#ff5c35]/25 focus:ring-4" /></label>
              </>}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={copyImage} className="rounded-xl bg-[#ff5c35] px-4 py-3 text-sm font-black text-white active:scale-[.98]">Copy image</button>
                <button onClick={shareImage} className="rounded-xl bg-[#171714] px-4 py-3 text-sm font-black text-white active:scale-[.98]">Share image</button>
                <button onClick={download} className={`rounded-xl bg-[#ece9e2] px-4 py-3 text-sm font-bold active:scale-[.98] ${internalMode ? '' : 'col-span-2'}`}>Download PNG</button>
                {internalMode && <button onClick={publish} disabled={saving} className="rounded-xl border border-black/15 px-4 py-3 text-sm font-bold disabled:opacity-50 active:scale-[.98]">{saving ? 'Publishing…' : 'Copy link'}</button>}
              </div>
              <p role="status" aria-live="polite" className="min-h-5 px-1 text-center text-xs font-semibold text-black/55">{status}</p>
            </div>
          </div>
        </aside>
      </section>

      <section id="recent" className="border-t border-black/10 bg-white px-5 py-14 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-[1fr_minmax(280px,420px)] sm:items-end">
            <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-black/45">{internalMode ? 'Fresh from the community' : 'Curated by administrators'}</p><h2 className="mt-1 text-4xl font-black tracking-[-.055em]">Recent posts</h2><p className="mt-2 text-sm text-black/50">The newest {RECENT_POST_LIMIT}, searchable by caption or tag.</p></div>
            <form onSubmit={searchPosts} role="search" className="flex rounded-full border border-black/15 bg-[#f5f3ee] p-1.5 focus-within:ring-4 focus-within:ring-[#ff5c35]/15"><label className="min-w-0 flex-1"><span className="sr-only">Search posts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search captions or tags…" className="w-full bg-transparent px-4 py-2 text-sm font-semibold outline-none" /></label><button disabled={searching} className="rounded-full bg-[#171714] px-5 py-2 text-sm font-black text-white disabled:opacity-50">{searching ? 'Searching…' : 'Search'}</button></form>
          </div>
          {posts.length ? <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{posts.map((post) => <a key={post.id} href={`/m/${post.id}`} className="group overflow-hidden rounded-2xl border border-black/10 bg-[#f5f3ee] transition hover:-translate-y-1 hover:shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt={post.title} loading="lazy" className="aspect-square w-full bg-black/5 object-cover" /><div className="p-3"><h3 className="line-clamp-2 text-sm font-black leading-5">{post.title}</h3>{post.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{post.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-bold text-black/45">#{tag}</span>)}</div>}</div></a>)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-black/15 bg-[#f5f3ee] px-6 py-14 text-center"><p className="text-lg font-black">{query ? 'No posts match that search yet.' : 'No curated posts yet.'}</p><p className="mt-1 text-sm text-black/45">{internalMode ? 'Publish from the editor and it will appear here.' : 'Administrator-approved posts will appear here.'}</p></div>}
        </div>
      </section>

      <section id="self-host" className="border-t border-black/10 bg-[#171714] px-5 py-14 text-white md:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#ff8569]">For your company</p><h2 className="mt-2 max-w-3xl text-4xl font-black leading-none tracking-[-.055em] sm:text-6xl">Your memes. Your images. Your infrastructure.</h2><p className="mt-4 max-w-2xl leading-7 text-white/60">The same product is free to run inside your organization. Bring your own templates, keep generated images in your own storage, and deploy as a cloud-native container or Cloudflare Worker.</p></div><a href="/self-host" className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-[#171714]">View self-host guide</a></div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-3">{[['01', 'Own the library', 'Upload team templates and keep them private.'], ['02', 'Almost-zero ops', 'One edge app, one image bucket, one tiny database.'], ['03', 'Actually free', 'No paid enterprise gate in the source.']].map(([number, title, text]) => <div key={number} className="bg-[#171714] p-6"><span className="font-mono text-xs text-white/35">{number}</span><h3 className="mt-8 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{text}</p></div>)}</div>
      </section>
    </main>
  );
}
