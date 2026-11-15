# -*- coding: utf-8 -*-
"""
BrandShot Studio — Code Graphic brief, v2.
Her precision-design template, fused per-prompt with the COMPLETE scene brief
so the reader knows exactly what image they are creating: full scenario,
props, wardrobe, lighting, camera, framing, safe zones, palette, layout
concept, conversion intent. No truncation, no boilerplate-only slots.
"""

CODE_FIRST = ("quote", "banner", "header", "card", "cover", "cta", "invitation",
              "save the date", "menu", "table number", "announcement", "badge",
              "pin", "thumbnail", "tile", "certificate", "pricing", "end screen",
              "section break", "digest", "catalog", "roadmap", "splash", "icon")

def is_code_first(base_name: str) -> bool:
    low = base_name.lower()
    return any(t in low for t in CODE_FIRST)

def _ratio_for(aspect: str) -> str:
    return {
        "16:9":  "thirds — headline zone on the left two-thirds, visual anchor on the right third",
        "4:5":   "golden ratio — visual field above the 0.618 line, text field below it",
        "1:1":   "halves on the vertical axis with the focal point at an upper-third power point",
        "9:16":  "thirds vertically — hook text top third, subject middle, CTA bottom third",
        "16:5":  "golden ratio horizontally — message left of the 0.618 line, brand mark right",
        "2:3":   "golden ratio — image field above the 0.618 line, title band below",
        "8.5:11":"thirds — masthead top third, body middle, footer band bottom third",
        "5:7":   "golden ratio — ornamental field above, names and details below",
    }.get(aspect, "thirds, stated explicitly in the spec sheet")

def _layout_concept(name_low, is_text):
    if any(t in name_low for t in ("quote","pull","section break")):
        return ("Typographic hero: the quote set large in the brand display face is the image. "
                "Generous margins, one accent rule or glyph (✦), nothing competing with the words.")
    if any(t in name_low for t in ("banner","header","announcement","event day","digest","catalog")):
        return ("Wide editorial band: headline zone with clear air, a slim supporting line beneath, "
                "brand mark anchored to one edge, background texture or brand photo at low volume.")
    if any(t in name_low for t in ("cta","booking","subscribe","link")):
        return ("Action card: one short command line, one pill-shaped button drawn in the accent colour, "
                "arrow or glyph pointing at it. Everything else is quiet space.")
    if any(t in name_low for t in ("invitation","save the date","menu","table number","certificate")):
        return ("Ceremonial print layout: centred composition, ornamental rule lines, names/dates set in the "
                "display face, letterpress-like restraint on colour.")
    if any(t in name_low for t in ("thumbnail","tile","cover","pin","end screen","roadmap","pricing","badge","card")):
        return ("Click-target composition: a dominant focal shape or image crop, title text at maximum legible size "
                "for small-screen rendering, high figure-ground contrast in brand colours.")
    if any(t in name_low for t in ("product","mockup","packaging","toolkit","bundle","collection","flat lay","detail","texture")):
        return ("Object-hero layout: the product/deliverable image placed on the grid's power point over a staged "
                "backdrop drawn with brand colours, soft believable shadow, caption line beneath.")
    if is_text:
        return ("Designed layout led by typography on the grid, brand photo (if any) in a clean clipped frame, "
                "accent colour used once for the focal action.")
    return ("Image-led layout: the brand photograph (from the brand source) placed on the grid as the hero crop "
            "described in the scene brief below, with the headline zone kept clear in the stated safe zones; "
            "typography and accent shapes recreate the scene's mood in code. Never redraw or alter people.")

