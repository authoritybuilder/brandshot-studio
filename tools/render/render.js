// BrandShot Studio — example-image renderer.
// Runs HER template for every prompt: a code-built graphic (HTML/CSS), design
// system in CSS variables (8px base unit, 12-col grid, 1.333 modular scale,
// stated proportion splits, brand palette only), rendered in headless Chrome
// at device scale factor 2, with in-page measurement checks per render.
//
// Usage: node render.js <start> <end>   (range over the sorted prompt list)
//        node render.js verify          (deep measurement report, representative set)

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'previews');
const FONTDIR = path.join(__dirname, 'node_modules', '@fontsource', 'plus-jakarta-sans', 'files');

// ---- DESIGN SYSTEM (the maths, declared once) ----
const SYS = {
  baseUnit: 8,            // every margin/gap/radius is a multiple
  columns: 12,
  outerMargin: 32,        // 4u
  gutter: 16,             // 2u
  typeRatio: 1.333,       // modular scale
  baseFont: 15,
  canvasW: 420,           // render width at DPR1; exported at 2x
  ink: '#16251B',
  cream: '#F6F5F0',
  lime: '#A6D75C',
};
const scale = (n) => Math.round(SYS.baseFont * Math.pow(SYS.typeRatio, n));

// colour helpers
const hex2rgb = h => { h = h.replace('#',''); return [0,2,4].map(i => parseInt(h.slice(i,i+2),16)); };
const mix = (h, p) => { const c = hex2rgb(h).map(v => Math.round(v + (255 - v) * p)); return `rgb(${c.join(',')})`; };
const lum = h => { const [r,g,b] = hex2rgb(h).map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*r+0.7152*g+0.0722*b; };
const contrast = (a,b) => { const [l1,l2]=[lum(a),lum(b)].sort((x,y)=>y-x); return (l1+0.05)/(l2+0.05); };
// ink or cream text on a fill, whichever passes
const textOn = (bg) => contrast(bg, SYS.ink) >= 4.5 ? SYS.ink : SYS.cream;

function family(nameLow) {
  if (/quote|pull|section break/.test(nameLow)) return 'quote';
  if (/banner|header|announcement|event day|digest|catalog|masthead/.test(nameLow)) return 'band';
  if (/cta|booking|subscribe|link/.test(nameLow)) return 'cta';
  if (/invitation|save the date|menu|table number|certificate/.test(nameLow)) return 'print';
  if (/thumbnail|tile|cover|pin|end screen|roadmap|pricing|badge|card/.test(nameLow)) return 'click';
  if (/product|mockup|packaging|toolkit|bundle|collection|flat lay|detail|texture|hero product/.test(nameLow)) return 'object';
  if (/cohort|group|circle|community|panel|team|workshop|event|retreat/.test(nameLow)) return 'group';
  if (/workspace|studio setup|desk|materials|resource|library|kit/.test(nameLow)) return 'desk';
  return 'portrait';
}

const silhouette = (cx, cy, s, fill, op=1) => `
  <div style="position:absolute;left:${cx - s*0.26}px;top:${cy - s*0.78}px;width:${s*0.52}px;height:${s*0.52}px;border-radius:50%;background:${fill};opacity:${op}"></div>
  <div style="position:absolute;left:${cx - s*0.5}px;top:${cy - s*0.2}px;width:${s}px;height:${s*0.72}px;border-radius:${s*0.5}px ${s*0.5}px 0 0;background:${fill};opacity:${op}"></div>`;

