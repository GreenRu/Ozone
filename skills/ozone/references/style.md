# Look, motion and wording

One continuous sky fills the window; content floats on it as a rounded card.
Controls live in a left column, not a band across the top. Nothing is square,
nothing is grey, nothing is loud.

## Palette

Colours are CSS variables, never literals, so a theme plugin can replace all of
them. Day:

```css
:root {
  --sky-top: #74b1e5;   --sky-bottom: #b6dbf6;
  --cloud: #ffffff;     --cloud-idle: #dcecfb;   --cloud-hover: #eef6fe;
  --text: #22364c;      --text-dim: #5f7a96;     --text-on-sky: #24425f;
  --field: #ffffff;     --field-line: rgba(15, 23, 42, 0.10);
  --panel: rgba(255, 255, 255, 0.74);            /* frosted, over the sky */
  --panel-line: rgba(255, 255, 255, 0.55);
  --hover: rgba(255, 255, 255, 0.5);
  --accent: #2472cf;    --droplet: #2b9fd6;      --danger: #d94a4a;
  --stage: #eaf3fc;     --bubble: #ffffff;
  --shadow-card: 0 10px 30px rgba(16, 44, 76, 0.18);

  --page-radius: 16px;  --gutter: 10px;
  --ui-font: "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif;
  --brand-font: "Comfortaa", var(--ui-font);
}
```

Night is the same variables at different values — never a filter:

```css
[data-theme="night"] {
  --sky-top: #16243c;   --sky-bottom: #080e1a;
  --cloud: #43597c;     --cloud-idle: #22314c;   --cloud-hover: #2c3d5c;
  --text: #dbe6f6;      --text-dim: #8299b9;     --text-on-sky: #c3d5ec;
  --field: #182440;     --field-line: rgba(255, 255, 255, 0.09);
  --panel: rgba(255, 255, 255, 0.07);
  --hover: rgba(255, 255, 255, 0.10);
  --accent: #6aa9ff;    --droplet: #59c4f2;
  --stage: #0d1524;     --bubble: #1b2740;
}
```

Take the rest from `src/renderer/styles.css` in Stratus rather than inventing
them — the full set is 40 variables and a theme plugin edits every one.

The window controls are drawn by the system and need a real colour, not a
variable: pass the theme's own sky to `setTitleBarOverlay`, and set
`nativeTheme.themeSource` so system menus follow.

## Shapes

| Thing | Radius |
| --- | --- |
| Buttons, chips, fields, pills | `999px` |
| Cards, menus, sheets | `22px` |
| The content card | `var(--page-radius)` (16px) |

Fills that overlap must be **opaque**. Cloud lobes cross each other, and alpha
compounds where they do and exposes the seams.

## Clouds

`src/shared/clouds.js` — copy it; no dependencies, knows nothing about browsers.

A cloud is a rounded body with lobes rising off its top edge. Lobes carry
`background: inherit`, sit at `z-index: -1`, and are `transform: translateX(-50%)`
from their centre, so the whole thing reads as one silhouette under one shadow.

```js
CloudShape.buildLobes(element, `menu-${id}`, {
  width: element.offsetWidth, base: 30, spacing: 84,
  minLobes: 2, maxLobes: 4, overhang: 0, widthRatio: [1.5, 2.6]
});
```

The seed is hashed with FNV-1a and drives a mulberry32 PRNG — **not
`Math.random`** — so each cloud differs from its neighbours and keeps its own
shape for life instead of re-rolling on every render. Seed by what the thing *is*
(`menu-${id}`, `cloud-${tabId}`), never by its index.

**Leave room for the lobes.** They rise about half their height above the body,
and one near an edge reaches out by half its width. In a view of its own, that
means padding — `body { padding: 34px 44px 8px }` in Stratus's menu, arrived at by
measuring six generated shapes for the worst overflow. Guessing clips them.

Ambient touches, each in `src/shared/`: `stars.js` (night, slow brightness
drift), `birds.js` (day). Both belong on content pages only — the interface stays
still.

## Icons

css.gg, from tag **`2.1.1`** - the last MIT one. Later versions are
non-commercial-only and forbid derivative works, which cannot ship in a
GPL-3.0-or-later program. The set lives in `Ozone/icons/`; `tools/build-icons.js`
bakes it into `src/shared/icons.js` per program.

- Never set `fill` or `stroke` on an icon: part of the set is filled and part
  stroked, both on `currentColor`. Set `color` and a size only.
- Keep `fill="none"` on the wrapping `<svg>`. Without it svg's default takes
  over, which is solid black, and every stroked icon arrives as a blob.
- Never edit an icon. A state the set has no mark for - a muted speaker - gets
  drawn in CSS beside it, not into it.
- A program's own mark is not an icon and stays hand-drawn.

```html
<button class="tool-btn" id="back" data-icon="chevron-left"></button>
```

## Motion

Everything that appears, grows or is pressed overshoots and settles. Nothing
eases linearly; nothing is instant.

```css
--ease:       cubic-bezier(0.22, 1, 0.36, 1);      /* moving between places */
--spring:     cubic-bezier(0.34, 1.56, 0.64, 1);   /* the jelly */
--spring-big: cubic-bezier(0.22, 1.7, 0.36, 1);    /* arrivals */
--t-fast: 160ms;  --t-mid: 260ms;  --t-slow: 380ms;
```

**Motion says what happened.** A droplet arrives by falling and squashing, not by
spinning. A closing cloud drifts down under the new-tab button, rains straight
down, and leaves a puddle at the foot of the screen. Merging clouds do not rain —
they slide up under the one they joined. If an animation would look the same for
two different events, it is decoration and can go.

Timings that appear in both CSS and JS must be written down in both places with a
comment saying so, and kept in step.

## Wording

**User-facing text is a sentence saying what will happen**, not a label:

- "No droplets yet — Ctrl+D keeps a page here", not "Empty".
- "This system has no keystore, so cards cannot be saved", not "Unavailable".
- "asks for code" / "code saved" on a card row, so it says what it will actually
  do at a checkout.

Count things in the program's own words: "2 clouds", not "2 tabs".

Destructive settings state their consequence in full where the switch is:
"Turning this off destroys every code already kept — turning it back on does not
bring them back."

## Comments and commits

**Comments explain why, never what.** If a line needs saying what it does, rename
something instead. Prefer a short paragraph above a tricky block to a string of
end-of-line notes.

Plain sentences, sentence case, no shouting, no `NOTE:`. Write for whoever
maintains it next year.

**Record a trap where it was set.** When something took an afternoon, the comment
that saves the next person that afternoon is worth more than the fix:

```js
// The lobes take the body's fill and sit behind it, so the whole card reads as
// one cloud rather than a box with bumps on top.
```

Commit messages: a statement for a subject line, no category prefix, then prose
saying what changed and why it is that way. Mention what the tests found, and
what was deliberately *not* done.