def build_codegraphic(d, ctx=None):
    name   = d.get("name") or d.get("id", "")
    nl     = name.lower()
    niche  = d.get("niche", "")
    dims   = (d.get("dimensions") or "1080×1350").replace("×", "x")
    aspect = d.get("aspect", "4:5")
    moment = d.get("businessMoment") or name
    safe   = d.get("safeZones") or "keep all critical content inside a 6% inner margin on every edge"
    pal    = d.get("palette", "")
    fmt    = "PNG" if is_code_first(name) else "JPG at 95%"
    text_line = ("the exact headline/overlay text I give you — and if I give none, "
                 "suggest three options in my brand voice and use the strongest")

    # ---- THE IMAGE TO CREATE: the complete, untruncated scene brief ----
    scene_lines = []
    def add(label, val):
        v = str(val or "").strip()
        if v: scene_lines.append(f"- {label}: {v}")
    add("Scene", d.get("scenario"))
    add("Subject direction", d.get("poseDirection"))
    add("Wardrobe (if a person appears in the brand photo)", d.get("wardrobe"))
    add("Lighting mood to recreate with colour and contrast", d.get("lightingSpec"))
    add("Framing", d.get("framing"))
    add("Safe zones", safe)
    add("Design principle", d.get("designPrinciple", "").replace("_", " "))
    add("The feeling it must trigger", d.get("conversionIntent", "").replace("_", " "))
    add("Niche colour inspiration (mood reference only — final colours come from MY brand palette)", pal)
    scene_brief = "\n".join(scene_lines)

    return f"""Create a graphic for me using code (HTML/CSS rendered to an image), not AI image generation. Treat it as precision design: every size, gap and position must come from a system, never from eyeballing.

BRIEF
- What it's for: {name} — {moment}. Audience: {niche}.
- Final size and format: {dims} px ({aspect}), {fmt}.
- Text: {text_line}.
- Brand source: use the BRAND OVERRIDE block appended below this prompt (my colours, fonts, logo and identity from BrandShot Studio); if a website URL is included there, pull from it too.
- Images: real photos/logo from my brand source only. Never generate, redraw or alter people or logos.
- Style notes: see THE IMAGE TO CREATE below — it is the creative brief for this exact graphic.

THE IMAGE TO CREATE
Layout concept: {_layout_concept(nl, is_code_first(name))}
{scene_brief}

1. RESEARCH THE BRAND
- Pull the real brand colours (exact hex codes, ranked by how often they're used), fonts, logo and photos from the source. Report what you found, including each image's pixel resolution, before designing.

2. SET UP THE DESIGN SYSTEM FIRST, IN CSS VARIABLES
- Canvas: build at half the final pixel size and render at 2x, so the output is exactly {dims} px at retina sharpness.
- Base unit: choose one base unit (e.g. 8px, or a clean fraction of the canvas width). Every margin, gap, padding, radius and offset must be a multiple of it.
- Grid: define a 12-column grid with fixed outer margins and gutters. Every element must start and end on a grid line.
- Type scale: set font sizes with one modular ratio (1.25, 1.333, 1.5 or 1.618). Use no sizes outside the scale. Line-height and letter-spacing are set per level.
- Proportions: split the major areas using {_ratio_for(aspect)}.
- Colours: use only the brand palette, kept as variables. Use no other colours.
- Safe zone: {safe}

3. BUILD
- One self-contained HTML file plus a local assets/ folder.
- Use only real assets: real text in the brand fonts, real photos, real logos. Never generate, redraw or alter people or logos.
- Write the system values out at the top of the CSS so anyone can see the maths.

4. RENDER
- Use headless Google Chrome at device scale factor 2, waiting for fonts and images to load. Then export as {fmt}.

5. VERIFY BY MEASUREMENT, NOT JUST BY LOOKING
- Run JavaScript in the rendered page to get every element's bounding box and report: overlaps or clipping between elements, and any text overflowing its box; any element outside the safe zone; any element not aligned to the grid or the base unit; any spacing that isn't a multiple of the base unit; the WCAG contrast ratio of every text and background pair (at least 4.5:1; at least 3:1 for very large text); whether each image is shown larger than its native resolution (would look soft).
- Then view the rendered image and check optical balance and hierarchy. Is there one clear focal point? Does the eye read the elements in the intended order? Is the text readable at the smallest size it will be viewed?
- Fix every problem and re-render until all checks pass.

6. DELIVER
- Give me the final image, the editable HTML template and the assets/ folder.
- Give a short spec sheet: grid, base unit, type scale ratio, proportions used, the measurement results, and any limits (e.g. a low-resolution photo).
- Build the HTML so new versions only need a text, image or size change, with the layout recalculating from the system variables."""
