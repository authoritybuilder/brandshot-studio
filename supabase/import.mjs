// BrandShot Studio — Supabase importer
// Usage:
//   1. Run supabase/schema.sql in the Supabase SQL editor (once).
//   2. SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node supabase/import.mjs
// Upserts all 4,437 prompts in batches of 200. Safe to re-run any time.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}

const root = new globalThis.URL('..', import.meta.url).pathname;
const promptsDir = join(root, 'prompts');
const rows = [];
for (const niche of readdirSync(promptsDir)) {
  for (const f of readdirSync(join(promptsDir, niche))) {
    if (!f.endsWith('.json')) continue;
    const d = JSON.parse(readFileSync(join(promptsDir, niche, f), 'utf8'));
    rows.push({
      id: d.id,
      niche: d.niche || '',
      niche_key: niche,
      name: d.name || d.id,
      tagline: d.tagline || '',
      summary: d.summary || d.sub || '',
      aspect: d.aspect || '',
      dimensions: d.dimensions || '',
      channel_type: d.channelType || '',
      business_moment: d.businessMoment || '',
      best_platforms: d.bestPlatforms || '',
      keywords: d.keywords || [],
      code_first: !!d.codeFirst,
      data_version: d.dataVersion || '',
      data: d,
      updated_at: new Date().toISOString(),
    });
  }
}
console.log(`Importing ${rows.length} prompts...`);

for (let i = 0; i < rows.length; i += 200) {
  const batch = rows.slice(i, i + 200);
  const res = await fetch(`${URL}/rest/v1/prompts?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    console.error(`Batch ${i / 200 + 1} failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`  ${Math.min(i + 200, rows.length)}/${rows.length}`);
}
console.log('Done.');
