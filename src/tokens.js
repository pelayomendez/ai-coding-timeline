// Turns design/tokens.json into CSS custom properties, so design/theme.css and the 3D scene
// read the same values. Example: tokens.color.bg -> --color-bg, tokens.tags.models -> --tag-models.
export function applyTokens(tokens, root = document.documentElement) {
  for (const group of ['color', 'font', 'tags']) {
    const prefix = group === 'tags' ? 'tag' : group;
    for (const [name, value] of Object.entries(tokens[group] || {})) {
      root.style.setProperty(`--${prefix}-${name}`, value);
    }
  }
}

export async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} loading ${url}`);
  return res.json();
}
