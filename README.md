# Shindan Goban

A highly customizable, low-level React Goban component. It is a fork of
[Shudan](https://github.com/sabaki), but has many improvements for performance and developer experience (see below).

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

## Differences from Shudan

- Uses React, not Preact
- Uses TypeScript natively, and modern React (e.g. SFCs instead of class components)
- Adds a `coordinatesOnOutside` prop (default false) that allows coordinates to
  be rendered outside the board (primarily for accessibility contrast purposes)
- Rewrites click/event handling to expose a unified semantic API:
  `onVertexClick`, `onVertexDrag`, `onVertexHover`, `onVertexLongPress` (default
  500ms threshold, adjustable via the `longPressThreshold` prop) and
  `onVertexRightClick` handler props instead of individual mouse/touch events
  (e.g. `onVertexClickMouseUp` and `onVertexClickTouchStart`). This includes
  specific support for Apple Pencil, which often sends 'touchcancel' events
  instead of 'touchend'. This is a breaking change.
- `BoundedGoban` guarantees that you will be given a Goban with the exact given `width` and `height`. It automatically calculates the largest possible `vertexSize` for a given size, and fills in any extra space as padding within the board. You can pass in both `width` and `height`, or only one. The new autosizer works synchronously, so the `onResized` prop has been removed

## Documentation

See [documentation](./docs/README.md).

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

Open `demo/index.html` in your browser to run demo. A
