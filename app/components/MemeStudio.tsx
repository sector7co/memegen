'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

type Theme = {
  id: string;
  name: string;
  emoji: string;
  colors: [string, string];
  top: string;
  bottom: string;
};

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

export function MemeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [theme, setTheme] = useState(themes[0]);
  const [top, setTop] = useState(themes[0].top);
  const [bottom, setBottom] = useState(themes[0].bottom);
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

    const bottomText = bottom.trim().toUpperCase() || 'GOES HERE';
    fitText(ctx, bottomText, 970, 82);
    ctx.strokeText(bottomText, 540, 940, 970);
    ctx.fillText(bottomText, 540, 940, 970);

    ctx.fillStyle = 'rgba(10,10,10,.42)';
    roundedRect(ctx, 844, 1000, 190, 44, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '700 22px Arial, Helvetica, sans-serif';
    ctx.fillText('memegen', 939, 1023);
  }, [bottom, theme, top]);

  useEffect(() => draw(), [draw]);

  const chooseTheme = (next: Theme) => {
    imageRef.current = null;
    setTheme(next);
    setTop(next.top);
    setBottom(next.bottom);
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
      form.set('title', [top, bottom].filter(Boolean).join(' — ').slice(0, 160));
      const response = await fetch('/api/memes', { method: 'POST', body: form });
      if (!response.ok) throw new Error('Publish failed');
      const result = await response.json() as { url: string };
      await navigator.clipboard.writeText(new URL(result.url, window.location.origin).toString());
      setStatus('Share link copied');
    } catch {
      setStatus('Could not publish yet — your image is still safe here');
    } finally {
      setSaving(false);
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
              <label className="block"><span className="sr-only">Bottom text</span><input value={bottom} onChange={(event) => setBottom(event.target.value)} maxLength={90} placeholder="Bottom text" className="w-full rounded-xl border border-black/10 bg-[#f5f3ee] px-4 py-3 text-base font-bold uppercase outline-none ring-[#ff5c35]/25 focus:ring-4" /></label>
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
