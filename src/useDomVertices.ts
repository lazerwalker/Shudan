import { useMemo } from "react";
import { type Map, type Vertex } from "./helper.js";

export function vertexKey(x: number, y: number): string {
  return `${x},${y}`;
}

function vertexSetFromArray(vertices: Vertex[]): Set<string> {
  return new Set(vertices.map(([x, y]) => vertexKey(x, y)));
}

interface DomVertex {
  x: number;
  y: number;
  xi: number;
  yi: number;
  sign: 0 | 1 | -1;
  selected: boolean;
  dimmed: boolean;
  animate: boolean;
  changed: boolean;
}

interface UseDomVerticesResult {
  domVertices: DomVertex[];
  selectedSet: Set<string>;
  dimmedSet: Set<string>;
  shiftingSet: Set<string>;
  placedSet: Set<string>;
}

export function useDomVertices(props: {
  xs: number[];
  ys: number[];
  signMap: Map<0 | 1 | -1>;
  markerMap?: Map<unknown>;
  ghostStoneMap?: Map<unknown>;
  heatMap?: Map<{ strength: number } | null>;
  paintMap?: Map<unknown>;
  selectedVertices: Vertex[];
  dimmedVertices: Vertex[];
  shiftingStones: Vertex[];
  placedStones: Vertex[];
}): UseDomVerticesResult {
  const {
    xs,
    ys,
    signMap,
    markerMap,
    ghostStoneMap,
    heatMap,
    paintMap,
    selectedVertices,
    dimmedVertices,
    shiftingStones,
    placedStones,
  } = props;

  const selectedSet = useMemo(
    () => vertexSetFromArray(selectedVertices),
    [selectedVertices]
  );
  const dimmedSet = useMemo(
    () => vertexSetFromArray(dimmedVertices),
    [dimmedVertices]
  );
  const shiftingSet = useMemo(
    () => vertexSetFromArray(shiftingStones),
    [shiftingStones]
  );
  const placedSet = useMemo(
    () => vertexSetFromArray(placedStones),
    [placedStones]
  );

  const domVertices = useMemo(() => {
    const vertices: DomVertex[] = [];
    const needed = new Set<string>();

    if (markerMap) {
      for (let y = 0; y < markerMap.length; y++) {
        const row = markerMap[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          if (row[x]) needed.add(vertexKey(x, y));
        }
      }
    }

    if (ghostStoneMap) {
      for (let y = 0; y < ghostStoneMap.length; y++) {
        const row = ghostStoneMap[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          if (row[x] && (signMap?.[y]?.[x] || 0) === 0) {
            needed.add(vertexKey(x, y));
          }
        }
      }
    }

    if (heatMap) {
      for (let y = 0; y < heatMap.length; y++) {
        const row = heatMap[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          const heat = row[x];
          if (heat && heat.strength > 0 && heat.strength <= 9) {
            needed.add(vertexKey(x, y));
          }
        }
      }
    }

    if (paintMap) {
      for (let y = 0; y < paintMap.length; y++) {
        const row = paintMap[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          if (row[x]) {
            needed.add(vertexKey(x, y));
            needed.add(vertexKey(x - 1, y));
            needed.add(vertexKey(x + 1, y));
            needed.add(vertexKey(x, y - 1));
            needed.add(vertexKey(x, y + 1));
          }
        }
      }
    }

    for (const [x, y] of selectedVertices) needed.add(vertexKey(x, y));
    for (const [x, y] of dimmedVertices) needed.add(vertexKey(x, y));
    for (const [x, y] of shiftingStones) needed.add(vertexKey(x, y));
    for (const [x, y] of placedStones) needed.add(vertexKey(x, y));

    for (const key of needed) {
      const [xStr, yStr] = key.split(",");
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      const xi = xs.indexOf(x);
      const yi = ys.indexOf(y);
      if (xi === -1 || yi === -1) continue;

      vertices.push({
        x,
        y,
        xi,
        yi,
        sign: signMap?.[y]?.[x] || 0,
        selected: selectedSet.has(key),
        dimmed: dimmedSet.has(key),
        animate: shiftingSet.has(key),
        changed: placedSet.has(key),
      });
    }

    return vertices;
  }, [
    xs,
    ys,
    signMap,
    markerMap,
    ghostStoneMap,
    heatMap,
    paintMap,
    selectedVertices,
    dimmedVertices,
    shiftingStones,
    placedStones,
    selectedSet,
    dimmedSet,
    shiftingSet,
    placedSet,
  ]);

  return { domVertices, selectedSet, dimmedSet, shiftingSet, placedSet };
}
