// Minimal, accessible text splitter. The original text stays available to
// assistive tech through aria-label; the visual spans are aria-hidden.
export function splitText(el, { lines = false } = {}) {
  if (el.dataset.splitDone) return el._split;
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  el.setAttribute('aria-label', text);
  el.textContent = '';

  // Optional: each sentence becomes its own line (used by the hero headline)
  const groups = lines ? text.match(/[^.!?]+[.!?]*/g).map((s) => s.trim()) : [text];
  const chars = [];
  const words = [];

  for (const group of groups) {
    const host = lines ? document.createElement('span') : el;
    if (lines) {
      host.className = 'split-line';
      host.setAttribute('aria-hidden', 'true');
      el.appendChild(host);
    }
    group.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span');
      w.className = 'split-word';
      if (!lines) w.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const c = document.createElement('span');
        c.className = 'split-char';
        c.textContent = ch;
        w.appendChild(c);
        chars.push(c);
      }
      host.appendChild(w);
      words.push(w);
      if (wi < arr.length - 1) host.appendChild(document.createTextNode(' '));
    });
    if (lines) el.appendChild(document.createTextNode(' '));
  }
  el.dataset.splitDone = '1';
  el._split = { chars, words };
  return el._split;
}