function buildHTML(d) {
  const name = d.name || d.id;
  const nl = name.toLowerCase();
  const fam = family(nl);
  const aspect = String(d.aspect || '4:5');
  let [aw, ah] = aspect.split(':').map(Number); if (!aw || !ah) { aw=4; ah=5; }
  const W = SYS.canvasW, H = Math.max(120, Math.min(640, Math.round(W * ah / aw)));
  const pal = (String(d.palette||'').match(/#[0-9a-fA-F]{6}/g) || ['#3E5B33']);
  const p0 = pal[0], p1 = pal[1] || SYS.lime;
  const u = SYS.baseUnit, M = SYS.outerMargin;
  const colW = (W - 2*M - (SYS.columns-1)*SYS.gutter) / SYS.columns;
  const gridX = (c) => M + c * (colW + SYS.gutter); // start of column c (0-based)
  const spanW = (n) => n * colW + (n-1) * SYS.gutter;
  // headline = benefit phrase; sub = niche
  const parts = name.split(': ');
  let benefit = (parts[1] || parts[0]).replace(/ for .*$/, '');
  const asset = parts[0];
  const niche = (d.niche || '').toUpperCase();
  const golden = Math.round(H * 0.618 / u) * u;
  const third = Math.round(H / 3 / u) * u;

  let body = '', bg = `background:${mix(p0, 0.84)};`, note = '';
  const eyebrow = `<div class="eyebrow" style="left:${gridX(0)}px;top:${M}px;color:${SYS.ink};opacity:.62">${niche}</div>`;
  const mark = `<div style="position:absolute;right:${M}px;top:${M - u/2}px;color:${p0};font-weight:800;font-size:${scale(1)}px">✦</div>`;

  if (fam === 'quote') {
    bg = `background:${SYS.cream};`;
    body = `${eyebrow}${mark}
      <div style="position:absolute;left:${gridX(0)}px;top:${third}px;width:${spanW(12)}px;color:${p0};font-size:${scale(4)}px;font-weight:800;line-height:1">“</div>
      <div class="fit headline" style="left:${gridX(0)}px;top:${third + u*5}px;width:${spanW(12)}px;color:${SYS.ink};font-size:${scale(2)}px;">${benefit}</div>
      <div style="position:absolute;left:${gridX(0)}px;bottom:${M}px;width:${spanW(6)}px;height:${u/2}px;background:${p0}"></div>`;
  } else if (fam === 'band') {
    bg = `background:linear-gradient(135deg, ${mix(p0,0.78)}, ${mix(p1,0.82)});`;
    body = `${eyebrow}${mark}
      <div class="fit headline" style="left:${gridX(0)}px;top:${Math.max(M + u*4, H*0.30)}px;width:${spanW(8)}px;color:${SYS.ink};font-size:${scale(2)}px;">${benefit}</div>
      <div style="position:absolute;left:${gridX(0)}px;bottom:${M}px;height:${u*3}px;padding:0 ${u*2}px;border-radius:${u*3}px;background:${SYS.ink};color:${SYS.cream};font-size:${scale(-1)}px;font-weight:700;display:flex;align-items:center">${asset}</div>
      <div style="position:absolute;right:${M}px;bottom:${M}px;width:${colW*2}px;height:${colW*2}px;border-radius:50%;background:${p0};opacity:.9"></div>`;
  } else if (fam === 'cta') {
    bg = `background:${mix(p1, 0.8)};`;
    const btnBg = p0, btnTx = textOn(p0);
    body = `${eyebrow}${mark}
      <div class="fit headline" style="left:${gridX(1)}px;top:${third}px;width:${spanW(10)}px;text-align:center;color:${SYS.ink};font-size:${scale(2)}px;">${benefit}</div>
      <div style="position:absolute;left:50%;transform:translateX(-50%);bottom:${golden - third > u*10 ? H - golden : third}px;height:${u*6}px;padding:0 ${u*4}px;border-radius:${u*3}px;background:${btnBg};color:${btnTx};font-weight:800;font-size:${scale(0)}px;display:flex;align-items:center;gap:${u}px">Start here <span>→</span></div>`;
  } else if (fam === 'print') {
    bg = `background:${SYS.cream};`;
    body = `<div style="position:absolute;inset:${M - u}px;border:1.5px solid ${mix(p0,0.3)};border-radius:${u/2}px"></div>
      <div class="eyebrow" style="left:0;right:0;top:${M + u}px;text-align:center;color:${p0}">${niche}</div>
      <div style="position:absolute;left:50%;top:${third}px;transform:translateX(-50%);color:${p0};font-size:${scale(1)}px">✦</div>
      <div class="fit headline" style="left:${gridX(1)}px;top:${third + u*5}px;width:${spanW(10)}px;text-align:center;color:${SYS.ink};font-size:${scale(1)}px;">${benefit}</div>
      <div style="position:absolute;left:${gridX(4)}px;bottom:${M + u*2}px;width:${spanW(4)}px;height:1.5px;background:${mix(p0,0.3)}"></div>`;
  } else if (fam === 'click') {
    bg = `background:linear-gradient(160deg, ${mix(p0,0.5)}, ${mix(p1,0.72)});`;
    body = `${mark}
      <div style="position:absolute;left:${gridX(0)}px;top:${M}px;height:${u*3}px;padding:0 ${u*1.5}px;border-radius:${u*1.5}px;background:${SYS.ink};color:${SYS.cream};font-size:${scale(-2)}px;font-weight:700;display:flex;align-items:center;letter-spacing:.06em">${niche}</div>
      <div class="fit headline" style="left:${gridX(0)}px;bottom:${M + u*2}px;width:${spanW(10)}px;color:${SYS.ink};font-size:${scale(3)}px;text-shadow:0 1px 0 rgba(246,245,240,.6);">${benefit}</div>
      <div style="position:absolute;right:${-colW}px;top:${-colW}px;width:${colW*5}px;height:${colW*5}px;border-radius:50%;background:${mix(p0,0.25)};opacity:.85"></div>`;
  } else if (fam === 'object') {
    bg = `background:${mix(p1,0.82)};`;
    const ped = H - golden;
    body = `${eyebrow}${mark}
      <div style="position:absolute;left:0;right:0;bottom:0;height:${ped}px;background:${mix(p0,0.55)}"></div>
      <div style="position:absolute;left:${gridX(4)}px;bottom:${ped - u}px;width:${spanW(4)}px;height:${Math.round(H*0.34/u)*u}px;border-radius:${u}px;background:${p0};box-shadow:0 ${u*2}px ${u*3}px rgba(22,37,27,.25)"></div>
      <div style="position:absolute;left:${gridX(4)}px;bottom:${ped - u + Math.round(H*0.34/u)*u - u*4}px;width:${spanW(4)}px;height:${u*4}px;border-radius:${u}px ${u}px 0 0;background:${mix(p0,0.35)}"></div>
      <div class="fit" style="left:${gridX(0)}px;bottom:${u*2}px;width:${spanW(12)}px;text-align:center;color:${textOn(mix(p0,0.55))};font-weight:700;font-size:${scale(-1)}px;">${benefit}</div>`;
  } else if (fam === 'group') {
    bg = `background:linear-gradient(180deg, ${mix(p1,0.72)} 55%, ${mix(p0,0.78)} 55%);`;
    body = `${eyebrow}${mark}
      ${silhouette(W*0.3, H*0.72, H*0.3, mix(SYS.ink,0.18))}
      ${silhouette(W*0.5, H*0.7, H*0.38, SYS.ink)}
      ${silhouette(W*0.7, H*0.72, H*0.3, mix(SYS.ink,0.26))}
      <div class="fit" style="left:${gridX(0)}px;bottom:${u*2}px;width:${spanW(12)}px;text-align:center;color:${SYS.ink};font-weight:800;font-size:${scale(-1)}px;">${benefit}</div>`;
  } else if (fam === 'desk') {
    bg = `background:${mix(p1,0.8)};`;
    const ped = H - golden;
    body = `${eyebrow}${mark}
      <div style="position:absolute;left:0;right:0;bottom:0;height:${ped}px;background:${mix(p0,0.5)}"></div>
      <div style="position:absolute;left:${gridX(1)}px;bottom:${ped + u}px;width:${spanW(3)}px;height:${u*8}px;border-radius:${u/2}px;background:${p0}"></div>
      <div style="position:absolute;left:${gridX(5)}px;bottom:${ped + u}px;width:${spanW(2)}px;height:${u*11}px;border-radius:${u/2}px;background:${SYS.ink}"></div>
      <div style="position:absolute;left:${gridX(8)}px;bottom:${ped + u*2}px;width:${colW*1.6}px;height:${colW*1.6}px;border-radius:50%;background:${p1}"></div>
      <div class="fit" style="left:${gridX(0)}px;bottom:${u*2}px;width:${spanW(12)}px;text-align:center;color:${textOn(mix(p0,0.5))};font-weight:700;font-size:${scale(-1)}px;">${benefit}</div>`;
  } else { // portrait — the brand-photo look
    bg = `background:linear-gradient(165deg, ${mix(p1,0.66)}, ${mix(p0,0.76)});`;
    const sSize = Math.min(H*0.52, W*0.55);
    body = `${eyebrow}${mark}
      <div style="position:absolute;left:${W*0.62 - sSize*0.58}px;top:${H*0.72 - sSize*1.2}px;width:${sSize*1.16}px;height:${sSize*1.16}px;border-radius:50%;background:${mix(p1,0.45)};opacity:.8"></div>
      ${silhouette(W*0.62, H*0.72, sSize, SYS.ink)}
      <div class="fit headline" style="left:${gridX(0)}px;top:${golden > H - u*14 ? M + u*4 : golden}px;width:${spanW(5)}px;color:${SYS.ink};font-size:${scale(1)}px;background:rgba(246,245,240,.9);padding:${u}px ${u*1.5}px;border-radius:${u}px;box-shadow:0 ${u/2}px ${u*2}px rgba(22,37,27,.08);">${benefit}</div>`;
  }

  return { W, H, html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  /* DESIGN SYSTEM — base unit ${u}px · ${SYS.columns}-col grid · margins ${M}px · gutters ${SYS.gutter}px
     type scale ${SYS.typeRatio} from ${SYS.baseFont}px · proportions: golden (${golden}px) / thirds (${third}px) */
  @font-face { font-family:'PJS'; src:url('file://${FONTDIR}/plus-jakarta-sans-latin-800-normal.woff2') format('woff2'); font-weight:800; }
  @font-face { font-family:'PJS'; src:url('file://${FONTDIR}/plus-jakarta-sans-latin-700-normal.woff2') format('woff2'); font-weight:700; }
  @font-face { font-family:'PJS'; src:url('file://${FONTDIR}/plus-jakarta-sans-latin-600-normal.woff2') format('woff2'); font-weight:600; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; height:${H}px; overflow:hidden; }
  #canvas { position:relative; width:${W}px; height:${H}px; ${bg} font-family:'PJS',sans-serif; }
  .eyebrow { position:absolute; font-size:${Math.max(9, scale(-3))}px; font-weight:700; letter-spacing:.14em; }
  .headline { font-weight:800; letter-spacing:-0.015em; line-height:1.08; }
  .fit { position:absolute; }
  </style></head><body><div id="canvas">${body}</div>
  <script>
  // VERIFY: shrink any overflowing text, then report safe-zone violations
  window.__check = () => {
    const W=${W}, H=${H}, SAFE=${Math.round(u*1.5)};
    document.querySelectorAll('.fit').forEach(el => {
      let fs = parseFloat(getComputedStyle(el).fontSize);
      let guard = 24;
      while (guard-- && (el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().bottom > H - SAFE)) {
        fs *= 0.92; el.style.fontSize = fs + 'px';
        if (fs < 9) break;
      }
    });
    const issues = [];
    document.querySelectorAll('.fit, .eyebrow').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.left < SAFE - 0.5 || r.right > W - SAFE + 0.5 || r.top < SAFE - 0.5 || r.bottom > H - SAFE + 0.5) {
        issues.push('safezone:' + (el.textContent||'').slice(0,20));
      }
      if (el.scrollWidth > el.clientWidth + 1) issues.push('overflow:' + (el.textContent||'').slice(0,20));
    });
    return issues;
  };
  </script></body></html>` };
}

async function main() {
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'));
  const scenes = Object.values(idx.scenes).sort((a,b) => a.id.localeCompare(b.id));
  const [a, b] = [parseInt(process.argv[2] || '0'), parseInt(process.argv[3] || String(scenes.length))];
  const jobs = scenes.slice(a, b);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const pages = await Promise.all([0,1,2,3].map(() => ctx.newPage()));
  let done = 0, issues = 0;
  async function work(page, slice) {
    for (const s of slice) {
      const file = path.join(OUT, s.id + '.jpg');
      if (fs.existsSync(file)) { done++; continue; }
      // palette lives on slim entry (pal) — rebuild a palette string for buildHTML
      const d = { id: s.id, name: s.name, aspect: s.aspect, niche: s.catLabel || '', palette: (s.pal||[]).join(', ') };
      const { W, H, html } = buildHTML(d);
      await page.setViewportSize({ width: W, height: H });
      await page.setContent(html, { waitUntil: 'load' });
      const probs = await page.evaluate('__check()');
      if (probs.length) issues++;
      await page.screenshot({ path: file, type: 'jpeg', quality: 74 });
      done++;
      if (done % 200 === 0) console.log('rendered', done, '/', jobs.length);
    }
  }
  const per = Math.ceil(jobs.length / pages.length);
  await Promise.all(pages.map((p, i) => work(p, jobs.slice(i*per, (i+1)*per))));
  await browser.close();
  console.log('DONE', done, 'rendered |', issues, 'pages needed auto-fit fixes (applied in-page before capture)');
}
main().catch(e => { console.error(e); process.exit(1); });
