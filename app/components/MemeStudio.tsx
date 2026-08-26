'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';

type Theme = {
  id: string;
  name: string;
  emoji: string;
  colors: [string, string];
  top: string;
  bottom: string;
};

type Post = {
  id: string;
  title: string;
  imageUrl: string;
  contextUrl: string | null;
  createdAt: number;
  tags: string[];
};

const RECENT_POST_LIMIT = 12;

const themes: Theme[] = [
  { id: 'launch', name: 'The launch', emoji: '🚀', colors: ['#4428d7', '#ff8062'], top: 'WHEN THE DEPLOY', bottom: 'WORKS FIRST TRY' },
  { id: 'ship', name: 'Ship it', emoji: '🫡', colors: ['#07594f', '#62cda8'], top: 'LOOKS GOOD', bottom: 'SHIP IT' },
  { id: 'on-call', name: 'On call', emoji: '🔥', colors: ['#ab331f', '#ffb347'], top: 'ME CHECKING SLACK', bottom: 'AFTER “ONE SMALL CHANGE”' },
  { id: 'brain', name: 'Big brain', emoji: '🧠', colors: ['#153b9a', '#75b9ff'], top: 'THE FIX WAS', bottom: 'CLEARING THE CACHE' },
];

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number) {
  let size = startSize;
  do {
    ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size > 30);
  return size;
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not render image')), 'image/png');
  });
}

