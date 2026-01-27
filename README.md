# Shindan Goban

A highly customizable, low-level React Goban component. It is a fork of
[Shudan](https://github.com/sabaki), but uses modern React rather than Preact,
is TypeScript-native instead of JS with a hand-written type definition file, and
is in the process of being extended to support an optional canvas renderer for
performance reasons.

Why the name? Shudan (手談) means "hand talk", an evocative euphemistic name
for the game of Go. "Shin" (新) can mean "new", reflecting that this is a newer
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
- Adds a `coordinatesOnOutside` prop (default false) that allows coordinates to be rendered outside the board (primarily for accessibility contrast purposes)
- Rewrites click/event handling to expose a unified semantic API: `onVertexClick`, `onVertexDrag`, `onVertexHover`, `onVertexLongPress` (default 500ms threshold, adjustable via the `longPressThreshold` prop) and `onVertexRightClick` handler props instead of individual mouse/touch events (e.g. `onVertexClickMouseUp` and `onVertexClickTouchStart`). This includes specific support for Apple Pencil, which often sends 'touchcancel' events instead of 'touchend'. This is a breaking change.

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