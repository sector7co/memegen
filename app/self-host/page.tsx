import Link from 'next/link';

const steps = [
  ['1', 'Clone and install', 'Use Node 22.13+ and pnpm. Install the exact locked dependencies with pnpm install.'],
  ['2', 'Create two bindings', 'Bind a D1-compatible SQLite database as DB and S3-compatible object storage as FILES.'],
  ['3', 'Apply migrations', 'Run the checked-in SQL migration against your database before the first deploy.'],
  ['4', 'Deploy', 'Build the Worker-compatible bundle, set SITE_ORIGIN and DEPLOYMENT_MODE=internal, then publish behind your SSO or private network.'],
];

export default function SelfHostPage() {
  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#171714]">
      <header className="border-b border-black/10 px-5 py-4 md:px-10"><div className="mx-auto flex max-w-5xl items-center justify-between"><Link href="/" className="flex items-center gap-2 text-lg font-black tracking-[-0.04em]"><span className="grid size-8 place-items-center rounded-lg bg-[#ff5c35] text-white">M</span>memegen</Link><Link href="/" className="text-sm font-bold">Open editor →</Link></div></header>
      <article className="mx-auto max-w-5xl px-5 py-12 md:px-10 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-[#d94221]">Free for companies, too</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.065em] sm:text-7xl">Run memegen on infrastructure you control.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">The public product and the internal product are the same codebase. Your organization can keep every template and generated image in its own account, with no paid enterprise feature gate.</p>
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {steps.map(([number, title, detail]) => <section key={number} className="rounded-2xl border border-black/10 bg-white p-6"><span className="font-mono text-xs text-black/35">{number.padStart(2, '0')}</span><h2 className="mt-8 text-xl font-black tracking-[-.03em]">{title}</h2><p className="mt-2 text-sm leading-6 text-black/55">{detail}</p></section>)}
        </div>
        <section className="mt-12 rounded-[28px] bg-[#171714] p-7 text-white sm:p-10">
          <h2 className="text-3xl font-black tracking-[-.04em]">Recommended production shape</h2>
          <div className="mt-6 grid gap-6 text-sm leading-6 text-white/65 sm:grid-cols-3"><p><strong className="block text-white">React at the edge</strong>One stateless Worker serves the interface, metadata, and tiny API.</p><p><strong className="block text-white">Object storage</strong>Published PNG bytes live in your bucket, never in SQL; editing uploads stay on-device.</p><p><strong className="block text-white">Searchable SQLite</strong>Captions, object keys, timestamps, and normalized tags power recent posts and free-text search.</p></div>
        </section>
        <p className="mt-8 text-sm leading-6 text-black/45">For a private employee deployment, put your identity-aware proxy or Cloudflare Access in front of the app. memegen deliberately does not invent a second identity system.</p>
      </article>
    </main>
  );
}
