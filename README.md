# BrandShot Studio — v13.0.0

*Your brand photoshoot, on demand · Authority Builder™ · Owner: Yasmin Cronin*

**4,437 professional image prompts across 151 niches**, each with 11 variants:
10 AI-image platforms (Claude, ChatGPT/DALL·E, Midjourney, Flux, Imagen,
Firefly, Leonardo, SDXL, Ideogram, Sora) plus the new **Code Graphic** brief.

## New in v11: Code Graphic — precision design, not AI guessing

Every prompt now carries a **Code Graphic** variant: a full precision-design
brief that has Claude BUILD the graphic with code (HTML/CSS rendered headlessly
to an image) instead of generating it. Every size, gap and position comes from
a declared system — one base unit, a 12-column grid, one modular type scale, a
stated proportion split per aspect ratio — and the result is verified by
measurement (bounding boxes, grid alignment, WCAG contrast, native image
resolution) before delivery, then handed over with the editable HTML template.

**942 design assets** (quote cards, banners, headers, CTA cards, thumbnails,
covers, invitations, menus, certificates, pricing tiles…) are flagged
`codeFirst`: they open on the Code Graphic brief by default and show a
"⌗ pixel-perfect" badge, because code-rendered typography and layout beats AI
generation there every time. Photographic assets keep their AI-photo prompts
primary; their Code Graphic variant builds the designed-layout treatment using
real brand photos on the grid — never redrawn people.

## Runs anywhere: Vercel · Netlify · any static host

Pure static site — no build step, no server. `vercel.json` and `netlify.toml`
are both included with matching cache headers (`index.json` no-cache,
`prompts/*` cached + CORS-open).

**Vercel:** import the Git repo (or `vercel --prod` from this folder).
Framework preset: *Other*. Build command: *none*. Output directory: `.`
**Netlify:** drag this folder (or connect the repo). Publish directory: `.`

The access gate (password-protected entry) is built into `index.html` and
works identically on every host.

## Supabase

The prompt database is Supabase-ready:

1. Run `supabase/schema.sql` in the Supabase SQL editor (creates
   `public.prompts` with jsonb payload, keyword/niche indexes, RLS read-only).
2. `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/import.mjs`
   — upserts all 4,437 prompts in batches; safe to re-run after any rebuild.

The static app doesn't require Supabase — the table powers whatever comes
next (API, analytics, member features) without touching the site.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The whole app (single file, gate included) |
| `index.json` | Search/browse index + categories + counts |
| `prompts/{niche}/{id}.json` | 4,437 rich per-prompt files (11 variants each) |
| `vercel.json` / `netlify.toml` | Host configs (equivalent) |
| `supabase/` | Schema + importer |
| `tools/codegraphic.py` | The Code Graphic brief generator |
| `previews/{id}.jpg` | 4,437 code-rendered example images (one per prompt) |
| `tools/render/` | The HTML/CSS→image render pipeline that built them |
| `og-image.png` | Social link preview |

## Verify a deploy

Open the site in a private window → enter the access password → DevTools
console should log `data version: v11.0.0` and `4437 prompts across 151
niches`. Open any badge-marked tile → the platform selector should sit on
"⌗ Code Graphic — pixel-perfect" with the full precision brief loaded.
