import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import classnames from "classnames";

export { diffSignMap, vertexFromPoint } from "./helper.js";
export type Map<T> = T[][];

import {
  random,
  readjustShifts,
  neighborhood,
  vertexEquals,
  diffSignMap,
  vertexFromPoint,
  range,
  getHoshis,
  type Vertex as VertexData,
} from "./helper.js";
import { CoordX, CoordY } from "./Coord.js";
import Grid from "./Grid.js";
import Vertex, { GhostStone, HeatVertex } from "./Vertex.js";
import Line, { LineMarker } from "./Line.js";
import { Marker } from "./Marker.js";

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

  // Event handling refs
  const contentRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartVertexRef = useRef<VertexData | null>(null);
  const lastHoveredVertexRef = useRef<VertexData | null>(null);
  const isPointerDownRef = useRef(false);

  const width = signMap.length === 0 ? 0 : signMap[0].length;
  const height = signMap.length;

  const xs = useMemo(() => {
    return range(width).slice(rangeX[0], rangeX[1] + 1);
  }, [width, rangeX]);

  const ys = useMemo(() => {
    return range(height).slice(rangeY[0], rangeY[1] + 1);
  }, [height, rangeY]);

  const hoshis = useMemo(() => getHoshis(width, height), [width, height]);

  // Helper to get vertex from pointer coordinates
  const getVertexFromEvent = useCallback(
    (e: React.PointerEvent | React.MouseEvent): VertexData | null => {
      if (!contentRef.current) return null;
      const rect = contentRef.current.getBoundingClientRect();
      return vertexFromPoint(e.clientX, e.clientY, rect, vertexSize, xs, ys);
    },
    [vertexSize, xs, ys]
  );

  // Pointer event handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      // Only track left-button for click/long-press (right-click handled by contextmenu)
      if (e.button !== 0) return;

      isPointerDownRef.current = true;
      const vertex = getVertexFromEvent(e);
      pointerStartVertexRef.current = vertex;
      longPressTriggeredRef.current = false;

      // Clear any existing timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Start long press timer for touch/pen only (mouse has right-click)
      if (vertex && onVertexLongPress && e.pointerType !== "mouse") {
        longPressTimerRef.current = setTimeout(() => {
          longPressTriggeredRef.current = true;
          onVertexLongPress(vertex, e);
        }, longPressThreshold);
      }
    },
    [getVertexFromEvent, onVertexLongPress, longPressThreshold]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      const vertex = getVertexFromEvent(e);

      if (isPointerDownRef.current) {
        // Dragging - check if moved to a different vertex
        if (
          onVertexDrag &&
          vertex &&
          pointerStartVertexRef.current &&
          !vertexEquals(vertex, pointerStartVertexRef.current)
        ) {
          // Cancel long press on drag
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          onVertexDrag(vertex, e);
        }
      } else {
        // Hovering - check if vertex changed
        const lastVertex = lastHoveredVertexRef.current;
        const vertexChanged =
          (vertex === null && lastVertex !== null) ||
          (vertex !== null && lastVertex === null) ||
          (vertex !== null &&
            lastVertex !== null &&
            !vertexEquals(vertex, lastVertex));

        if (onVertexHover && vertexChanged) {
          onVertexHover(vertex, e);
        }
        lastHoveredVertexRef.current = vertex;
      }
    },
    [getVertexFromEvent, onVertexDrag, onVertexHover]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Fire click if we tracked a pointerdown and not a long press
      if (isPointerDownRef.current && !longPressTriggeredRef.current) {
        const vertex = getVertexFromEvent(e);
        if (vertex && onVertexClick) {
          onVertexClick(vertex, e);
        }
      }

      // Reset state
      isPointerDownRef.current = false;
      pointerStartVertexRef.current = null;
      longPressTriggeredRef.current = false;
    },
    [getVertexFromEvent, onVertexClick]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      // Apple Pencil can fire pointercancel instead of pointerup
      // Treat as click if we tracked a pointerdown and no long press
      if (
        isPointerDownRef.current &&
        !longPressTriggeredRef.current &&
        onVertexClick
      ) {
        const vertex = getVertexFromEvent(e);
        if (vertex) {
          onVertexClick(vertex, e);
        }
      }

      // Clear timer and reset state
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      isPointerDownRef.current = false;
      pointerStartVertexRef.current = null;
      longPressTriggeredRef.current = false;
    },
    [getVertexFromEvent, onVertexClick]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      // Fire hover with null when leaving board
      if (onVertexHover && lastHoveredVertexRef.current !== null) {
        onVertexHover(null, e);
        lastHoveredVertexRef.current = null;
      }
    },
    [onVertexHover]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const vertex = getVertexFromEvent(e as unknown as React.PointerEvent);
      if (vertex && onVertexRightClick) {
        e.preventDefault();
        onVertexRightClick(vertex, e);
      }
    },
    [getVertexFromEvent, onVertexRightClick]
  );

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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

  const showCoordinatesInside = showCoordinates && !coordinatesOnOutside;
  const showCoordinatesOutside = showCoordinates && coordinatesOnOutside;

  const mainContentGrid = showCoordinatesInside
    ? "1 / 1 / 4 / 4"
    : showCoordinatesOutside
    ? "2 / 2"
    : "1 / 1";

  return (
    <div
      className="shudan"
      style={{
        display: "inline-grid",
        gridTemplateRows: showCoordinates ? "1em auto 1em" : "auto",
        gridTemplateColumns: showCoordinates ? "1em auto 1em" : "auto",
        fontSize: vertexSize,
        lineHeight: "1em",
      }}
    >
      {showCoordinatesOutside && (
        <CoordX
          xs={xs}
          style={{ gridRow: "1", gridColumn: "2" }}
          coordX={coordX}
          outside={true}
        />
      )}

      {showCoordinatesOutside && (
        <CoordY
          height={height}
          ys={ys}
          style={{ gridRow: "2", gridColumn: "1" }}
          coordY={coordY}
          outside={true}
        />
      )}

      <div
        {...innerProps}
        id={props.id}
        className={classnames(
          "shudan-goban",
          "shudan-goban-image",
          {
            "shudan-busy": busy,
            "shudan-coordinates": showCoordinatesInside,
          },
          props.className
        )}
        style={{
          ...(props.style ?? {}),
          display: "inline-grid",
          gridArea: mainContentGrid,
          ...(showCoordinatesInside && {
            gridTemplateRows: "1em auto 1em",
            gridTemplateColumns: "1em auto 1em",
          }),
        }}
      >
        {showCoordinatesInside && (
          <CoordX
            xs={xs}
            style={{ gridRow: "1", gridColumn: "2" }}
            coordX={coordX}
          />
        )}

        {showCoordinatesInside && (
          <CoordY
            height={height}
            ys={ys}
            style={{ gridRow: "2", gridColumn: "1" }}
            coordY={coordY}
          />
        )}

        <div
          ref={contentRef}
          className="shudan-content"
          style={{
            position: "relative",
            width: `${xs.length}em`,
            height: `${ys.length}em`,
            gridRow: showCoordinates ? "2" : "1",
            gridColumn: showCoordinates ? "2" : "1",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
          onContextMenu={handleContextMenu}
        >
          <Grid
            vertexSize={vertexSize}
            width={width}
            height={height}
            xs={xs}
            ys={ys}
            hoshis={hoshis}
          />

          <div
            className="shudan-vertices"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${xs.length}, 1em)`,
              gridTemplateRows: `repeat(${ys.length}, 1em)`,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
            }}
          >
            {ys.map((y) => {
              return xs.map((x) => {
                let equalsVertex = (v: VertexData) => vertexEquals(v, [x, y]);
                let selected = selectedVertices.some(equalsVertex);

                return (
                  <Vertex
                    key={[x, y].join("-")}
                    position={[x, y]}
                    shift={fuzzyStonePlacement ? shiftMap?.[y]?.[x] : 0}
                    random={randomMap?.[y]?.[x]}
                    sign={signMap?.[y]?.[x]}
                    heat={heatMap?.[y]?.[x]}
                    marker={markerMap?.[y]?.[x]}
                    ghostStone={ghostStoneMap?.[y]?.[x]}
                    dimmed={dimmedVertices.some(equalsVertex)}
                    // TODO: Rename both of these to be clearer about the distinction
                    animate={shiftingStones.some(equalsVertex)}
                    changed={placedStones.some(equalsVertex)}
                    paint={paintMap?.[y]?.[x]}
                    paintLeft={paintMap?.[y]?.[x - 1]}
                    paintRight={paintMap?.[y]?.[x + 1]}
                    paintTop={paintMap?.[y - 1]?.[x]}
                    paintBottom={paintMap?.[y + 1]?.[x]}
                    paintTopLeft={paintMap?.[y - 1]?.[x - 1]}
                    paintTopRight={paintMap?.[y - 1]?.[x + 1]}
                    paintBottomLeft={paintMap?.[y + 1]?.[x - 1]}
                    paintBottomRight={paintMap?.[y + 1]?.[x + 1]}
                    selected={selected}
                    selectedLeft={
                      selected &&
                      selectedVertices.some((v) => vertexEquals(v, [x - 1, y]))
                    }
                    selectedRight={
                      selected &&
                      selectedVertices.some((v) => vertexEquals(v, [x + 1, y]))
                    }
                    selectedTop={
                      selected &&
                      selectedVertices.some((v) => vertexEquals(v, [x, y - 1]))
                    }
                    selectedBottom={
                      selected &&
                      selectedVertices.some((v) => vertexEquals(v, [x, y + 1]))
                    }
                  />
                );
              });
            })}
          </div>
          <svg
            className="shudan-lines"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            <g
              transform={`translate(-${rangeX[0] * vertexSize} -${
                rangeY[0] * vertexSize
              })`}
            >
              {lines.map(({ v1, v2, type }, i) => (
                <Line
                  key={i}
                  v1={v1}
                  v2={v2}
                  type={type}
                  vertexSize={vertexSize}
                />
              ))}
            </g>
          </svg>
        </div>
        {showCoordinatesInside && (
          <CoordY
            height={height}
            ys={ys}
            style={{
              gridRow: "2",
              gridColumn: "3",
            }}
            coordY={coordY}
          />
        )}
        {showCoordinatesInside && (
          <CoordX
            xs={xs}
            style={{ gridRow: "3", gridColumn: "2" }}
            coordX={coordX}
          />
        )}
      </div>
      {showCoordinatesOutside && (
        <CoordY
          height={height}
          ys={ys}
          style={{ gridRow: "2", gridColumn: "3" }}
          coordY={coordY}
          outside={true}
        />
      )}
      {showCoordinatesOutside && (
        <CoordX
          xs={xs}
          style={{ gridRow: "3", gridColumn: "2" }}
          coordX={coordX}
          outside={true}
        />
      )}
    </div>
  );
}
