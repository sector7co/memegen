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
- `DEPLOYMENT_MODE=internal` to enable employee uploads and publishing

## Docker Compose (recommended for a homelab)

The repository includes a production build container with a local Workerd
runtime, automatic D1 migrations, and persistent local D1/R2 storage.

```sh
SITE_ORIGIN=https://memegen.intranet.example docker compose up -d --build
```

Open the value of `SITE_ORIGIN` after placing the service behind your existing
TLS reverse proxy. For a direct LAN-only test, the default is
`http://localhost:3000`; set `MEMEGEN_PORT` to change the published host port.

The named `memegen-data` volume contains both the SQLite/D1 state and generated
image objects. Back up that volume and never replace it during an upgrade:

```sh
docker compose pull
docker compose up -d --build
```

The entrypoint applies all unapplied migrations before starting the service.
`DEPLOYMENT_MODE=internal` enables employee uploads, tags, context URLs, and
publishing. Put the container behind SSO or an identity-aware reverse proxy;
memegen does not provide its own authentication layer.

This local binding mode is intentionally a **single-node** deployment. Multiple
replicas would each have independent local state. Use real Cloudflare D1/R2 or
replace the storage adapters with shared services before scaling horizontally.

Useful checks:

```sh
docker compose ps
docker compose logs -f memegen
curl --fail http://localhost:3000/
```

## Cloudflare deployment

1. Run `pnpm install`.
2. Create a D1 database and R2 bucket in your Cloudflare account.
3. Apply every migration in `drizzle/` to the database.
4. Map the bindings to `DB` and `FILES`; set `SITE_ORIGIN` and
   `DEPLOYMENT_MODE=internal`.
5. Run `pnpm build` and deploy the generated Worker bundle.
6. For an employee-only instance, put Cloudflare Access or your existing
   identity-aware proxy in front of the Worker.

The public and internal editions are intentionally one codebase. With no
`DEPLOYMENT_MODE`, the app defaults to a curated public demo: arbitrary uploads
are hidden and the publish endpoint returns HTTP 403. Internal mode lets
employees use the bundled library or upload company images directly in the
editor. Uploads stay browser-local until the user explicitly publishes the final
meme.

The default library is stored in `public/templates`; caption geometry and tags
live in `app/lib/templates.ts`. A company can replace or extend both as part of
its normal reviewed release process, with no external template API required at
runtime.

## Data model

- `memes`: opaque ID, searchable caption text, object key, content type, optional
  HTTP(S) context URL, creation time.
- `meme_tags`: normalized, lower-case tags joined to a meme by ID.
- `FILES`: immutable generated PNGs under `memes/<id>.png`.

Image bytes never live in SQL. Uploads remain device-local while editing; only
the final rendered PNG is written to `FILES` when a user chooses **Copy link**.
The corresponding searchable metadata is written to `DB` in the same publish
workflow. If the metadata write fails, the newly uploaded object is removed.

Recent posts use the `idx_memes_created_at` index. Search is case-insensitive
across caption text and associated tags, and responses are capped at 30 records
to keep edge cost bounded. See `ARCHITECTURE.md` for the full request and data
flows.

This small boundary is deliberate: it keeps hosting cost, backup complexity,
and vendor coupling low.
