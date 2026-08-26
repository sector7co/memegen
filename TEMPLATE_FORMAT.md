# Template manifest format

Templates are versioned in `app/lib/templates.ts`; their image files live under
`public/templates`. The TypeScript manifest is the source of truth and prevents
invalid template geometry from reaching production unnoticed.

## Caption count

`lines` is either a fixed number or an inclusive range:

```ts
lines: 3                    // exactly three caption fields
lines: { min: 2, max: 3 }  // top and bottom, with an optional middle field
```

The fixed form maps directly to Memegen.link's `lines` field. We use the range
form where our editor offers optional fields. `slots` defines the corresponding
field labels, defaults, and placements.

## Placement and transforms

All coordinates are normalized to the source image: `(0, 0)` is the top-left
and `(1, 1)` is the bottom-right. A conventional centered caption uses `x`,
`y`, and `width`:

```ts
{
  id: 'label',
  label: 'Label',
  x: 0.72,
  y: 0.68,
  width: 0.4,
  transform: { rotateDeg: -4, skewXDeg: 8 }
}
```

`rotateDeg`, `skewXDeg`, and `skewYDeg` are affine Canvas transforms. They are
appropriate for a rotated label or a surface whose opposite edges remain
parallel.

For perspective, `quad` defines the four target corners in clockwise order:

```ts
transform: {
  quad: [
    { x: 0.18, y: 0.55 }, // top-left
    { x: 0.62, y: 0.50 }, // top-right
    { x: 0.65, y: 0.68 }, // bottom-right
    { x: 0.20, y: 0.72 }, // bottom-left
  ]
}
```

When `quad` is present it overrides the centered placement for rendering. The
caption is drawn to an offscreen Canvas and mapped into the quadrilateral as two
affine triangles. This supports signs, screens, and labels photographed in
perspective without introducing a server-side image processor.

## Compatibility notes

Memegen.link also exposes `overlays`, `styles`, `keywords`, examples, and a
source URL. Those are catalog/discovery metadata rather than caption geometry.
They can be retained by an importer without affecting this core renderer. If we
add user-selectable overlays or style variants, they should be separate optional
manifest fields instead of being overloaded into `slots`.
