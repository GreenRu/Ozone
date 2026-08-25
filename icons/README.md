# Icons

Every icon the Ozone programs use, in one place. They come from
[css.gg](https://css.gg) by [Astrit](https://github.com/astrit).

## Which version, and why it matters

These are taken from **tag `2.1.1`**, which is MIT licensed — the copy of the
licence beside this file is that one.

That is deliberate. From version `2.1.2` onward css.gg changed to a licence that
permits personal, non-commercial use only, forbids derivative works, and
requires written permission for anything commercial. Ozone is GPL-3.0-or-later,
which has to grant everyone downstream the right to use, change and redistribute
the whole program, commercially included. Those two cannot both be true of one
file, so the newer icons cannot ship here however good they are.

`2.1.1` has every icon these programs need and looks the same, so nothing is
lost by staying on it. If a future icon is only in a later release, it needs
drawing by hand rather than taking.

## What is here

Only the icons actually in use — 29 of them. The set has around 700; carrying
the rest would be carrying files nobody reads.

Some are drawn with `fill="currentColor"` and some with `stroke="currentColor"`,
and both are left exactly as they came. That is why nothing in the programs sets
`fill` or `stroke` on an icon: they set `color` and a size, and each icon paints
itself the way it was drawn.

## How the programs use them

They are not loaded at runtime. `tools/build-icons.js` in this directory reads
this folder and writes `src/shared/icons.js` into a program — one file holding
every icon as markup, attached to `window.Icons`.

```bash
node tools/build-icons.js stratus
node tools/build-icons.js nimbus
```

The generated file is committed to each program, so a program cloned on its own
still has its icons. That is the same arrangement `clouds.js` and `theme.js`
already use: this directory is where they are decided, and each program carries
a copy.

In the markup an icon is asked for by name, and painted once at startup:

```html
<button class="tool-btn" id="back" data-icon="chevron-left"></button>
```

```js
Icons.paint(document);          // fills every [data-icon] in one pass
el.reload.innerHTML = Icons.svg('sync');   // or one at a time
```

## Adding one

Take it from `2.1.1`, drop the `.svg` here, run the builder for each program
that needs it, and use its name. Do not edit the file — an icon that has been
altered is no longer the one the licence covers, and the next person to update
the set will overwrite it.
