# Shindan Goban

A highly customizable, low-level React Goban component. It is a fork of
[Shudan](https://github.com/sabaki), but has many improvements for performance
and developer experience (see below).

Why the name? Shudan (手談) means "hand talk", an evocative euphemistic name for
the game of Go. "Shin" (新) can mean "new", reflecting that this is a newer
version of Shudan, but as a whole word Shindan (診断) also means "diagnosis",
which feels appropriate for a library used in tools to help analyze Go games.

![Screenshot](./screenshot.png)

## Features

- Resizable
- Board coordinates
- Easy customization
- Fuzzy stone placement
- Stone placing animation
- Board and stone markers
- Lines and arrows
- Heat and paint map
- Busy state
- Partial board

## Documentation

See [documentation](./docs/README.md).

## Differences from Shudan

- Uses React, not Preact
- Uses TypeScript natively, and modern React (e.g. SFCs instead of class
  components)
- Adds a `coordinatesOnOutside` prop (default false) that allows coordinates to
  be rendered outside the board (primarily for accessibility contrast purposes)
- Rewrites click/event handling to expose a unified semantic API:
  `onVertexClick`, `onVertexDrag`, `onVertexHover`, `onVertexLongPress` (default
  500ms threshold, adjustable via the `longPressThreshold` prop) and
  `onVertexRightClick` handler props instead of individual mouse/touch events
  (e.g. `onVertexClickMouseUp` and `onVertexClickTouchStart`). This includes
  specific support for Apple Pencil, which often sends 'touchcancel' events
  instead of 'touchend'. This is a breaking change.
- `BoundedGoban` guarantees that you will be given a Goban with the exact given
  `width` and `height`. It automatically calculates the largest possible
  `vertexSize` for a given size, and fills in any extra space as padding within
  the board. You can pass in both `width` and `height`, or only one. The new
  autosizer works synchronously, so the `onResized` prop has been removed
- When `fuzzyStonePlacement` and `animateFuzzyStones` are true in Shudan, both
  newly-placed stones and their neighbors are given the `animated` class.
  Shindan splits that out into a `"placed"` class for a newly-placed stone, and
  `"shifted"` for stones that are merely changing their fuzzily-shifted
  position. This may be useful if you are e.g. implementing your own CSS-based
  stone placement animations
- There is a new `renderer` prop that can be either `"dom"` or `"canvas"`
  (defaults to `"dom"` today, will likely change as this library stabilizes).
  The DOM renderer should be identical to Shudan (minus a few small bugfixes),
  while the canvas renderer is brand new. It renders the grid, hoshis, and
  stationary solid-colored stones using canvas; everything else (ghost stones,
  markers, paint, selection, heat map, dimmed stones, and stones shifting due to
  being placed or shifted by placement) still render as DOM nodes

## Build Demo

Make sure you have Node.js v8 and npm installed. First, clone this repository
via Git, then install all dependencies with npm:

```
$ git clone https://github.com/lazerwalker/shindan
$ cd Shudan
$ npm install
```

Use the `build-demo` script to build the demo project:

```
$ npm run build-demo
```

You can use the `watch-demo` command for development:

```
$ npm run watch-demo
```

Open `demo/index.html` in your browser to run demo.

## Public Roadmap

- Get the canvas renderer more production-ready, and make it the default
- First-class theme support for [Sabaki](http://github.com/sabakihq/sabaki)
  themes. This mostly works (as it does undocumented in vanilla Shudan), but
  needs updating for the canvas renderer since we statically load CSS once at
  load-time
- Add first-class screen-reader support. For the DOM renderer, this likely means
  some ARIA tags, for the canvas renderer it will mean a dedicated accessibility
  DOM tree
- Tenuki extends Shindan with a component that allows zooming and panning a
  board without changing its wrapper size. I'd like to bring that in-house as an
  'official' feature, which will also make it easier for the canvas renderer to
  support dynamic rescaling (it is currently low-resolution when zoomed)
- Add optional alternative styling for annotations to make them more legible on
  small screens (e.g. phones)
