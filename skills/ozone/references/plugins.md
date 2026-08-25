# Plugins

Every program in the family takes plugins, and they all use the same shape: **a
folder with a `plugin.json` beside whatever files it names.**

## The one rule

**There is no plugin code in the main process, and there is not going to be.**
That is the entire security model, not a detail of it.

Manifests are **declarative**: a plugin says what it wants applied and where, and
the program applies it. Scripts a plugin injects into content run in an isolated
world, via `webContents.executeJavaScriptInIsolatedWorld(WORLD, [{ code }])` —
note that method is on `webContents`, not on `mainFrame`.

A plugin therefore cannot: reach the profile, read settings, passwords, history
or kept pages, open arbitrary IPC channels, or require Node modules. A plugin
*page* gets its own narrow bridge with the handful of calls it needs.

## The manifest

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "One line about what it does.",

  "shortcuts": { "mp": "https://example.com/search?q=%s" },
  "commands":  [{ "id": "toggle", "label": "Toggle it",
                  "accelerator": "CommandOrControl+Alt+M" }],
  "styles":    [{ "matches": ["*://*.example.com/*"], "css": "skin.css" }],
  "scripts":   [{ "matches": ["<all_urls>"], "js": "content.js" }],
  "pages":     { "stratus://my-plugin": "page.html" },
  "themes":    [{ "id": "custom", "name": "Custom",
                  "fields": [], "variables": {} }],
  "toolbar":   [{ "id": "open", "label": "Open it", "after": "back" }]
}
```

Not every program needs every key — an editor has no `shortcuts` in the
search-keyword sense — but keep the names identical where the meaning is
identical, so a plugin author only learns them once.

## Themes as data

A theme plugin needs no code at all. `fields` declares the controls the settings
page renders; `variables` maps CSS variable names onto those fields, with an
optional alpha:

```json
"variables": {
  "--accent":    "@accent",
  "--droplet":   "@droplet",
  "--field-line": "@field-line 0.1"
}
```

Stratus's `own-theme` plugin exposes all 40 interface colours and a toggle for
whether the theme asks websites for their dark variant, and contains zero
JavaScript. Use it as the worked example.

## Loading

Two folders are read: the one in the repository (bundled) and the one inside the
profile (installed). A plugin in the profile replaces a bundled one with the same
id, so a user can override anything that ships.

**Everything is off until switched on.** The store keeps the list of what is
*on*, so dropping a folder in makes a plugin available, not active. Settings gets
a switch for each and a reload button for when one has just been edited.

## Ship worked examples

Bundle two or three real plugins, all switched off, each demonstrating one thing:

| Kind | Demonstrates |
| --- | --- |
| A theme | Contributing colours with no code |
| An injector | Styles and scripts into content, plus a command |
| One with a page | A toolbar button, its own page, and the plugin bridge |

They double as the test suite for the host, and they are the documentation
people actually read.

## When something is wrong

A manifest that fails to parse must not take the program down, and must say so
somewhere the user can see — a line in Settings, not a console message. The host
validates and skips; it never trusts a field's shape.