export function MemeStudio({ initialPosts }: { initialPosts: Post[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [theme, setTheme] = useState(themes[0]);
  const [top, setTop] = useState(themes[0].top);
  const [middle, setMiddle] = useState('');
  const [bottom, setBottom] = useState(themes[0].bottom);
  const [showMiddle, setShowMiddle] = useState(false);
  const [tags, setTags] = useState('deploy, engineering');
  const [contextUrl, setContextUrl] = useState('');
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState('Ready to make your point');
  const [saving, setSaving] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 1080;
    ctx.clearRect(0, 0, size, size);

    if (imageRef.current) {
      const image = imageRef.current;
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      const shade = ctx.createLinearGradient(0, 0, 0, size);
      shade.addColorStop(0, 'rgba(0,0,0,.44)');
      shade.addColorStop(.42, 'rgba(0,0,0,0)');
      shade.addColorStop(1, 'rgba(0,0,0,.5)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, size, size);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, theme.colors[0]);
      gradient.addColorStop(1, theme.colors[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.beginPath();
      ctx.arc(860, 260, 250, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '220px Apple Color Emoji, Segoe UI Emoji';
      ctx.textAlign = 'center';
      ctx.fillText(theme.emoji, 540, 635);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#090909';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 18;

    const topText = top.trim().toUpperCase() || 'YOUR TEXT';
    fitText(ctx, topText, 970, 82);
    ctx.strokeText(topText, 540, 105, 970);
    ctx.fillText(topText, 540, 105, 970);

    const middleText = middle.trim().toUpperCase();
    if (middleText) {
      fitText(ctx, middleText, 900, 70);
      ctx.strokeText(middleText, 540, 540, 900);
      ctx.fillText(middleText, 540, 540, 900);
    }

    const bottomText = bottom.trim().toUpperCase() || 'GOES HERE';
    fitText(ctx, bottomText, 970, 82);
    ctx.strokeText(bottomText, 540, 940, 970);
    ctx.fillText(bottomText, 540, 940, 970);

    ctx.fillStyle = 'rgba(10,10,10,.42)';
    roundedRect(ctx, 844, 1000, 190, 44, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '700 22px Arial, Helvetica, sans-serif';
    ctx.fillText('memegen', 939, 1023);
  }, [bottom, middle, theme, top]);

  useEffect(() => draw(), [draw]);

  const chooseTheme = (next: Theme) => {
    imageRef.current = null;
    setTheme(next);
    setTop(next.top);
    setMiddle('');
    setShowMiddle(false);
    setBottom(next.bottom);
    setTags(`${next.id}, ${next.name.toLocaleLowerCase()}`);
    setStatus(`${next.name} selected`);
  };

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Choose an image file');
      return;
    }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      imageRef.current = image;
      draw();
      URL.revokeObjectURL(url);
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
    if (!canvas || saving) return;
    setSaving(true);
    setStatus('Creating a share link…');
    try {
      const blob = await canvasBlob(canvas);
      const form = new FormData();
      form.set('image', blob, 'meme.png');
      form.set('title', [top, middle, bottom].filter(Boolean).join(' — ').slice(0, 160));
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
          <a href="#studio" className="flex items-center gap-2 text-lg font-black tracking-[-0.04em]">
            <span className="grid size-8 place-items-center rounded-lg bg-[#ff5c35] text-white">M</span>memegen
          </a>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <a className="hidden rounded-full px-4 py-2 hover:bg-black/5 sm:block" href="#templates">Templates</a>
            <a className="rounded-full bg-[#171714] px-4 py-2 text-white" href="#self-host">Self-host free</a>
          </nav>
        </div>
      </header>

      <section id="studio" className="mx-auto grid max-w-7xl gap-7 px-5 py-7 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-10 lg:py-10">
        <div>
          <p className="mb-3 inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-black/55">No ads · No watermark · Yours to share</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.92] tracking-[-.065em] sm:text-7xl">Make the point.<br/><span className="text-[#ff5c35]">Then make it a meme.</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-black/60 sm:text-lg">Built for phones and fast-moving group chats. Copy the actual PNG, or hand the image directly to the iOS share sheet—never a surprise link.</p>

          <div id="templates" className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-black/45">Pick a starting point</p><h2 className="text-xl font-black tracking-[-.04em]">Templates</h2></div>
              <button onClick={() => fileRef.current?.click()} className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-bold hover:bg-[#fff9f5]">＋ Upload image</button>
              <input ref={fileRef} onChange={upload} type="file" accept="image/*" className="hidden" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {themes.map((item) => (
                <button onClick={() => chooseTheme(item)} key={item.id} className="group text-left" aria-pressed={theme.id === item.id && !imageRef.current}>
                  <span style={{ background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})` }} className="grid aspect-[4/3] place-items-center rounded-2xl text-5xl shadow-sm transition group-hover:-translate-y-1 group-aria-pressed:ring-4 group-aria-pressed:ring-[#ff5c35]/30">{item.emoji}</span>
                  <span className="mt-2 block text-sm font-bold">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[26px] border border-black/10 bg-white p-3 shadow-[0_20px_60px_rgba(46,38,22,.13)]">
            <canvas ref={canvasRef} width="1080" height="1080" aria-label="Live meme preview" className="aspect-square w-full rounded-[18px] bg-black object-cover" />
            <div className="space-y-2 pt-3">
              <label className="block"><span className="sr-only">Top text</span><input value={top} onChange={(event) => setTop(event.target.value)} maxLength={90} placeholder="Top text" className="w-full rounded-xl border border-black/10 bg-[#f5f3ee] px-4 py-3 text-base font-bold uppercase outline-none ring-[#ff5c35]/25 focus:ring-4" /></label>
              {showMiddle ? (
                <div className="flex gap-2"><label className="block min-w-0 flex-1"><span className="sr-only">Middle text</span><input autoFocus value={middle} onChange={(event) => setMiddle(event.target.value)} maxLength={90} placeholder="Middle text (optional)" className="w-full rounded-xl border border-black/10 bg-[#fff7ee] px-4 py-3 text-base font-bold uppercase outline-none ring-[#ff5c35]/25 focus:ring-4" /></label><button onClick={() => { setMiddle(''); setShowMiddle(false); }} aria-label="Remove middle text" className="rounded-xl border border-black/10 px-4 text-lg font-bold text-black/45">×</button></div>
              ) : <button onClick={() => setShowMiddle(true)} className="w-full rounded-xl border border-dashed border-black/20 px-4 py-2 text-sm font-bold text-black/45 hover:border-[#ff5c35] hover:text-[#d94221]">＋ Add middle text</button>}
              <label className="block"><span className="sr-only">Bottom text</span><input value={bottom} onChange={(event) => setBottom(event.target.value)} maxLength={90} placeholder="Bottom text" className="w-full rounded-xl border border-black/10 bg-[#f5f3ee] px-4 py-3 text-base font-bold uppercase outline-none ring-[#ff5c35]/25 focus:ring-4" /></label>
              <label className="block"><span className="mb-1 block px-1 text-[11px] font-bold uppercase tracking-[.1em] text-black/45">Tags · comma separated</span><input value={tags} onChange={(event) => setTags(event.target.value)} maxLength={250} placeholder="work, reaction, launch" className="w-full rounded-xl border border-black/10 bg-[#f5f3ee] px-4 py-3 text-sm font-semibold outline-none ring-[#ff5c35]/25 focus:ring-4" /></label>
              <label className="block"><span className="mb-1 block px-1 text-[11px] font-bold uppercase tracking-[.1em] text-black/45">Context URL · optional</span><input type="url" inputMode="url" value={contextUrl} onChange={(event) => setContextUrl(event.target.value)} maxLength={2048} placeholder="https://…" spellCheck={false} className="w-full rounded-xl border border-black/10 bg-[#f5f3ee] px-4 py-3 text-sm font-semibold outline-none ring-[#ff5c35]/25 focus:ring-4" /></label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={copyImage} className="rounded-xl bg-[#ff5c35] px-4 py-3 text-sm font-black text-white active:scale-[.98]">Copy image</button>
                <button onClick={shareImage} className="rounded-xl bg-[#171714] px-4 py-3 text-sm font-black text-white active:scale-[.98]">Share image</button>
                <button onClick={download} className="rounded-xl bg-[#ece9e2] px-4 py-3 text-sm font-bold active:scale-[.98]">Download PNG</button>
                <button onClick={publish} disabled={saving} className="rounded-xl border border-black/15 px-4 py-3 text-sm font-bold disabled:opacity-50 active:scale-[.98]">{saving ? 'Publishing…' : 'Copy link'}</button>
              </div>
              <p role="status" aria-live="polite" className="min-h-5 px-1 text-center text-xs font-semibold text-black/55">{status}</p>
            </div>
          </div>
        </aside>
      </section>

      <section id="recent" className="border-t border-black/10 bg-white px-5 py-14 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-[1fr_minmax(280px,420px)] sm:items-end">
            <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-black/45">Fresh from the community</p><h2 className="mt-1 text-4xl font-black tracking-[-.055em]">Recent posts</h2><p className="mt-2 text-sm text-black/50">The newest {RECENT_POST_LIMIT}, searchable by caption or tag.</p></div>
            <form onSubmit={searchPosts} role="search" className="flex rounded-full border border-black/15 bg-[#f5f3ee] p-1.5 focus-within:ring-4 focus-within:ring-[#ff5c35]/15">
              <label className="min-w-0 flex-1"><span className="sr-only">Search posts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search captions or tags…" className="w-full bg-transparent px-4 py-2 text-sm font-semibold outline-none" /></label>
              <button disabled={searching} className="rounded-full bg-[#171714] px-5 py-2 text-sm font-black text-white disabled:opacity-50">{searching ? 'Searching…' : 'Search'}</button>
            </form>
          </div>

          {posts.length ? <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => <a key={post.id} href={`/m/${post.id}`} className="group overflow-hidden rounded-2xl border border-black/10 bg-[#f5f3ee] transition hover:-translate-y-1 hover:shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}<img src={post.imageUrl} alt={post.title} loading="lazy" className="aspect-square w-full bg-black/5 object-cover" />
              <div className="p-3"><h3 className="line-clamp-2 text-sm font-black leading-5">{post.title}</h3>{post.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{post.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-bold text-black/45">#{tag}</span>)}</div>}</div>
            </a>)}
          </div> : <div className="mt-7 rounded-2xl border border-dashed border-black/15 bg-[#f5f3ee] px-6 py-14 text-center"><p className="text-lg font-black">{query ? 'No posts match that search yet.' : 'The feed is ready for its first meme.'}</p><p className="mt-1 text-sm text-black/45">Publish from the editor and it will appear here.</p></div>}
        </div>
      </section>

      <section id="self-host" className="border-t border-black/10 bg-[#171714] px-5 py-14 text-white md:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#ff8569]">For your company</p><h2 className="mt-2 max-w-3xl text-4xl font-black leading-none tracking-[-.055em] sm:text-6xl">Your memes. Your images. Your infrastructure.</h2><p className="mt-4 max-w-2xl leading-7 text-white/60">The same product is free to run inside your organization. Bring your own templates, keep generated images in your own storage, and deploy to Cloudflare’s edge.</p></div>
          <a href="/self-host" className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-[#171714]">View self-host guide</a>
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-3">
          {[['01', 'Own the library', 'Upload team templates and keep them private.'], ['02', 'Almost-zero ops', 'One edge app, one image bucket, one tiny database.'], ['03', 'Actually free', 'No paid enterprise gate in the source.']].map(([number, title, text]) => <div key={number} className="bg-[#171714] p-6"><span className="font-mono text-xs text-white/35">{number}</span><h3 className="mt-8 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{text}</p></div>)}
        </div>
      </section>
    </main>
  );
}
