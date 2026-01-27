export type Vertex = [x: number, y: number];
export type Map<T> = T[][];

export enum Sign {
  Empty = 0,
  Black = 1,
  White = -1,
}

export const alpha = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

export const avg = (xs: number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((sum, x) => sum + x, 0) / xs.length;

export const range = (n: number): number[] =>
  Array(n)
    .fill(0)
    .map((_, i) => i);

export const random = (n: number): number =>
  Math.floor(Math.random() * (n + 1));

export const neighborhood = ([x, y]: Vertex): Vertex[] => [
  [x, y],
  [x - 1, y],
  [x + 1, y],
  [x, y - 1],
  [x, y + 1],
];

export const vertexEquals = ([x1, y1]: Vertex, [x2, y2]: Vertex): boolean =>
  x1 === x2 && y1 === y2;

export const lineEquals = (
  [v1, w1]: [Vertex, Vertex],
  [v2, w2]: [Vertex, Vertex]
): boolean => vertexEquals(v1, v2) && vertexEquals(w1, w2);

// We're type-coercing here, but it's fine, Math.sign(undefined) is NaN and will return false anyway unless they're all undefined
export const signEquals = (...xs: (number | undefined)[]): boolean =>
  xs.length === 0 ? true : xs.every((x) => Math.sign(x!) === Math.sign(xs[0]!));

export function getHoshis(width: number, height: number): Vertex[] {
  if (Math.min(width, height) <= 6) return [];

  let [nearX, nearY] = [width, height].map((x) => (x >= 13 ? 3 : 2));
  let [farX, farY] = [width - nearX - 1, height - nearY - 1];
  let [middleX, middleY] = [width, height].map((x) => (x - 1) / 2);

  let result: Vertex[] = [
    [nearX, farY],
    [farX, nearY],
    [farX, farY],
    [nearX, nearY],
  ];

  if (width % 2 !== 0 && height % 2 !== 0 && width !== 7 && height !== 7)
    result.push([middleX, middleY]);
  if (width % 2 !== 0 && width !== 7)
    result.push([middleX, nearY], [middleX, farY]);
  if (height % 2 !== 0 && height !== 7)
    result.push([nearX, middleY], [farX, middleY]);

  return result;
}

export function readjustShifts(
  shiftMap: number[][],
  vertex: Vertex | null = null
) {
  if (vertex == null) {
    for (let y = 0; y < shiftMap.length; y++) {
      for (let x = 0; x < shiftMap[0].length; x++) {
        readjustShifts(shiftMap, [x, y]);
      }
    }
  } else {
    let [x, y] = vertex;
    let direction = shiftMap[y][x];

    let data = [
      // Left
      [
        [1, 5, 8],
        [x - 1, y],
        [3, 7, 6],
      ],
      // Top
      [
        [2, 5, 6],
        [x, y - 1],
        [4, 7, 8],
      ],
      // Right
      [
        [3, 7, 6],
        [x + 1, y],
        [1, 5, 8],
      ],
      // Bottom
      [
        [4, 7, 8],
        [x, y + 1],
        [2, 5, 6],
      ],
    ];

    for (let [directions, [qx, qy], removeShifts] of data) {
      if (!directions.includes(direction)) continue;

      if (shiftMap[qy] && removeShifts.includes(shiftMap[qy][qx])) {
        shiftMap[qy][qx] = 0;
      }
    }
  }

  return shiftMap;
}

export function vertexFromPoint(
  clientX: number,
  clientY: number,
  contentRect: DOMRect,
  vertexSize: number,
  xs: number[],
  ys: number[]
): Vertex | null {
  const relativeX = clientX - contentRect.left;
  const relativeY = clientY - contentRect.top;

  if (relativeX < 0 || relativeY < 0) return null;

  const gridX = Math.floor(relativeX / vertexSize);
  const gridY = Math.floor(relativeY / vertexSize);

  if (gridX < 0 || gridX >= xs.length || gridY < 0 || gridY >= ys.length) {
    return null;
  }

  return [xs[gridX], ys[gridY]];
}

export function diffSignMap(before: number[][], after: number[][]): Vertex[] {
  if (
    before === after ||
    before.length === 0 ||
    before.length !== after.length ||
    before[0].length !== after[0].length
  ) {
    return [];
  }

  let result: Vertex[] = [];

  for (let y = 0; y < before.length; y++) {
    for (let x = 0; x < before[0].length; x++) {
      if (before[y][x] === 0 && after[y] != null && after[y][x]) {
        result.push([x, y]);
      }
    }
  }

  return result;
}
