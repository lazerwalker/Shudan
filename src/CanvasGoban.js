import {
  createElement as h,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import classnames from "classnames";

import {
  random,
  readjustShifts,
  vertexEquals,
  diffSignMap,
  range,
  getHoshis,
  signEquals,
} from "./helper.js";
import { CoordX, CoordY } from "./Coord.js";
import Line from "./Line.js";
import Marker from "./Marker.js";
import A11yGrid from "./A11yGrid.js";
import { Canvas2DRenderer } from "./renderers/Canvas2DRenderer.js";
import { loadTheme, createDefaultTheme } from "./theme.js";
import { getVertexFromPoint } from "./coordinates.js";

// Padding for fuzzy stone overflow (as fraction of vertexSize)
// Max shift is 0.07, stone extends 0.46 from center, so ~0.07 overflow possible
const FUZZY_PADDING = 0.1;

// Get neighbor info for paint/selection rendering
function getNeighborInfo(x, y, map, selectedVertices) {
  if (selectedVertices) {
    return {
      left: selectedVertices.some((v) => vertexEquals(v, [x - 1, y])),
      right: selectedVertices.some((v) => vertexEquals(v, [x + 1, y])),
      top: selectedVertices.some((v) => vertexEquals(v, [x, y - 1])),
      bottom: selectedVertices.some((v) => vertexEquals(v, [x, y + 1])),
    };
  }

  if (!map) {
    return { left: false, right: false, top: false, bottom: false };
  }

  const value = map[y]?.[x];
  return {
    left: signEquals(map[y]?.[x - 1], value),
    right: signEquals(map[y]?.[x + 1], value),
    top: signEquals(map[y - 1]?.[x], value),
    bottom: signEquals(map[y + 1]?.[x], value),
  };
}

export default function CanvasGoban(props) {
  const {
    id,
    innerProps = {},
    vertexSize = 24,
    coordX,
    coordY,
    busy = false,
    signMap = [],
    paintMap,
    heatMap,
    markerMap,
    ghostStoneMap,
    fuzzyStonePlacement = false,
    animateStonePlacement = false,
    animationDuration = 200,
    showCoordinates = false,
    coordinatesOnOutside = false,
    lines = [],
    selectedVertices = [],
    dimmedVertices = [],
    theme: propTheme,
    maxStonesToAnimate = 3,
    enableA11y = true,
  } = props;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const lastVertexRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // Calculate board dimensions
  const width = signMap.length === 0 ? 0 : signMap[0].length;
  const height = signMap.length;

  // Handle range props
  const rangeX = useMemo(() => {
    const r = props.rangeX ?? [0, Infinity];
    return [Math.max(0, r[0]), Math.min(width - 1, r[1])];
  }, [props.rangeX, width]);

  const rangeY = useMemo(() => {
    const r = props.rangeY ?? [0, Infinity];
    return [Math.max(0, r[0]), Math.min(height - 1, r[1])];
  }, [props.rangeY, height]);

  // Calculate visible coordinates
  const xs = useMemo(
    () => range(width).slice(rangeX[0], rangeX[1] + 1),
    [width, rangeX]
  );
  const ys = useMemo(
    () => range(height).slice(rangeY[0], rangeY[1] + 1),
    [height, rangeY]
  );

  // Calculate hoshis
  const hoshis = useMemo(() => getHoshis(width, height), [width, height]);

  // Theme state
  const [theme, setTheme] = useState(propTheme ?? null);

  // Generate stable random and shift maps
  const [randomMap, setRandomMap] = useState(() =>
    signMap.map((row) => row.map(() => random(3)))
  );
  const [shiftMap, setShiftMap] = useState(() =>
    readjustShifts(signMap.map((row) => row.map(() => random(8))))
  );

  // Animation state
  const [animation, setAnimation] = useState({
    animatedVertices: [],
    changedVertices: [],
  });

  // Previous signMap for diff detection
  const prevSignMapRef = useRef(signMap);

  // Load theme on mount
  useEffect(() => {
    if (propTheme) {
      setTheme(propTheme);
      return;
    }

    if (containerRef.current) {
      loadTheme(containerRef.current).then(setTheme);
    }
  }, [propTheme]);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new Canvas2DRenderer(canvasRef.current);
    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Handle signMap changes - use useLayoutEffect for synchronous updates
  useLayoutEffect(() => {
    if (width === 0 || height === 0) return;

    const prevMap = prevSignMapRef.current;
    const prevWidth = prevMap.length === 0 ? 0 : prevMap[0].length;
    const prevHeight = prevMap.length;

    if (prevWidth !== width || prevHeight !== height) {
      setRandomMap(signMap.map((row) => row.map(() => random(3))));
      setShiftMap(
        readjustShifts(signMap.map((row) => row.map(() => random(8))))
      );
      setAnimation({ animatedVertices: [], changedVertices: [] });
    } else if (animateStonePlacement) {
      const changed = diffSignMap(prevMap, signMap);

      if (changed.length > 0 && changed.length <= maxStonesToAnimate) {
        const newShiftMap = [...shiftMap.map((row) => [...row])];
        for (const [x, y] of changed) {
          // Assign a random shift (1-8) for the new stone, but DON'T readjust neighbors
          // to avoid visual "jumping" of previously-placed stones
          newShiftMap[y][x] = random(7) + 1;
        }
        setShiftMap(newShiftMap);

        if (fuzzyStonePlacement) {
          setAnimation({
            animatedVertices: changed,
            changedVertices: changed,
          });

          const timer = window.setTimeout(() => {
            setAnimation({ animatedVertices: [], changedVertices: [] });
          }, animationDuration);

          return () => window.clearTimeout(timer);
        }
      }
    }

    prevSignMapRef.current = signMap;
  }, [
    signMap,
    width,
    height,
    animateStonePlacement,
    fuzzyStonePlacement,
    animationDuration,
    maxStonesToAnimate,
  ]);

  // Render canvas - use useLayoutEffect for synchronous updates with animation state
  useLayoutEffect(() => {
    const renderer = rendererRef.current;

    // Wait for theme to load before rendering (avoids flash of unstyled stones)
    if (!renderer || !theme || xs.length === 0 || ys.length === 0) return;

    const currentTheme = theme;

    // Add padding for fuzzy stone overflow
    const padding = fuzzyStonePlacement ? FUZZY_PADDING * vertexSize : 0;
    const boardWidth = xs.length * vertexSize;
    const boardHeight = ys.length * vertexSize;
    const canvasWidth = boardWidth + padding * 2;
    const canvasHeight = boardHeight + padding * 2;
    const dpr = window.devicePixelRatio || 1;

    renderer.setSize(canvasWidth, canvasHeight, dpr);
    renderer.clear();

    // Offset all drawing by padding
    renderer.setOffset(padding, padding);

    renderer.drawBoard(currentTheme, boardWidth, boardHeight);
    renderer.drawGrid(xs, ys, hoshis, vertexSize, rangeX, rangeY, width, height, currentTheme);

    // Draw paint map
    if (paintMap) {
      for (const y of ys) {
        for (const x of xs) {
          const paint = paintMap[y]?.[x];
          if (paint && paint !== 0) {
            const neighbors = getNeighborInfo(x, y, paintMap);
            renderer.drawPaint(
              x,
              y,
              paint,
              neighbors,
              vertexSize,
              rangeX,
              rangeY,
              currentTheme
            );
          }
        }
      }
    }

    // Draw ghost stones
    if (ghostStoneMap) {
      for (const y of ys) {
        for (const x of xs) {
          const ghostStone = ghostStoneMap[y]?.[x];
          const sign = signMap[y]?.[x] ?? 0;
          if (ghostStone && sign === 0) {
            renderer.drawGhostStone(
              x,
              y,
              ghostStone,
              sign,
              vertexSize,
              rangeX,
              rangeY,
              currentTheme
            );
          }
        }
      }
    }

    // Draw markers on empty intersections (skip loaders - they're DOM overlays)
    if (markerMap) {
      for (const y of ys) {
        for (const x of xs) {
          const sign = signMap[y]?.[x] ?? 0;
          if (sign === 0) {
            const marker = markerMap[y]?.[x];
            if (marker && marker.type !== "loader") {
              renderer.drawMarker(
                x,
                y,
                marker,
                sign,
                vertexSize,
                rangeX,
                rangeY,
                currentTheme
              );
            }
          }
        }
      }
    }

    // Draw stones (skip stones that are currently animating via DOM overlay)
    for (const y of ys) {
      for (const x of xs) {
        const sign = signMap[y]?.[x];
        if (sign === 1 || sign === -1) {
          // Skip stones that are animating - they're rendered as DOM overlays
          if (animation.animatedVertices.some((v) => vertexEquals(v, [x, y]))) {
            continue;
          }

          const randomVal = randomMap[y]?.[x] ?? 0;
          const shift = fuzzyStonePlacement ? (shiftMap[y]?.[x] ?? 0) : 0;
          const dimmed = dimmedVertices.some((v) => vertexEquals(v, [x, y]));

          renderer.drawStone(
            x,
            y,
            sign,
            randomVal,
            shift,
            vertexSize,
            rangeX,
            rangeY,
            dimmed,
            currentTheme
          );
        }
      }
    }

    // Draw markers on stones (skip loaders - they're DOM overlays)
    if (markerMap) {
      for (const y of ys) {
        for (const x of xs) {
          const sign = signMap[y]?.[x] ?? 0;
          if (sign !== 0) {
            const marker = markerMap[y]?.[x];
            if (marker && marker.type !== "loader") {
              const shift = fuzzyStonePlacement ? (shiftMap[y]?.[x] ?? 0) : 0;
              renderer.drawMarker(
                x,
                y,
                marker,
                sign,
                vertexSize,
                rangeX,
                rangeY,
                currentTheme,
                shift
              );
            }
          }
        }
      }
    }

    // Draw selection
    for (const vertex of selectedVertices) {
      const [x, y] = vertex;
      if (x >= rangeX[0] && x <= rangeX[1] && y >= rangeY[0] && y <= rangeY[1]) {
        const neighbors = getNeighborInfo(x, y, undefined, selectedVertices);
        renderer.drawSelection(
          x,
          y,
          neighbors,
          vertexSize,
          rangeX,
          rangeY,
          currentTheme
        );
      }
    }

    // Draw heat map
    if (heatMap) {
      for (const y of ys) {
        for (const x of xs) {
          const heat = heatMap[y]?.[x];
          if (heat) {
            renderer.drawHeat(
              x,
              y,
              heat,
              vertexSize,
              rangeX,
              rangeY,
              currentTheme
            );
          }
        }
      }
    }

    renderer.flush();
  }, [
    theme,
    xs,
    ys,
    hoshis,
    vertexSize,
    rangeX,
    rangeY,
    width,
    height,
    signMap,
    markerMap,
    paintMap,
    ghostStoneMap,
    heatMap,
    selectedVertices,
    dimmedVertices,
    randomMap,
    shiftMap,
    fuzzyStonePlacement,
    animation.animatedVertices,
  ]);

  // Get vertex from event
  const getVertexFromEvent = useCallback(
    (evt) => {
      if (!canvasRef.current) return null;

      const rect = canvasRef.current.getBoundingClientRect();
      const padding = fuzzyStonePlacement ? FUZZY_PADDING * vertexSize : 0;
      return getVertexFromPoint(
        evt.clientX,
        evt.clientY,
        rect,
        vertexSize,
        rangeX,
        rangeY,
        padding,
        padding
      );
    },
    [vertexSize, rangeX, rangeY, fuzzyStonePlacement]
  );

  // Handle pointer move for enter/leave events
  const handlePointerMove = useCallback(
    (evt) => {
      const vertex = getVertexFromEvent(evt);
      const lastVertex = lastVertexRef.current;

      if (vertex && lastVertex && !vertexEquals(vertex, lastVertex)) {
        const leaveHandler = props.onVertexPointerLeave;
        const enterHandler = props.onVertexPointerEnter;

        if (leaveHandler) leaveHandler(evt, lastVertex);
        if (enterHandler) enterHandler(evt, vertex);
      } else if (vertex && !lastVertex) {
        const enterHandler = props.onVertexPointerEnter;
        if (enterHandler) enterHandler(evt, vertex);
      } else if (!vertex && lastVertex) {
        const leaveHandler = props.onVertexPointerLeave;
        if (leaveHandler) leaveHandler(evt, lastVertex);
      }

      const moveHandler = props.onVertexPointerMove;
      if (moveHandler && vertex) {
        moveHandler(evt, vertex);
      }

      lastVertexRef.current = vertex;
    },
    [getVertexFromEvent, props]
  );

  // Handle pointer down for long press detection
  const handlePointerDown = useCallback(
    (evt) => {
      const vertex = getVertexFromEvent(evt);
      if (!vertex) return;

      const downHandler = props.onVertexPointerDown;
      if (downHandler) downHandler(evt, vertex);

      const longPressHandler = props.onVertexLongPress;
      if (longPressHandler) {
        longPressTimerRef.current = window.setTimeout(() => {
          longPressHandler(evt, vertex);
        }, 500);
      }
    },
    [getVertexFromEvent, props]
  );

  // Handle pointer up
  const handlePointerUp = useCallback(
    (evt) => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const vertex = getVertexFromEvent(evt);
      if (!vertex) return;

      const upHandler = props.onVertexPointerUp;
      if (upHandler) upHandler(evt, vertex);
    },
    [getVertexFromEvent, props]
  );

  // Handle click
  const handleClick = useCallback(
    (evt) => {
      const vertex = getVertexFromEvent(evt);
      if (!vertex) return;

      const clickHandler = props.onVertexClick;
      if (clickHandler) clickHandler(evt, vertex);
    },
    [getVertexFromEvent, props]
  );

  // Mouse event handlers
  const handleMouseMove = useCallback(
    (evt) => {
      const vertex = getVertexFromEvent(evt);
      const lastVertex = lastVertexRef.current;

      if (vertex && lastVertex && !vertexEquals(vertex, lastVertex)) {
        const leaveHandler = props.onVertexMouseLeave;
        const enterHandler = props.onVertexMouseEnter;

        if (leaveHandler) leaveHandler(evt, lastVertex);
        if (enterHandler) enterHandler(evt, vertex);
      } else if (vertex && !lastVertex) {
        const enterHandler = props.onVertexMouseEnter;
        if (enterHandler) enterHandler(evt, vertex);
      } else if (!vertex && lastVertex) {
        const leaveHandler = props.onVertexMouseLeave;
        if (leaveHandler) leaveHandler(evt, lastVertex);
      }

      const moveHandler = props.onVertexMouseMove;
      if (moveHandler && vertex) {
        moveHandler(evt, vertex);
      }

      lastVertexRef.current = vertex;
    },
    [getVertexFromEvent, props]
  );

  const handleMouseDown = useCallback(
    (evt) => {
      const vertex = getVertexFromEvent(evt);
      if (!vertex) return;

      const handler = props.onVertexMouseDown;
      if (handler) handler(evt, vertex);
    },
    [getVertexFromEvent, props]
  );

  const handleMouseUp = useCallback(
    (evt) => {
      const vertex = getVertexFromEvent(evt);
      if (!vertex) return;

      const handler = props.onVertexMouseUp;
      if (handler) handler(evt, vertex);
    },
    [getVertexFromEvent, props]
  );

  // Layout calculations
  const showCoordinatesInside = showCoordinates && !coordinatesOnOutside;
  const showCoordinatesOutside = showCoordinates && coordinatesOnOutside;

  const mainContentGrid = showCoordinatesInside
    ? "1 / 1 / 4 / 4"
    : showCoordinatesOutside
    ? "2 / 2"
    : "1 / 1";

  return h(
    "div",
    {
      ref: containerRef,
      className: "shudan",
      style: {
        display: "inline-grid",
        gridTemplateRows: showCoordinates ? "1em 1fr 1em" : "1fr",
        gridTemplateColumns: showCoordinates ? "1em 1fr 1em" : "1fr",
        fontSize: vertexSize,
        lineHeight: "1em",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
    },

    showCoordinatesOutside &&
      h(CoordX, {
        xs,
        style: { gridRow: "1", gridColumn: "2" },
        coordX,
        outside: true,
      }),

    showCoordinatesOutside &&
      h(CoordY, {
        height,
        ys,
        style: { gridRow: "2", gridColumn: "1" },
        coordY,
        outside: true,
      }),

    h(
      "div",
      {
        ...innerProps,
        id,
        className: classnames(
          "shudan-goban",
          "shudan-goban-image",
          {
            "shudan-busy": busy,
            "shudan-coordinates": showCoordinatesInside,
          },
          props.class ?? props.className
        ),
        style: {
          ...(props.style ?? {}),
          display: "inline-grid",
          gridArea: mainContentGrid,
        },
      },

      showCoordinatesInside &&
        h(CoordX, { xs, style: { gridRow: "1", gridColumn: "2" }, coordX }),

      showCoordinatesInside &&
        h(CoordY, {
          height,
          ys,
          style: { gridRow: "2", gridColumn: "1" },
          coordY,
        }),

      h(
        "div",
        {
          className: "shudan-content",
          style: {
            position: "relative",
            width: `${xs.length}em`,
            height: `${ys.length}em`,
            gridRow: showCoordinates ? "2" : "1",
            gridColumn: showCoordinates ? "2" : "1",
            overflow: "visible",
          },
        },

        h("canvas", {
          ref: canvasRef,
          style: {
            position: "absolute",
            // Offset canvas by padding to align board with layout
            top: fuzzyStonePlacement ? `${-FUZZY_PADDING}em` : 0,
            left: fuzzyStonePlacement ? `${-FUZZY_PADDING}em` : 0,
          },
          onClick: handleClick,
          onMouseMove: handleMouseMove,
          onMouseDown: handleMouseDown,
          onMouseUp: handleMouseUp,
          onPointerMove: handlePointerMove,
          onPointerDown: handlePointerDown,
          onPointerUp: handlePointerUp,
        }),

        animation.animatedVertices.map(([x, y]) => {
          const sign = signMap[y]?.[x];
          if (sign !== 1 && sign !== -1) return null;

          const shift = shiftMap[y]?.[x] ?? 0;
          const randomVal = randomMap[y]?.[x] ?? 0;

          return h(
            "div",
            {
              key: `anim-${x}-${y}`,
              className: classnames(
                "shudan-vertex",
                `shudan-sign_${sign}`,
                `shudan-random_${randomVal}`,
                {
                  [`shudan-shift_${shift}`]: !!shift,
                  "shudan-animate": true,
                  "shudan-changed": animation.changedVertices.some((v) =>
                    vertexEquals(v, [x, y])
                  ),
                }
              ),
              style: {
                position: "absolute",
                left: `${(x - rangeX[0]) * vertexSize}px`,
                top: `${(y - rangeY[0]) * vertexSize}px`,
                width: `${vertexSize}px`,
                height: `${vertexSize}px`,
              },
            },
            h(
              "div",
              {
                className: "shudan-stone",
                style: {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                },
              },
              h("div", {
                className: classnames(
                  "shudan-inner",
                  "shudan-stone-image",
                  `shudan-sign_${sign}`,
                  `shudan-random_${randomVal}`
                ),
                style: {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                },
              })
            )
          );
        }),

        // Loader markers as DOM overlay (for CSS animation)
        markerMap &&
          ys.flatMap((y) =>
            xs.map((x) => {
              const marker = markerMap[y]?.[x];
              if (!marker || marker.type !== "loader") return null;

              const sign = signMap[y]?.[x] ?? 0;

              return h(
                "div",
                {
                  key: `loader-${x}-${y}`,
                  className: classnames(
                    "shudan-vertex",
                    `shudan-sign_${sign}`,
                    "shudan-marker_loader"
                  ),
                  style: {
                    position: "absolute",
                    left: `${(x - rangeX[0]) * vertexSize}px`,
                    top: `${(y - rangeY[0]) * vertexSize}px`,
                    width: `${vertexSize}px`,
                    height: `${vertexSize}px`,
                  },
                },
                h(Marker, {
                  sign,
                  type: "loader",
                })
              );
            })
          ),

        lines.length > 0 &&
          h(
            "svg",
            {
              className: "shudan-lines",
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 2,
              },
            },
            h(
              "g",
              {
                transform: `translate(-${rangeX[0] * vertexSize} -${
                  rangeY[0] * vertexSize
                })`,
              },
              lines.map(({ v1, v2, type }, i) =>
                h(Line, { key: i, v1, v2, type, vertexSize })
              )
            )
          )
      ),

      showCoordinatesInside &&
        h(CoordY, {
          height,
          ys,
          style: { gridRow: "2", gridColumn: "3" },
          coordY,
        }),

      showCoordinatesInside &&
        h(CoordX, {
          xs,
          style: { gridRow: "3", gridColumn: "2" },
          coordX,
        })
    ),

    showCoordinatesOutside &&
      h(CoordY, {
        height,
        ys,
        style: { gridRow: "2", gridColumn: "3" },
        coordY,
        outside: true,
      }),

    showCoordinatesOutside &&
      h(CoordX, {
        xs,
        style: { gridRow: "3", gridColumn: "2" },
        coordX,
        outside: true,
      }),

    // Accessibility layer
    enableA11y &&
      h(A11yGrid, {
        signMap,
        markerMap,
        xs,
        ys,
        coordX,
        coordY,
        onVertexClick: (vertex) => {
          if (props.onVertexClick) {
            props.onVertexClick(new MouseEvent("click"), vertex);
          }
        },
      })
  );
}
