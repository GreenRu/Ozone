# Electron: views, layout, and the traps

Everything here was paid for in Stratus. Most of it applies to any Electron
program that embeds content — a browser, an editor with a live preview, an
explorer with a file preview pane.

## The law: your interface cannot draw over a native view

A `WebContentsView` is a **native child of the window**, not part of the
renderer's document. Whatever the renderer draws inside the rectangle a view
covers is not on screen. Every measurement will be correct. Nothing will be
visible.

Worse, the obvious way to check does not work: **`capturePage` on the renderer
captures the renderer alone**, so the missing part looks perfectly present. Only
a real screen capture — or measuring the view bounds against the element bounds —
tells you.

Got wrong three times in Stratus:

1. The address bar's preview card. It was chrome HTML for weeks and was invisible
   the entire time.
2. The menu on a tab. Chrome HTML, on the reasoning that the tab strip *is*
   chrome — but the menu is wider than the sidebar, so its right edge was cut off
   at exactly the point the page began. Measured: 21px clipped.
3. The menu on a droplet. The droplet bar itself is fine, since it sits *above*
   the content rather than over it — but a menu opened from it hangs down,
   straight into the page.

### So: anything that overlays content is its own view

And **one view serves every menu**. The pattern:

```js
// main: what the menu is for stays here, never goes to the view
_showMenu(what, menu, x, y) {          // what = { kind: 'cloud'|'droplet', id }
  this.menuOpen = { ...what, x, y };
  view.setBounds({ x: 0, y: 0, width: 1, height: 1 });   // parked until measured
  this.menuReady.then(() => view.webContents.send('menu:show', payload));
}

runMenu(action) {                       // the view hands back a name, nothing else
  const open = this.menuOpen;
  this.hideMenu();
  if (open.kind === 'droplet') this.runDropletMenu(open.id, action);
  else this.runTabMenu(open.id, action, open.selected);
}
```

The view is handed labels and hands back the name of whatever was chosen. What
that name *means* is decided in the main process, where the state is. Adding a
third kind of menu is a `thingMenu()` returning a description and a
`runThingMenu()` acting on a name — nothing else.

Three details that are not optional:

- **Create the view at startup, not on first open.** A `webContents.send` before
  `did-finish-load` is silently dropped, so the first menu opens empty. Queue
  behind a `menuReady` promise.
- **Park it at 1×1 until it reports its size.** Showing it at a guessed size
  flashes a card of the wrong shape. The page measures itself and sends
  `{ width, height, offsetX, offsetY }`; the main process places it at the
  pointer and pulls it back inside the window if it would hang off.
- **Re-add it to lift it.** `contentView.removeChildView(v)` then
  `addChildView(v)` is how you put something on top. Activating a tab adds its
  views, which puts them on top, so anything that must stay above is lifted
  again afterwards.

## Layout: the renderer measures, the main process places

The renderer keeps a placeholder element where the content goes, measures it, and
reports the rectangle; the main process converts that to view bounds.

```js
new ResizeObserver(reportContentBounds).observe(el.stage);
```

That one line means anything changing the layout — showing a bar, collapsing a
sidebar, entering full screen — re-reports for free. Showing Stratus's droplet
bar moves the content down 46px with no extra code.

## Stacking order

```
window
├── the chrome renderer      the interface, underneath everything
├── the content views        one per pane
├── the frame view           anything drawn around a content view
├── previews                 one per thing that can ask for one
└── the menu view            over all of it
```

## Other traps, in the order they cost time

**`executeJavaScriptInIsolatedWorld` is on `webContents`, not on `mainFrame`.**

**A filled animation outranks inline styles.** `animation: x 1s both` keeps its
last keyframe applying forever, silently beating every later attempt to set
`transform` or `opacity` from script. The state that takes over needs
`animation: none`.

**Guard everything destroyable.** `isDestroyed()` before touching a view or its
`webContents`, every time. During shutdown a render frame can be disposed while
the `WebContents` still reports itself alive, so wrap `send` in a try/catch too.

**`View.setBorderRadius` is all corners or none.** There is no per-corner form.

**`safeStorage` binds to the OS user *and* the profile's `Local State` file.**
Renaming the app moves the profile directory; copy `Local State` across with it
or every stored secret becomes undecryptable ciphertext. Set `app.setName()`
before anything reads a path, and before `app-ready` — Chromium's OSCrypt takes
its key as it initialises.

**Smart App Control (Windows 11) blocks unsigned, unknown-reputation exes.** The
verdict is pinned to a *file instance*: a byte-identical copy runs fine, and
`npm rebuild electron` clears it. Look for CodeIntegrity events 3033/3077. Do not
suggest disabling SAC — it cannot be re-enabled without reinstalling Windows.

**One throw stops the rest of a loop.** Filling a form walks a list of fields, so
an exception on the third leaves the first two filled and the rest empty, which
reads exactly like "the last fields were not recognised". The actual cause was
handing a `<select>` the `value` setter off `HTMLInputElement.prototype`, which
throws. When *some* of a sequence worked, suspect a throw before suspecting the
matching.

**Assign through the native setter, per element kind.** Frameworks patch the
`value` property, so a plain assignment is invisible to them:

```js
const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
  : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
el.dispatchEvent(new Event('input', { bubbles: true }));
el.dispatchEvent(new Event('change', { bubbles: true }));
```
