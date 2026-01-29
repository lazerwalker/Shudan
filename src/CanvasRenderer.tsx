import { useRef, useLayoutEffect } from "react";
import Line from "./Line.js";
import { useTheme } from "./theme.js";
import { type RendererProps } from "./Goban.js";
import { useDomVertices, vertexKey } from "./useDomVertices.js";
import { CanvasVertex } from "./CanvasVertex.js";

export default function CanvasRenderer(props: RendererProps) {
  const {
    vertexSize,
    width,
    height,
    xs,
    ys,
    hoshis,
    signMap,
    heatMap,
    markerMap,
    ghostStoneMap,
    paintMap,
    fuzzyStonePlacement,
    shiftMap,
    randomMap,
    selectedVertices,
    dimmedVertices,
    shiftingStones,
    placedStones,
    lines,
    rangeX,
    rangeY,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme(containerRef, vertexSize);

  // Add padding for fuzzy stone placement overflow (stones can shift up to 0.07em)
  const fuzzyPadding = fuzzyStonePlacement ? Math.ceil(vertexSize * 0.1) : 0;
  const canvasWidth = xs.length * vertexSize + fuzzyPadding * 2;
  const canvasHeight = ys.length * vertexSize + fuzzyPadding * 2;

  const { domVertices, selectedSet, dimmedSet, shiftingSet, placedSet } =
    useDomVertices({
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
    });

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.translate(fuzzyPadding, fuzzyPadding);

    // Drawing order matches DOM z-index: grid → hoshi → stones → DOM stuff

    // 1. Grid lines
    drawGridLines(ctx, {
      vertexSize,
      width,
      height,
      xs,
      ys,
      foregroundColor: theme.boardForegroundColor,
    });

    // 2. Hoshi points
    drawHoshiPoints(ctx, {
      vertexSize,
      xs,
      ys,
      hoshis,
      foregroundColor: theme.boardForegroundColor,
    });

    // 3. Stones (dimmed/placed/shifting stones are rendered as DOM)
    drawStones(ctx, {
      vertexSize,
      xs,
      ys,
      signMap,
      fuzzyStonePlacement,
      shiftMap,
      dimmedSet,
      shiftingSet,
      placedSet,
      blackStoneImage: theme.blackStoneImage,
      whiteStoneImage: theme.whiteStoneImage,
      blackColor: theme.blackBackgroundColor,
      whiteColor: theme.whiteBackgroundColor,
    });

    // Everything else done in DOM
  }, [
    canvasWidth,
    canvasHeight,
    fuzzyPadding,
    vertexSize,
    width,
    height,
    xs,
    ys,
    hoshis,
    signMap,
    fuzzyStonePlacement,
    shiftMap,
    dimmedSet,
    shiftingSet,
    placedSet,
    theme,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: -fuzzyPadding,
          left: -fuzzyPadding,
          width: canvasWidth,
          height: canvasHeight,
          zIndex: 0,
        }}
      />

      <div
        className="shudan-vertices"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      >
        {domVertices.map(
          ({ x, y, xi, yi, sign, selected, dimmed, animate, changed }) => (
            <CanvasVertex
              key={`${x}-${y}`}
              xi={xi}
              yi={yi}
              vertexSize={vertexSize}
              position={[x, y]}
              shift={fuzzyStonePlacement ? shiftMap?.[y]?.[x] : 0}
              random={randomMap?.[y]?.[x]}
              sign={sign}
              heat={heatMap?.[y]?.[x]}
              marker={markerMap?.[y]?.[x]}
              ghostStone={ghostStoneMap?.[y]?.[x]}
              dimmed={dimmed}
              animate={animate}
              changed={changed}
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
              selectedLeft={selected && selectedSet.has(vertexKey(x - 1, y))}
              selectedRight={selected && selectedSet.has(vertexKey(x + 1, y))}
              selectedTop={selected && selectedSet.has(vertexKey(x, y - 1))}
              selectedBottom={selected && selectedSet.has(vertexKey(x, y + 1))}
            />
          )
        )}
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
            <Line key={i} v1={v1} v2={v2} type={type} vertexSize={vertexSize} />
          ))}
        </g>
      </svg>
    </div>
  );
}