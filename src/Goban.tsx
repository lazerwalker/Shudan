import { useMemo, useState, useRef, useEffect, useCallback } from "react";

export { diffSignMap, vertexFromPoint } from "./helper.js";

import {
  random,
  readjustShifts,
  neighborhood,
  diffSignMap,
  range,
  getHoshis,
  type Map,
  type Vertex as VertexData,
} from "./helper.js";
import { GhostStone, HeatVertex } from "./Vertex.js";
import { LineMarker } from "./Line.js";
import { Marker } from "./Marker.js";

export type RendererProps = {
  vertexSize: number;
  width: number;
  height: number;
  xs: number[];
  ys: number[];
  hoshis: VertexData[];

  signMap: Map<0 | 1 | -1>;

  markerMap?: Map<Marker | null>;
  paintMap?: Map<0 | 1 | -1>;
  ghostStoneMap?: Map<GhostStone | null>;
  heatMap?: Map<HeatVertex | null>;

  fuzzyStonePlacement: boolean;
  shiftMap: number[][];
  randomMap: number[][];

  selectedVertices: VertexData[];
  dimmedVertices: VertexData[];
  shiftingStones: VertexData[];
  placedStones: VertexData[];
  lines: LineMarker[];

  rangeX: [number, number];
  rangeY: [number, number];
};
import { useGobanPointerEvents } from "./useGobanPointerEvents.js";
import GobanShell from "./GobanShell.js";
import DOMRenderer from "./DOMRenderer.js";
import CanvasRenderer from "./CanvasRenderer.js";

function useForceUpdate() {
  const [, setState] = useState(0);
  return useCallback(() => setState((n) => n + 1), []);
}

export interface GobanProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  innerProps?: React.ComponentPropsWithRef<"div">;

  busy?: boolean;
  vertexSize?: number;
  rangeX?: [start: number, stop: number];
  rangeY?: [start: number, stop: number];
  renderer?: "dom" | "canvas";

  showCoordinates?: boolean;
  coordinatesOnOutside?: boolean;
  coordX?: (x: number) => string | number;
  coordY?: (y: number) => string | number;

  fuzzyStonePlacement?: boolean;
  animateStonePlacement?: boolean;

  signMap?: Map<0 | 1 | -1>;
  markerMap?: Map<Marker | null>;
  paintMap?: Map<0 | 1 | -1>;
  ghostStoneMap?: Map<GhostStone | null>;
  heatMap?: Map<HeatVertex | null>;

  selectedVertices?: VertexData[];
  dimmedVertices?: VertexData[];
  lines?: LineMarker[];

  onVertexClick?: (vertex: VertexData, evt: React.PointerEvent) => void;
  onVertexRightClick?: (vertex: VertexData, evt: React.MouseEvent) => void;
  onVertexLongPress?: (vertex: VertexData, evt: React.PointerEvent) => void;
  onVertexHover?: (vertex: VertexData | null, evt: React.PointerEvent) => void;
  onVertexDrag?: (vertex: VertexData, evt: React.PointerEvent) => void;
  longPressThreshold?: number;

  animationDuration?: number;
}

