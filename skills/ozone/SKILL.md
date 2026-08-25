---
name: ozone
description: House style and hard-won practice for Ozone, a family of small cloud-themed desktop programs - Stratus (browser), Nimbus (text editor), Cumulus (file explorer) and Sky Box (the manager). Use when building, extending or reviewing any of them, when starting a new one in the family, or for any small Electron desktop app that should match their look, architecture, plugin model or testing discipline.
---

# Ozone

A family of small, cloud-themed, open-source desktop programs. Simple by
default, extensible through plugins, nothing phoning home.

| Program | Is | Repository |
| --- | --- | --- |
| **Stratus** | Web browser — the reference implementation | `GreenRu/Stratus` |
| **Nimbus** | Text editor | `GreenRu/Nimbus` |
| **Cumulus** | File explorer | `GreenRu/Cumulus` |
| **Sky Box** | Installs and updates the others | `GreenRu/SkyBox` |

Each program has its own repository, checked out side by side under
`C:/Users/sutto/Ozone/` — `stratus/`, `nimbus/`, and so on. The Ozone directory
is itself the family repository (`GreenRu/Ozone`) and holds only what they
share: `docs/HOUSE-STYLE.md` and this skill.

**Stratus is the reference implementation.** When a question is about how
something is done here, read its code before inventing an answer — its
`docs/ARCHITECTURE.md` and `docs/TESTING.md` are more detailed than this skill.
When starting a new program, this skill and `docs/HOUSE-STYLE.md` are the spec.

## Read first, by task

| Doing | Read |
| --- | --- |
| Anything with embedded content, overlays, menus, or view layout | `references/electron.md` |
| Writing or fixing a suite; anything failing you cannot explain | `references/testing.md` |
| Any interface work — colours, shapes, motion, wording | `references/style.md` |
| Plugin host, or a plugin | `references/plugins.md` |

## The short version

**Naming.** The theme is weather and it must earn its place. In Stratus a tab is
a *cloud* (they stack, drift, merge, split); a kept page is a *droplet* (a cloud
leaves them behind); the content area is the *sky*. Rename the layer people read,
never the layer machines read — droplets are stored under the key `bookmarks`,
because that is what is on disk and what every other program calls them. Keep the
plain word reachable: `stratus://bookmarks` still lands on the droplets page.

**Themes come in pairs, named for a time of day that suits the program**, with
the same variable names underneath so a theme written for one is comprehensible
in another. Stratus has **day** and **night**; Nimbus has **sunset** and **dusk**.
The lighter one is always the default. A program's icon is drawn from its own
palette, so the family reads as a family without any two looking alike.

**Architecture.** Electron. Three kinds of code that never blur: `main/` owns all
state and every privileged call; `preload/` is the only bridge and enumerates
every channel by hand; `renderer/` draws state and owns none of it. Always
`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Never expose
`ipcRenderer` — expose a hand-written object.

**State.** The interface gets a full snapshot because it draws all of it. A
content page gets *a knock at the door with nothing in it* and asks for exactly
what it is allowed to have.

**The law about native views.** A `WebContentsView` is a child of the window, not
part of your document: **your interface cannot draw over it.** Anything overlaying
content must be its own view. `capturePage` on the renderer will not reveal the
problem — it captures the renderer alone, so the missing part looks present. This
has been got wrong three times in Stratus. See `references/electron.md`.

**Secrets.** Encrypt with `safeStorage`; if the platform cannot encrypt,
**refuse to save** rather than falling back to plaintext. Keep only what a list
must show. The page never states its own origin — read it from the sending view's
URL, in the main process. With several entries matching, fill none.

**Plugins.** A folder with a declarative `plugin.json`. **No plugin code in the
main process, ever** — that is the whole security model. Everything off until
switched on.

**Dependencies.** None unless there is genuinely no choice. Firefox's compressed
bookmark backups are decoded in forty lines rather than by adding a package.

## Working practice

**Enumerate, then ask.** Before building a feature, work out the whole space of
what could be built, show it grouped and costed, and ask which parts to do. This
holds for every program in the family and for every request, however small the
wording sounds - "add the basic features" is not a specification, and the picture
behind those words is never the same as the one you would build from them.

Never pick a subset quietly, and never build the lot on the assumption that more
is better. List it, say what each part costs and what has to come first, ask, and
then build exactly what came back - in full. The list is worth as much as the
code: it is the only point at which the shape of a program is cheap to change.

The exception is a defect. A bug has one correct behaviour, so asking which parts
of "working properly" to implement is noise - fix it, and say what you found.

**Measure; do not reason.** Pixel-sample, probe geometry, read event logs. Most
expensive bugs here looked like one thing and were another — "the last fields
were not recognised" was an exception thrown on the third field, abandoning the
rest.

**Write a suite for it, run it, then boot the real app.** Suites construct the
app object by hand and therefore never execute the entry point; `npx electron .`
catches what 28 green assertions miss. Full discipline in
`references/testing.md`.

**Kill strays before every run:** `taskkill //F //IM electron.exe`. An occluded
window pauses its CSS animations and throttles its timers, which fails timing
assertions with nothing wrong in the code.

**Comments explain why, never what.** Record a trap where it was set — the note
that saves the next person an afternoon is worth more than the fix. User-facing
text is a sentence saying what will happen ("No droplets yet — Ctrl+D keeps a
page here"), not a label ("Empty").

**Beware backslashes in patch scripts.** Writing source through a shell heredoc
can collapse `\\` to `\`, turning `\b` in a regex into byte `0x08`. The file
parses, the regex is valid, and it matches nothing — and `grep` shows it as if
the backslash were merely missing, because the terminal obeys the backspace.
Build backslashes as `chr(92)`, and check with `grep -cP '\x08'`. A Windows path
inside a heredoc breaks Python outright; write such files directly instead.

## Starting a new program in the family

1. Copy `src/shared/clouds.js` and `theme.js` from Stratus. They have no
   dependencies and know nothing about browsers.
2. Take the variable names, radii and easings from `references/style.md`
   verbatim; pick the program's own two palettes for the values.
3. Set up `main/ preload/ renderer/ pages/ shared/ plugins/ docs/` and the
   `Store` (one JSON file in user-data, defaults merged, on-disk keys permanent).
4. Register `<name>://` for internal pages.
5. Port the plugin host before you need it — retrofitting one means unpicking
   every assumption about who may touch state.
6. Draw the icon from the program's own palette with `tools/make-icon.ps1`.
7. GPL-3.0-or-later, notice at the head of each entry point, and the five docs
   listed in `docs/HOUSE-STYLE.md`.
