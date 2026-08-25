# Ozone

A family of small, cloud-themed, open-source desktop programs. Each one does a
simple thing well, looks like the others, and grows through plugins rather than
through options.

| Program | Is | Repository |
| --- | --- | --- |
| **Stratus** | A web browser, with cloud-shaped tabs | [GreenRu/Stratus](https://github.com/GreenRu/Stratus) |
| **Nimbus** | A text editor | [GreenRu/Nimbus](https://github.com/GreenRu/Nimbus) |
| **Cumulus** | A file explorer | *not started* |
| **Sky Box** | Installs and updates the others | *not started* |

The names are the clouds each program behaves like. Stratus is the flat, layered
sheet — the one you look *through*. Nimbus is the rain cloud, the one that
actually produces something. Cumulus is the heaped, many-lobed one: lots of small
things, piled. Sky Box is the box they all come in.

## This repository

Ozone itself holds no program code. It holds the two things the family shares:

| | |
| --- | --- |
| [docs/HOUSE-STYLE.md](docs/HOUSE-STYLE.md) | The shared style — naming, palette, motion, architecture, the rules that do not bend, plugins, testing |
| [skills/ozone/](skills/ozone/) | The same material written for a coding agent to read, as a Claude Code skill |

Each program is cloned into a folder beside them:

```
Ozone/
├── docs/ skills/       this repository
├── stratus/            GreenRu/Stratus
├── nimbus/             GreenRu/Nimbus
├── cumulus/            GreenRu/Cumulus
└── sky-box/            GreenRu/SkyBox
```

Those folders are ignored here, so nothing is ever committed twice.

```bash
git clone https://github.com/GreenRu/Ozone.git
cd Ozone
git clone https://github.com/GreenRu/Stratus.git stratus
git clone https://github.com/GreenRu/Nimbus.git nimbus
```

## What they have in common

- **One look.** A continuous sky fills the window; content floats on it as a
  rounded card. Controls live in a left column, never in a band across the top.
- **Two themes each, named for a time of day** that suits the program — Stratus
  has day and night, Nimbus has sunset and dusk — over the same variable names,
  so a theme written for one is comprehensible in another.
- **The same shape of code.** Electron, with three kinds of code that never
  blur: a main process that owns all state, a preload that enumerates every
  channel by hand, and a renderer that draws state and owns none of it.
- **The same plugin model.** A folder with a declarative `plugin.json`. No plugin
  code runs in the main process, in any of them, ever.
- **Nothing phones home.** If one ever needs the network for its own sake rather
  than yours, it is documented in that program's `PRIVACY.md` with a switch
  beside it.

## Using the skill

[skills/ozone/](skills/ozone/) is a [Claude Code](https://claude.com/claude-code)
skill. Install it by copying or linking it into your skills directory:

```bash
cp -r skills/ozone ~/.claude/skills/ozone
```

It carries the house style plus the traps each program has already paid for —
what Electron does with native views, how the suites are written, and why several
things are the way they are. The copy in this repository is the canonical one; if
you change it, copy it across again.

## Licence

GPL-3.0-or-later, here and in every program in the family.