export default function Goban(props: GobanProps) {
  const {
    animationDuration,
    innerProps = {},
    vertexSize = 24,
    coordX,
    coordY,
    busy,
    signMap = [],
    paintMap,
    heatMap,
    markerMap,
    ghostStoneMap,
    animateStonePlacement = false,
    fuzzyStonePlacement = false,
    showCoordinates = false,
    coordinatesOnOutside = false,
    lines = [],
    selectedVertices = [],
    dimmedVertices = [],
    rangeX = [0, Infinity],
    rangeY = [0, Infinity],
    renderer = "dom",
    onVertexClick,
    onVertexRightClick,
    onVertexLongPress,
    onVertexHover,
    onVertexDrag,
    longPressThreshold = 500,
  } = props;

  // Used by the animation callback to force a re-render
  const forceUpdate = useForceUpdate();

  // refs instead of state so they can be updatedsynchronously during render
  // Shudan uses getDerivedStateFromProps for this purpose.
  // Without this, there is a frame of lag before stones render,
  // which looks particularly bad with Tenuki's stone-placement animation
  const shiftMapRef = useRef<number[][]>([]);
  const placedStonesRef = useRef<VertexData[]>([]);
  const shiftingStonesRef = useRef<VertexData[]>([]);

  const prevSizeRef = useRef({ width: 0, height: 0 });
  const prevSignMapRef = useRef<Map<0 | 1 | -1>>([]);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const width = signMap.length === 0 ? 0 : signMap[0].length;
  const height = signMap.length;

  // Compute animation state synchronously during render (like getDerivedStateFromProps)
  // This mimics Shudan, and avoids flickering when placing a stone
  const sizeChanged =
    prevSizeRef.current.width !== width ||
    prevSizeRef.current.height !== height;

  if (sizeChanged) {
    // New board! Wipe everything out
    shiftMapRef.current = readjustShifts(
      signMap.map((row) => row.map(() => random(8)))
    );
    placedStonesRef.current = [];
    shiftingStonesRef.current = [];
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    prevSizeRef.current = { width, height };
    prevSignMapRef.current = signMap;
  } else if (prevSignMapRef.current !== signMap) {
    // Same size, check for new stones
    const changed = diffSignMap(prevSignMapRef.current, signMap);
    prevSignMapRef.current = signMap;

    if (changed.length > 0) {
      // Clear any existing timeout and extend animation
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      if (fuzzyStonePlacement) {
        const nextShiftMap = shiftMapRef.current.map((row) => [...row]);
        for (const [x, y] of changed) {
          nextShiftMap[y][x] = random(7) + 1;
          readjustShifts(nextShiftMap, [x, y]);
        }
        shiftMapRef.current = nextShiftMap;
      }

      if (animateStonePlacement) {
        placedStonesRef.current = [...placedStonesRef.current, ...changed];

        if (fuzzyStonePlacement) {
          shiftingStonesRef.current = [
            ...shiftingStonesRef.current,
            ...changed.flatMap(neighborhood),
          ];
        }

        // In theory, this should be in a useEffect block because it's a side effect
        // In practice, it's probably fine, and this flow is more logical
        animationTimeoutRef.current = setTimeout(() => {
          placedStonesRef.current = [];
          shiftingStonesRef.current = [];
          animationTimeoutRef.current = null;
          forceUpdate();
        }, animationDuration ?? 200);
      }
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const xs = useMemo(() => {
    return range(width).slice(rangeX[0], rangeX[1] + 1);
  }, [width, rangeX]);

  const ys = useMemo(() => {
    return range(height).slice(rangeY[0], rangeY[1] + 1);
  }, [height, rangeY]);

  const hoshis = useMemo(() => getHoshis(width, height), [width, height]);

  const pointerEventHandlers = useGobanPointerEvents({
    contentRef,
    vertexSize,
    xs,
    ys,
    onVertexClick,
    onVertexRightClick,
    onVertexLongPress,
    onVertexHover,
    onVertexDrag,
    longPressThreshold,
  });

  const randomMap = useMemo(() => {
    return Array(height)
      .fill(null)
      .map(() =>
        Array(width)
          .fill(null)
          .map(() => random(4))
      );
  }, [width, height]);

  const rendererProps: RendererProps = {
    width,
    height,
    xs,
    ys,
    vertexSize,
    signMap,
    hoshis,
    shiftingStones: shiftingStonesRef.current,
    placedStones: placedStonesRef.current,
    rangeX,
    rangeY,
    shiftMap: shiftMapRef.current,
    randomMap,
    selectedVertices,
    dimmedVertices,
    fuzzyStonePlacement,
    lines,
    ghostStoneMap,
    heatMap,
    markerMap,
    paintMap,
  };

  return (
    <GobanShell
      vertexSize={vertexSize}
      xs={xs}
      ys={ys}
      height={height}
      coordX={coordX}
      coordY={coordY}
      showCoordinates={showCoordinates}
      coordinatesOnOutside={coordinatesOnOutside}
      busy={busy}
      id={props.id}
      className={props.className}
      style={props.style}
      innerProps={innerProps}
      contentProps={pointerEventHandlers}
      contentRef={contentRef}
    >
      {renderer === "canvas" ? (
        <CanvasRenderer {...rendererProps} />
      ) : (
        <DOMRenderer {...rendererProps} />
      )}
    </GobanShell>
  );
}
