# Self-hosting memegen

memegen is a Cloudflare Worker-compatible React app. It keeps image bytes in
object storage and searchable metadata in SQLite/D1. The app has no analytics,
ads, third-party image proxy, or mandatory SaaS dependency.

## Requirements

- Node.js 22.13 or newer
- pnpm
- A D1-compatible database bound as `DB`
- An R2/S3-compatible object bucket bound as `FILES`
- `SITE_ORIGIN` set to the canonical HTTPS origin

## Cloudflare deployment

1. Run `pnpm install`.
2. Create a D1 database and R2 bucket in your Cloudflare account.
3. Apply every migration in `drizzle/` to the database.
4. Map the bindings to `DB` and `FILES` and set `SITE_ORIGIN`.
5. Run `pnpm build` and deploy the generated Worker bundle.
6. For an employee-only instance, put Cloudflare Access or your existing
   identity-aware proxy in front of the Worker.

The public and internal editions are intentionally one codebase. Employees can
use the built-in themes or upload company images directly in the editor. Uploads
stay browser-local until the user explicitly publishes the final meme.

## Data model

- `memes`: opaque ID, caption title, object key, content type, creation time.
- `FILES`: immutable generated PNGs under `memes/<id>.png`.

This small boundary is deliberate: it keeps hosting cost, backup complexity,
and vendor coupling low.
