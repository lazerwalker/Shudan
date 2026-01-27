import { useMemo, useState, useRef, useEffect } from "react";

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
import { useGobanPointerEvents } from "./useGobanPointerEvents.js";
import GobanShell from "./GobanShell.js";
import DOMRenderer from "./DOMRenderer.js";

export interface GobanProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  innerProps?: React.ComponentPropsWithRef<"div">;

  busy?: boolean;
  vertexSize?: number;
  rangeX?: [start: number, stop: number];
  rangeY?: [start: number, stop: number];

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
    onVertexClick,
    onVertexRightClick,
    onVertexLongPress,
    onVertexHover,
    onVertexDrag,
    longPressThreshold = 500,
  } = props;

  const [shiftMap, setShiftMap] = useState<number[][]>([]);

  const [placedStones, setPlacedStones] = useState<VertexData[]>([]);
  const [shiftingStones, setShiftingStones] = useState<VertexData[]>([]);

  const prevSizeRef = useRef({ width: 0, height: 0 });
  const prevSignMapRef = useRef<Map<0 | 1 | -1>>([]);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const width = signMap.length === 0 ? 0 : signMap[0].length;
  const height = signMap.length;

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

  useEffect(() => {
    const sizeChanged =
      prevSizeRef.current.width !== width ||
      prevSizeRef.current.height !== height;

    if (sizeChanged) {
      // New board! Wipe everything out
      setShiftMap(
        readjustShifts(signMap.map((row) => row.map(() => random(8))))
      );
      setPlacedStones([]);
      setShiftingStones([]);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      prevSizeRef.current = { width, height };
      prevSignMapRef.current = signMap;
      return;
    }

    // Same size, check for new stones
    const changed = diffSignMap(prevSignMapRef.current, signMap);
    prevSignMapRef.current = signMap;

    if (changed.length === 0) return;

    // This behavior is different from vanilla Shudan,
    // which only allows one animation to take place at once.
    // Instead, we say "if there's an anim, extend the timeout and concat stones"
    // This is not perfect — if you animate the same stone twice within a chain
    // it won't replay the animation (because of how CSS-based animations work)
    // but this is less bad than the previous behavior of
    // "if there's an animation playing, ignore any new stones"

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    if (fuzzyStonePlacement) {
      setShiftMap((prev) => {
        const next = prev.map((row) => [...row]);
        for (const [x, y] of changed) {
          next[y][x] = random(7) + 1;
          readjustShifts(next, [x, y]);
        }
        return next;
      });
    }

    if (animateStonePlacement) {
      setPlacedStones((prev) => [...prev, ...changed]);

      if (fuzzyStonePlacement) {
        setShiftingStones((prev) => [
          ...prev,
          ...changed.flatMap(neighborhood),
        ]);
      }

      animationTimeoutRef.current = setTimeout(() => {
        setPlacedStones([]);
        setShiftingStones([]);
        animationTimeoutRef.current = null;
      }, animationDuration ?? 200);
    }
  }, [
    signMap,
    width,
    height,
    fuzzyStonePlacement,
    animateStonePlacement,
    animationDuration,
  ]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const randomMap = useMemo(() => {
    return Array(height)
      .fill(null)
      .map(() =>
        Array(width)
          .fill(null)
          .map(() => random(4))
      );
  }, [width, height]);

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
      innerProps={innerProps}
      contentProps={pointerEventHandlers}
      contentRef={contentRef}
    >
      <DOMRenderer
        width={width}
        height={height}
        xs={xs}
        ys={ys}
        vertexSize={vertexSize}
        signMap={signMap}
        hoshis={hoshis}
        shiftingStones={shiftingStones}
        placedStones={placedStones}
        rangeX={rangeX}
        rangeY={rangeY}
        shiftMap={shiftMap}
        randomMap={randomMap}

        selectedVertices={selectedVertices}
        dimmedVertices={dimmedVertices}
        fuzzyStonePlacement={fuzzyStonePlacement}
        lines={lines}
        ghostStoneMap={ghostStoneMap}
        heatMap={heatMap}
        markerMap={markerMap}
        paintMap={paintMap}
      />
    </GobanShell>
  );
}
