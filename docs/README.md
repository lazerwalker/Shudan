# Documentation

## Guide

### About Shudan

Shindan is the Goban component that powers the upcoming app
[Tenuki](https://forums.online-go.com/t/tenuki-a-new-ios-ogs-client/58792/59).
It is based on [Shudan](https://github.com/SabakiHQ/shudan), which powers
[Sabaki](https://sabaki.yichuanshen.de). It is licensed under the MIT license
and supports modern browsers.

Shudan is written for [React](https://reactjs.org), and is written in
TypeScript, although applications written in vanilla JS should be able to use it
just fine.

### Installation

You can install shindan from npm.

`npm install shindan-goban`

To use this module, require it as follows:

```ts
import { Goban } from "shindan";

const CustomComponent = (props) => (
  <Goban vertexSize={24} signMap={props.signMap} />
);
```

Don't forget to include the `css/goban.css` file in your HTML:

```html
<link rel="stylesheet" href="path/to/css/goban.css" />
```

### Board Representation

The board is represented by an array of arrays. Each of those subarrays
represent one row, all of the same size. We shall refer to this structure as a
**map**. For `signMap`, the subarrays consists of integers: `-1` denotes a white
stone, `1` a black stone, and `0` represents an empty vertex

#### Example

<!-- prettier-ignore -->
```js
[
  [ 0,  0,  1,  0, -1, -1,  1,  0, 0],
  [ 1,  0,  1, -1, -1,  1,  1,  1, 0],
  [ 0,  0,  1, -1,  0,  1, -1, -1, 0],
  [ 1,  1,  1, -1, -1, -1,  1, -1, 0],
  [ 1, -1,  1,  1, -1,  1,  1,  1, 0],
  [-1, -1, -1, -1, -1,  1,  0,  0, 0],
  [ 0, -1, -1,  0, -1,  1,  1,  1, 1],
  [ 0,  0,  0,  0,  0, -1, -1, -1, 1],
  [ 0,  0,  0,  0,  0,  0,  0, -1, 0]
]
```

### Vertex Representation

Board positions are represented by a **vertex**, i.e. an array of the form
`[x, y]` where `x` and `y` are non-negative integers, zero-based coordinates.
`[0, 0]` denotes the upper left position of the board.

### Styling

Shudan only uses `<div>`, `<span>`, `<svg>`, `<rect>`, and `<circle>` elements
with class names prefixed with `shudan-`. Override the background image for
certain classes to customize the appearance:

```css
.shudan-goban-image {
  /* Board texture */
  background-image: url("./board.png");
}

.shudan-stone-image.shudan-sign_1 {
  /* Black stone */
  background-image: url("./black_stone.png");
}

.shudan-stone-image.shudan-sign_-1 {
  /* White stone */
  background-image: url("./white_stone.png");
}
```

Also override Shudan's default CSS custom properties to adjust the colors:

```css
.shudan-goban {
  --shudan-board-border-width: 0.25em;
  --shudan-board-border-color: #ca933a;

  --shudan-board-background-color: #ebb55b;
  --shudan-board-foreground-color: #5e2e0c;

  --shudan-black-background-color: #222;
  --shudan-black-foreground-color: #eee;

  --shudan-white-background-color: #fff;
  --shudan-white-foreground-color: #222;
}
```

Shudan adds random classes `.shudan-random_{n}` where `n = 0,...,4` to
`.shudan-stone-image`. Say, you have white shell stone images with different
shell patterns. You can use the random classes to randomly assign a different
pattern to each stone:

```css
.shudan-stone-image.shudan-sign_-1 {
  background-image: url("white_stone_1.png");
}
.shudan-stone-image.shudan-sign_-1.shudan-random_1 {
  background-image: url("white_stone_2.png");
}
.shudan-stone-image.shudan-sign_-1.shudan-random_2 {
  background-image: url("white_stone_3.png");
}
.shudan-stone-image.shudan-sign_-1.shudan-random_3 {
  background-image: url("white_stone_4.png");
}
.shudan-stone-image.shudan-sign_-1.shudan-random_4 {
  background-image: url("white_stone_5.png");
}
```

## API Reference

### `Goban` Component

All props are optional. The following props are supported:

#### DOM Props

- `id` `<string>`

  Sets the `id` attribute of the container element.

- `class`/`className` `<string>`

  Adds the specified classes to Shudan's own classes to the container element.

- `style` `<Object>`

  Adds the specified styles to Shudan's own styles to the container element.

- `innerProps` `<Object>`

  Applies other props to the container element.

#### Board Props

- `renderer` `<"dom"|"canvas">` - Default: `dom`

  Determines whether the goban renders using the old DOM-based renderer, or the new hybrid renderer that renders the grid/hoshi and static solid stones on canvas and renders everything else to DOM. Once the canvas renderer is more stable, it will likely become the default, as it is much more performant.

- `busy` `<boolean>` - Default: `false`

  Determines whether component is busy. When busy, no user input are accepted.

- `vertexSize` `<number>` - Default: `24`

  The width and height of a single vertex as a pixel number. Adjust this prop to
  change the size of the component.

  If you want to specify a maximum width and height instead, use the
  [`BoundedGoban`](#boundedgoban-component) component.

- `rangeX` `<[<integer>, <integer>]>` - Default: `[0, Infinity]`

  Only vertices with `x` value inside this range are displayed.

- `rangeY` `<[<integer>, <integer>]>` - Default: `[0, Infinity]`

  Only vertices with `y` value inside this range are displayed.

#### Coordinates Props

- `showCoordinates` `<boolean>` - Default: `false`

  Determines rendering of coordinates.

- `showCoordinatesOnOutsidd` `<boolean>` - Default: `false`

  If true, coordinates are rendered outside the board rather than inside.

- `coordX` `<Function>` - Default: `x => ['A', 'B', 'C', ...][x]`

  A function that determines coordinate label by `x` value of a vertex.

- `coordY` `<Function>` - Default: `y => height - y`

  A function that determines coordinate label by `y` value of a vertex.

#### Behavior Props

- `fuzzyStonePlacement` `<boolean>` - Default: `false`

  When set to `true`, stones are rendered slightly off-grid.

- `animateStonePlacement` `<boolean>` - Default: `false`

  When set to `true`, stones that are added to the board will slide into place,
  adjusting nearby stones if necessary. Only works if `fuzzyStonePlacement` is
  set to `true`. Only triggers animation if `signMap` prop updates with a new
  object.

#### Map Props

- `signMap` `<Map<integer>>`

  A [`map`](#board-representation) consisting of `-1` (white stone), `0` (empty
  field), or `1` (black stone), representing the stone arrangement on the board.

- `markerMap` `<Map<null | Object>>`

  A [`map`](#board-representation) consisting of objects of the following
  structure:

  ```js
  {
    type?: <string> | null,
    label?: <string> | null
  }
  ```

  The string specified in `label` is shown as tooltip. Shudan provides styles
  for the following types:

  - `'circle'`
  - `'cross'`
  - `'triangle'`
  - `'square'`
  - `'point'`
  - `'loader'`
  - `'label'`

- `paintMap` `<Map<number>>`

  A [`map`](#board-representation) consisting of numbers between `-1` and `1`
  inclusive that will paint the corresponding vertices accordingly. `-1` will
  paint the vertex black, `0` will not paint the vertex, while `1` will paint
  the vertex white.

- `ghostStoneMap` `<Map<null | Object>>`

  A [`map`](#board-representation) consisting of objects of the following
  structure:

  ```js
  {
    sign: <integer>,
    type?: <string> | null,
    faint?: <boolean> | null
  }
  ```

  `sign` can be `-1` (white stone), `0` (empty field), or `1` (black stone).
  Shudan provides styles for the following types:

  - `'good'`
  - `'interesting'`
  - `'doubtful'`
  - `'bad'`

- `heatMap` `<Map<null | Object>>`

  A [`map`](#board-representation) consisting of objects of the following form:

  ```js
  {
    strength: <integer>,
    text?: <string> | null
  }
  ```

  Shudan provides styles for `strength` between `0` and `9`.

#### Vertex Specific Props

- `selectedVertices` `<Vertex[]>` - Default: `[]`

  An array of [vertices](#vertex-representation) which should be in a selected
  state.

- `dimmedVertices` `<Vertex[]>` - Default: `[]`

  An array of [vertices](#vertex-representation) which should be dimmed.

- `lines` `<Object[]>` - Default: `[]`

  An array of objects of the following form:

  ```js
  {
    v1: <Vertex>,
    v2: <Vertex>,
    type: <string>
  }
  ```

  Shudan provides default styles for `'line'` and `'arrow'` types.

#### Event Props

- `onVertexClick` `<Function>`
- `onVertexHover` `<Function>`
- `onVertexDrag` `<Function>`
- `onVertexRightClick` `<Function>`
- `onVertexLongPress` `<Function>`

These functions will be called when the user interacts with a vertex. Under the
hood this uses `pointer` events, so it will work with both touch and mouse input
(and includes specific handling for the Apple Pencil, which tends to
aggressively send `touchcancel`/`pointercancel` events instead of
`touchend`/`pointerup`). On mobile, you will not get `onVertexHover` events,
unless you are using a device that supports hover input (e.g. Apple Pencil on
some devices).

Your handlers will be called with two arguments:

1. `vertex` [`<Vertex>`](#vertex-representation)
2. `evt` - The original event

By default a long-press will be triggered after 500ms when using an input method
that is not `mouse` (e.g. `touch` or `pen`). The `longPressThreshold` prop lets
you configure this, with a numeric threshold in milliseconds.

- `longPressThreshold` `<number>`

When moving the cursor from inside to outside the goban, if the user is not
dragging, you will get a hover callback with the vertex set to `null`. Dragging
outside the goban does not fire a similar `null` callback (although you'll know
at the end of the event whether they ended on a vertex or not).

Note that the "click" event is not a "real" click — it will fire if the event
was the result of a drag, rather than requiring the user to start and end a
click/touch event on the same vertex. If this is a problem for your use case,
feel free to open an issue, I'm open to alternatives.

### `BoundedGoban` Component

Supports all props of `Goban`, but instead of `vertexSize`, you have to specify
either `width` and/or `height` to control the size of the board. The Goban's div will be sized exactly to be the given width and height, with the `vertexSize` automatically set as large as possible while fully fitting. Any extra space will be added to the board, inside the boarder but outside the grid.

#### Board Props

- `width` `<number>`

  The exact width in pixels of the Goban.

- `height` `<number>`

  The exact height in pixels of the Goban.

All other props are the same as `Goban`, except for not supporting `vertexSize`