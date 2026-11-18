# AI coding timeline — specification

Read this before changing anything. It is the specification layer: intent, user stories, rules and stack.
The look lives in `design/`, the content in `data/`, and the code that joins them in `src/`.

## Intent

An interactive 3D timeline of how AI coding changed since November 2025, for students of the Elisava
*Full Stack + AI* course. It is updated during the year, in class, and it doubles as an example of a
prototype with data, code and design kept apart.

## User stories

- As a student, I glide along the timeline with scroll, swipe or arrow keys, and every stop is one month.
- As a student, I can open a link to a single month (`#2026-03`) and share it.
- As a student, I can switch to a plain list with the same content, for reading or without WebGL.
- As a teacher, I add an event by editing one JSON file, without touching code or styles.
- As a designer, I restyle the whole timeline by editing only `design/`.

## Rules

- Content goes in `data/timeline.json` only. No colours, sizes or positions in `data/`.
- Look goes in `design/` only. No titles, dates or text in `design/`.
- `src/main.js` is the only file that reads both. Other `src/` files get what they need passed in.
- Every new event: date order, past tense, one or two sentences, at least one tag and a source.
- `node scripts/check.mjs` must exit 0 before a commit. Warnings are the to-do list.
- Credit the original list (Matt Pocock) wherever the timeline is shown.
- With *reduce motion* on, no gliding and no moving lights.
- Check changes in a browser over http, in both the 3D view and the list view.

## Preferred stack

- Plain HTML, CSS and ES modules. No build step, no npm dependencies.
- three.js from the import map in `index.html`; cards are HTML placed in 3D with `CSS3DRenderer`.
- Static hosting (GitHub Pages).
