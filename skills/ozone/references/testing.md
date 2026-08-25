# Testing

No framework. A suite is a script the program's own runtime executes, because the
behaviour worth testing lives in a window manager, a compositor, a keystore and a
real event loop.

```bash
taskkill //F //IM electron.exe        # first, always
npx electron suite.js
```

Suites live outside the repository, in the working scratch directory. They are
throwaway by design and there are twenty of them.

## The skeleton

```js
const { app, ipcMain } = require('electron');
const path = require('path'); const os = require('os'); const fs = require('fs');

app.setName('Stratus');                                   // before any path is read
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'stratus-thing-'));
app.setPath('userData', PROFILE);

const results = [];
const check = (n, ok, extra) => {
  const line = (ok ? 'PASS  ' : 'FAIL  ') + n + (extra ? '  ' + extra : '');
  results.push(line);
  console.log(line);                    // as it happens, so a hang says where
};
setTimeout(() => { report('WATCHDOG'); app.exit(1); }, 150000);
process.on('uncaughtException', (e) => { console.log('UNCAUGHT', e.stack); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log('REJECTED', e.stack); app.exit(1); });

app.whenReady().then(async () => {
  /* ... */
  app.exit(results.every((r) => r.startsWith('PASS')) ? 0 : 1);
});
```

## Rules

**A throwaway profile per suite.** Never the real one. A suite that reads the
real profile passes or fails on whatever happens to be saved there — one had been
asserting against zero saved logins for weeks, because the profile it named had
been renamed out from under it and was empty.

**Kill strays first.** The single-instance lock silently hands your launch to an
older process, so stale code appears to run. Worse: a stray window *covers* the
new one, and an occluded window pauses its CSS animations and throttles its
timers — three assertions once failed reproducibly with nothing wrong in the code.

**Print each assertion as it runs.** A suite that only prints at the end goes
silent exactly when it hangs.

**Assert the value, not the declaration.** That an animation is declared to last
three seconds proves nothing about what it does. Sample the opacity halfway
through. That a handler is registered proves nothing about what it does when
called.

**Name assertions as sentences**, so the output reads as a description of the
program:

```
PASS  a code that predates the last switch-off is not offered
PASS  even though the file still holds one
PASS  while one saved since is
```

**Print the evidence in the third argument**, so a failure explains itself
without a second run.

**Finish with a real boot.** Every suite constructs the app object by hand, so
none of them executes `src/main/index.js`. A missing `let plugins;` shipped past
28 green assertions. `npx electron .` catches it in four seconds.

## What a suite cannot see

**Synthetic events do not exercise the real input path.** A dispatched
`MouseEvent` skips the pointer path entirely, so a suite can pass green while
real clicks do nothing. Two bugs found this way: `preventDefault()` on a
`pointerdown` cancels the compatibility `mousedown`/`click` that follow, and
`sendInputEvent` never reaches a non-focused child view. Pointer behaviour needs
a real OS click — PowerShell `mouse_event`, declaring `SetProcessDPIAware` first,
without which Windows rescales the coordinates.

**A window with `show: false` never gives its document focus.** `focusin`,
`:focus-within` and `document.activeElement` then quietly never happen. Six
assertions failed that way with nothing wrong in the code.

**`capturePage` on the renderer does not show native views.** See
`electron.md` — the missing part looks perfectly present.

**A transparent view captures onto white**, so white-on-white detail is invisible
in the shot. Assert the geometry instead: how many lobes, are they above the
card, do they share its fill, are they inside the view.

## Harness bugs that look like product bugs

Each of these produced a convincing false failure:

- **`querySelectorAll` order is DOM order, not visual order.** For anything
  stacked or absolutely positioned, sort by measured position.
- **Selectors that catch elements mid-animation.** A closing item is still in the
  DOM: `.tab:not(.adrift):not(.joining)`.
- **Assuming the first item created is the first item shown.** The program opens
  its own new tab first.
- **`querySelector` picking one of many.** "Does a cloud's lobe overhang its
  edge" tested whichever cloud happened to be first; shapes are seeded per
  element, so one of them tucks its lobes in. Assert across all of them.
- **Matching a menu item by exact text** when the text carries the shortcut:
  `'Reload cloud'` is really `'Reload cloudCtrl+R'`. Match the start.
- **Searching the whole page for a secret** when the form's *placeholder* is a
  specimen card number. Scope the search to the list.

## When something fails

Measure it; do not reason about it. Write a probe that prints the geometry, the
computed styles, the event log — whatever the assertion depended on. Nearly every
expensive bug here looked like one thing and was another, and the probe took two
minutes while the theory took twenty.

If several suites fail at once after a rename, check whether they are asserting
the *old* wording or an *old count* — that is an intentional change and the
suites need updating, not the program. Say so explicitly rather than quietly
editing them.
