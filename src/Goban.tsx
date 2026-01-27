import { useMemo, useState, useRef, useEffect } from "react";
import classnames from "classnames";

export { diffSignMap, vertexFromPoint } from "./helper.js";
export type Map<T> = T[][];

import {
  random,
  readjustShifts,
  neighborhood,
  vertexEquals,
  diffSignMap,
  range,
  getHoshis,
  type Vertex as VertexData,
} from "./helper.js";
import { CoordX, CoordY } from "./Coord.js";
import Grid from "./Grid.js";
import Vertex, { GhostStone, HeatVertex } from "./Vertex.js";
import Line, { LineMarker } from "./Line.js";
import { Marker } from "./Marker.js";
import { useGobanPointerEvents } from "./useGobanPointerEvents.js";

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
          {...pointerEventHandlers}
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
