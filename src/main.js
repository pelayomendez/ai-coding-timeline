// Joins the two halves: content from data/, look from design/. This is the only file that knows both.
import { applyTokens, loadJSON } from './tokens.js';
import { renderCard, formatMonth } from './card.js';
import { createWorld } from './world.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function main() {
  const [data, tokens] = await Promise.all([loadJSON('data/timeline.json'), loadJSON('design/tokens.json')]);
  applyTokens(tokens);

  const { meta, events } = data;
  $('title').textContent = meta.title;
  $('subtitle').textContent = `${meta.subtitle} · updated ${meta.updated}`;
  $('tldr').textContent = meta.tldr;
  const credit = meta.credit;
  if (credit) {
    const el = document.createElement(credit.url ? 'a' : 'span');
    el.textContent = credit.label;
    if (credit.url) Object.assign(el, { href: credit.url, target: '_blank', rel: 'noopener' });
    $('credit').replaceChildren(el);
  }
  document.title = meta.title;

  // Month ticks at the bottom.
  $('ticks').innerHTML = events.map((e) =>
    `<a href="#${e.id}" style="--tag: var(--tag-${e.tags[0]})" title="${e.title}">${formatMonth(e.date)}</a>`).join('');
  const ticks = [...$('ticks').children];

  // The list view gets its own copy of the cards, so both views can live side by side.
  $('list').innerHTML = '<ol></ol>';
  events.forEach((e) => {
    const li = document.createElement('li');
    li.appendChild(renderCard(e, data));
    $('list').firstChild.appendChild(li);
  });

  const startIndex = Math.max(0, events.findIndex((e) => `#${e.id}` === location.hash));
  const wantList = new URLSearchParams(location.search).get('view') === 'list';
  if (!hasWebGL()) { setList(true); $('view-toggle').hidden = true; return; }

  const cards = events.map((e) => renderCard(e, data));
  const colors = events.map((e) => tokens.tags[e.tags[0]]);
  const world = createWorld({ webglHost: $('webgl'), cssHost: $('css'), tokens, cards, colors, reducedMotion });
  world.goTo(startIndex);
  if (wantList) setList(true);

  world.onActive((i) => {
    cards.forEach((c, j) => c.classList.toggle('is-active', i === j));
    ticks.forEach((t, j) => t.classList.toggle('is-active', i === j));
    history.replaceState(null, '', `#${events[i].id}`);
    $('sr').textContent = `${formatMonth(events[i].date)}: ${events[i].title}`;
  });

  // ---- Input: wheel, touch, keys, clicks. Wheel and touch glide, then snap to the nearest event. ----
  let snapTimer;
  const glide = (delta) => {
    if (document.body.classList.contains('is-list')) return;
    world.nudge(delta);
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => world.snap(), 220);
  };
  addEventListener('wheel', (e) => glide(e.deltaY * 0.00012), { passive: true });
  let touchY = null;
  addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => { glide((touchY - e.touches[0].clientY) * 0.0004); touchY = e.touches[0].clientY; }, { passive: true });

  addEventListener('keydown', (e) => {
    if (document.body.classList.contains('is-list')) return;
    const keys = { ArrowDown: 1, ArrowRight: 1, j: 1, PageDown: 1, ArrowUp: -1, ArrowLeft: -1, k: -1, PageUp: -1 };
    if (e.key in keys) { e.preventDefault(); world.goTo(world.active + keys[e.key]); }
    if (e.key === 'Home') world.goTo(0);
    if (e.key === 'End') world.goTo(events.length - 1);
  });

  ticks.forEach((t, i) => t.addEventListener('click', (e) => { e.preventDefault(); setList(false); world.goTo(i); }));
  cards.forEach((c, i) => {
    c.addEventListener('click', (e) => { if (!e.target.closest('a')) world.goTo(i); });
    c.addEventListener('focus', () => world.goTo(i));
  });
}

function setList(on) {
  document.body.classList.toggle('is-list', on);
  $('list').hidden = !on;
  $('view-toggle').textContent = on ? '3D view' : 'List view';
  $('view-toggle').setAttribute('aria-pressed', String(on));
}

function hasWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

$('view-toggle').addEventListener('click', () => setList(!document.body.classList.contains('is-list')));

main().catch((err) => {
  document.body.innerHTML = `<p style="padding:2rem">Could not load the timeline: ${err.message}.<br>
    Serve the folder over http (for example <code>python3 -m http.server</code>); browsers block JSON on file://.</p>`;
});
