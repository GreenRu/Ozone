#!/usr/bin/env node
'use strict';

/*
 * Turn the shared icon folder into one file a program can load.
 *
 * The icons are not read at runtime. A browser page under a strict
 * content-security policy cannot fetch a pile of svg files, and an <img> tag
 * cannot take `currentColor` - which is the whole reason these icons work in
 * both themes. So they are baked into a single script that attaches to
 * `window.Icons`, and that script is committed to each program.
 *
 *   node tools/build-icons.js stratus
 *   node tools/build-icons.js nimbus
 *
 * Every icon keeps the fill or stroke it was drawn with. Some of the set is
 * drawn one way and some the other; overriding either here would flatten half
 * of them.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ICONS = path.join(ROOT, 'icons');

const target = process.argv[2];
if (!target) {
  console.error('which program? e.g. node tools/build-icons.js stratus');
  process.exit(1);
}

const out = path.join(ROOT, target, 'src', 'shared', 'icons.js');
if (!fs.existsSync(path.dirname(out))) {
  console.error(`no such program: ${path.dirname(out)}`);
  process.exit(1);
}

/** The inside of an svg file, with the wrapper and its whitespace taken off. */
function innards(source) {
  const open = source.indexOf('>', source.indexOf('<svg'));
  const close = source.lastIndexOf('</svg>');
  return source
    .slice(open + 1, close)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const names = fs.readdirSync(ICONS)
  .filter((f) => f.endsWith('.svg'))
  .sort();

const entries = names.map((file) => {
  const name = path.basename(file, '.svg');
  const body = innards(fs.readFileSync(path.join(ICONS, file), 'utf8'));
  return `  '${name}': '${body.replace(/'/g, "\\'")}'`;
});

const written = `'use strict';

/*
 * Icons, from css.gg 2.1.1 by Astrit - https://css.gg - under the MIT licence.
 *
 * GENERATED. Do not edit: run \`node tools/build-icons.js ${target}\` from the
 * Ozone directory, which reads \`icons/\` and rewrites this file. The icons
 * themselves live there, along with why that version and not a later one.
 *
 * Each icon keeps the fill or stroke it was drawn with, so nothing here or in
 * any stylesheet should set either. Set \`color\` and a size; the icon does the
 * rest, in both themes.
 */
(function (global) {
  const PARTS = {
${entries.join(',\n')}
  };

  /** One icon, as markup. An unknown name draws nothing rather than throwing. */
  function svg(name, extra) {
    const body = PARTS[name];
    if (!body) return '';
    const cls = extra ? \` class="\${extra}"\` : '';
    /*
     * The fill="none" is not decoration. Every icon in the set carries it on
     * the root element, and the drawn ones set their own fill on the path.
     * Leave it off and svg's default takes over - which is solid black - so a
     * stroked icon such as the droplet arrives as a filled blob.
     */
    return \`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"\${cls}>\${body}</svg>\`;
  }

  /**
   * Fill in every element that asked for an icon by name.
   *
   * Markup says which icon it wants and nothing about how it is drawn:
   *   <button class="tool-btn" id="back" data-icon="chevron-left"></button>
   */
  function paint(root) {
    for (const node of (root || document).querySelectorAll('[data-icon]')) {
      const wanted = node.dataset.icon;
      if (node.dataset.iconPainted === wanted) continue;
      node.insertAdjacentHTML('afterbegin', svg(wanted));
      node.dataset.iconPainted = wanted;
    }
  }

  global.Icons = { svg, paint, names: Object.keys(PARTS) };
})(typeof window === 'undefined' ? globalThis : window);
`;

fs.writeFileSync(out, written, 'utf8');
console.log(`wrote ${path.relative(ROOT, out)} - ${names.length} icons`);
