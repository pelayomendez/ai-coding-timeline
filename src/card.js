// One event -> one card element. Content comes from data/, the look from design/theme.css.
// The same element is used in the 3D scene and in the list view.

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// "2026-03" -> "Mar 2026". Built from parts so the month never shifts with the time zone.
export function formatMonth(date) {
  const [y, m] = date.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en', { month: 'short', year: 'numeric' });
}

export function renderCard(event, data) {
  const el = document.createElement('article');
  el.className = 'card';
  el.tabIndex = 0;
  el.dataset.id = event.id;
  el.style.setProperty('--tag', `var(--tag-${event.tags[0]})`);

  const tags = event.tags
    .map((t) => `<li style="--tag: var(--tag-${t})">${escape(data.tags[t] || t)}</li>`)
    .join('');
  const terms = event.terms
    .filter((t) => data.glossary[t])
    .map((t) => `<li><dfn>${escape(t.replace(/-/g, ' '))}</dfn> — ${escape(data.glossary[t])}</li>`)
    .join('');
  const sources = event.sources
    .map((s) => `<a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.label)} <span aria-hidden="true">↗</span></a>`)
    .join('');

  el.innerHTML = `
    <time datetime="${escape(event.date)}">${formatMonth(event.date)}</time>
    <h2>${escape(event.title)}</h2>
    <p>${escape(event.summary)}</p>
    <ul class="tags">${tags}</ul>
    ${terms ? `<ul class="terms">${terms}</ul>` : ''}
    ${sources ? `<div class="sources"><span class="sources-label">Read the source</span>${sources}</div>` : ''}`;
  return el;
}
