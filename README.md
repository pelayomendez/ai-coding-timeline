# A brief history of AI coding

An interactive 3D timeline: the camera glides along a road through space, and each month is a card
beside the road. Built as a teaching example for the Elisava *Full Stack + AI* course, and kept up to date
during the year.

The original list is by **Matt Pocock**, from one of his LinkedIn posts; we extend it in class.

**The point of the example is the split.** It follows the structure from
[*Cómo estructurar prototipos con IA*](https://pelayomendez.substack.com/p/como-estructurar-prototipos-con-ia):
instead of one ever-longer prompt, the prototype is split into areas an agent can work on separately.

| Area | Where | What it holds |
|---|---|---|
| Specification | `AGENTS.md` | Intent, user stories, rules, preferred stack. The agent reads it first. |
| Design | `design/` | Tokens, theme and 3D scene settings. How it looks and feels. |
| Data | `data/timeline.json` | The events, tags and glossary. JSON before any database. |
| Code | `src/` | The renderer that joins them. Knows shapes and names, not content or colours. |

You can rewrite every event without touching the look, or restyle everything without touching a word of content.

## Run it

No build step and no install. Any static server works:

```bash
python3 -m http.server 8010
# open http://localhost:8010
```

Browsers block loading JSON from `file://`, so opening `index.html` directly won't work.

- Scroll, swipe, use the arrow keys (or `j` / `k`), or pick a month at the bottom.
- `#2026-03` in the URL opens on that month; the URL follows you as you move.
- **List view** shows the same cards as a plain, scrollable list. It is also the fallback without WebGL.
- With *reduce motion* on, the camera jumps instead of gliding and the pulses stop.

## Files

```
AGENTS.md           ← specification: intent, user stories, rules, stack (CLAUDE.md points here)
data/
  timeline.json     ← content: events, tags, glossary. No colours, no positions.
design/
  tokens.json       ← design tokens: colours, fonts, tag colours, and the 3D scene (road, camera, fog…)
  theme.css         ← how cards and the HUD look. Uses only the tokens, as CSS variables.
src/
  main.js           ← the only file that knows both halves: loads them and wires input
  tokens.js         ← turns tokens.json into CSS variables (--color-bg, --tag-models…)
  card.js           ← one event → one HTML card
  world.js          ← the three.js scene: road, markers, stars, camera. Knows shapes, not content.
scripts/
  check.mjs         ← checks the contract between data/ and design/
index.html          ← the page shell and the three.js import map
```

The rules:

1. **`data/` never contains design.** No colours, sizes or positions. A tag is a name (`"practice"`), not a colour.
2. **`design/` never contains content.** No titles, dates or text.
3. **They meet only in `src/main.js`**, through names both sides agree on: tag ids and token names.
4. **`scripts/check.mjs` enforces the contract.** Every tag in the data needs a colour in the tokens, every term needs a glossary entry, and an event with a `color` field fails.

The cards are real HTML placed in 3D with three.js `CSS3DRenderer`, not textures. So `theme.css` styles them,
the text is sharp and selectable, and screen readers and keyboard focus work.

## Add an event

Add one object to `events` in `data/timeline.json`, in date order:

```json
{
  "id": "2026-12",
  "date": "2026-12",
  "title": "Short headline",
  "summary": "One or two sentences, past tense.",
  "tags": ["practice"],
  "terms": [],
  "sources": [{ "label": "Where this comes from", "url": "https://…" }]
}
```

Then run the check:

```bash
node scripts/check.mjs
```

Errors must be fixed. Warnings (for example, *no source yet*) are the to-do list for the next class.

## Restyle it

- Colours, fonts and tag colours: `design/tokens.json`.
- The road's shape, camera, fog, stars and pulses: `tokens.json → scene`.
- Card and HUD layout: `design/theme.css`.

Try it as an exercise: make a light theme by changing only `design/`, and run `git diff --stat` to show
nothing else moved.

## Similar projects

Ideas and references, not dependencies:

- [Cranach Timeline](https://github.com/lucascranach/cranach-timeline): a 3D timeline of artworks in React and three.js (WebGPU).
- [Legal History Timeline](https://github.com/Phhofm/LegalHistoryTimelinePrototype): a three.js prototype made for students at the University of Zurich.
- [RWI Timeline](https://rwi.app/timeline/): historical events in three.js, with a CMS behind it.
- [history-3d-interactive](https://github.com/anivy918-bot/history-3d-interactive): Chinese dynasties as clickable 3D scenes with no build tool, including a classroom mode.
- [three-timeline](https://github.com/andrewisen-tikab/three-timeline): adds time as a dimension to three.js objects.

## Credits

Original timeline: Matt Pocock (LinkedIn). Extended by the Elisava *Full Stack + AI* class of 2026–27.
three.js loaded from jsDelivr. Fonts: Saira Condensed, Raleway and JetBrains Mono from Google Fonts.
