# memegen architecture

## System shape

memegen is a single React application compiled to a Cloudflare Worker-compatible
ES module. The Worker serves the UI, API routes, share pages, and social metadata.
There is no always-on server and no image-processing service: rendering happens
on the user's device with Canvas.

| Concern | Implementation | Why |
| --- | --- | --- |
| UI and rendering | React + browser Canvas | Instant feedback; uploaded originals do not leave the device while editing. |
| Image bytes | R2/object binding `FILES` | Cheap blob storage, independent of relational queries. |
| Metadata | D1/SQLite binding `DB` | Durable ordering, tags, text search, and share-page lookup. |
| Delivery | Cloudflare-compatible edge Worker | Stateless, globally cached, and close to zero idle cost. |

## Image lifecycle

1. A built-in theme is drawn procedurally, or the user selects an image from
   their device. A selected original stays in browser memory.
2. Top, optional middle, and bottom captions are rendered into a 1080×1080
   Canvas. Copy, native share, and download operate directly on that PNG blob;
   those actions do not contact the backend.
3. **Copy link** is the explicit publish boundary. The client sends the final
   PNG, caption summary, comma-separated tags, and an optional context URL to
   `POST /api/memes`.
4. The Worker writes immutable bytes to `FILES` at `memes/<opaque-id>.png`, then
   writes the object key and metadata to `DB`. A failed metadata write deletes
   the just-created object so storage cannot silently orphan it.
5. `/api/images/<key>` streams bytes from object storage with an immutable cache
   policy. `/m/<id>` reads metadata from D1 and exposes record-specific Open
   Graph/X image metadata.

## Data model and discovery

- `memes`: ID, display/search title, object key, MIME type, optional context URL,
  and creation timestamp.
- `meme_tags`: `(meme_id, tag)` composite key. Tags are normalized to lower case,
  deduplicated, limited to 10 per post, and capped at 32 characters each.
- `idx_memes_created_at` serves the newest-first feed.
- `idx_meme_tags_tag` supports tag discovery and future exact-tag filters.

The home page reads the newest 12 records on the server. `GET /api/memes` accepts
free text in `q` and searches case-insensitively across caption titles and tag
values. `limit` is clamped to 1–30. This deliberately favors a small, transparent
SQLite query over a separate search service. At very large corpus sizes, the
same API boundary can move caption search to SQLite FTS without changing clients.

## Trust and privacy boundaries

- Uploads are private and browser-local until the user explicitly publishes.
- Published images are public on the public instance; company deployments choose
  their own network/identity boundary, such as Cloudflare Access.
- Request host headers are not trusted for social URLs. `SITE_ORIGIN` provides
  the canonical deployment origin.
- File type, file size, tag count/length, result count, and object-key format are
  validated at the edge.
- Context links are limited to 2,048 characters, accept only HTTP(S), reject
  embedded credentials, and open with cross-window isolation protections.

## Self-hosting

Public and internal editions use the same code. A company owns its database and
bucket, may place the Worker behind existing SSO, and can seed or upload its own
images without a commercial feature gate. See `SELF_HOSTING.md` for deployment
steps.
