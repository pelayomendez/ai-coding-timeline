#!/usr/bin/env node
// Checks the contract between data/ and design/. No dependencies: `node scripts/check.mjs`.
// Errors stop the build; warnings are things to fix in class (for example, a line without a source).
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/timeline.json', import.meta.url)));
const tokens = JSON.parse(readFileSync(new URL('../design/tokens.json', import.meta.url)));
const errors = [], warnings = [];

for (const key of ['title', 'subtitle', 'updated', 'tldr']) if (!data.meta?.[key]) errors.push(`meta.${key} is missing`);

const ids = new Set();
let previous = '';
for (const e of data.events) {
  const at = `event ${e.id || '(no id)'}`;
  if (!/^\d{4}-\d{2}$/.test(e.date || '')) errors.push(`${at}: date must be YYYY-MM`);
  if (e.date < previous) errors.push(`${at}: events must be in date order`);
  previous = e.date;
  if (ids.has(e.id)) errors.push(`${at}: duplicate id`);
  ids.add(e.id);
  if (!e.title || !e.summary) errors.push(`${at}: needs a title and a summary`);
  if (!e.tags?.length) errors.push(`${at}: needs at least one tag`);
  for (const t of e.tags || []) {
    if (!data.tags[t]) errors.push(`${at}: tag "${t}" is not in data.tags`);
    if (!tokens.tags[t]) errors.push(`${at}: tag "${t}" has no colour in design/tokens.json`);
  }
  for (const t of e.terms || []) if (!data.glossary[t]) errors.push(`${at}: term "${t}" is not in the glossary`);
  for (const s of e.sources || []) if (!s.url || !s.label) errors.push(`${at}: each source needs a label and a url`);
  if (!e.sources?.length) warnings.push(`${at}: no source yet`);
  // Content must not carry design.
  for (const k of Object.keys(e)) if (/color|colour|position|style|size/i.test(k)) errors.push(`${at}: "${k}" is design, move it to design/`);
}

warnings.forEach((w) => console.warn(`warn  ${w}`));
errors.forEach((e) => console.error(`error ${e}`));
console.log(`${data.events.length} events, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
