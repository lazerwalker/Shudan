# Shindan Goban

A highly customizable, low-level React Goban component. It is a fork of [Shudan](https://github.com/sabaki), but uses modern React rather than Preact, is TypeScript-native instead of JS with a hand-written type definition file, and is in the process of being extended to support an optional canvas renderer for performance reasons.

The rest of this doc is still written for Shudan, but should be more or less the same. 

(Why the name? Shudan (手談) means "hand talk", an evocative euphemistic name for the game of Go. "Shin" (新) can mean "new", reflecting that this is a newer version of Shudan, but as a whole word Shindan (診断) also means "diagnosis", which feels appropriate for a library used in tools to help analyze Go games).

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

## Build Demo

Make sure you have Node.js v8 and npm installed. First, clone this repository
via Git, then install all dependencies with npm:

```
$ git clone https://github.com/SabakiHQ/Shudan
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

Open `demo/index.html` in your browser to run demo. Alternatively, use
`build-demo-react` and `watch-demo-react` to build the React-based demo.
