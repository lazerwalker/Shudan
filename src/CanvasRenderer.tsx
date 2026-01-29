import { useRef, useLayoutEffect } from "react";
import { type Vertex as VertexData, type Map } from "./helper.js";
import Line from "./Line.js";
import { useTheme } from "./theme.js";
import { type RendererProps } from "./Goban.js";
import { useDomVertices, vertexKey } from "./useDomVertices.js";
import { CanvasVertex } from "./CanvasVertex.js";

// Shift offsets for fuzzy stone placement (in em units)
// Taken from index.css — could conceivably read from CSS at some point?
const shiftOffsets: Record<number, [number, number]> = {
  0: [0, 0],
  1: [-0.07, 0],
  2: [0, -0.07],
  3: [0.07, 0],
  4: [0, 0.07],
  5: [-0.04, -0.04],
  6: [0.04, -0.04],
  7: [0.04, 0.04],
  8: [-0.04, 0.04],
};

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

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Translate for fuzzy padding
    ctx.translate(fuzzyPadding, fuzzyPadding);

    // Drawing order matches DOM z-index: grid → hoshi → stones → paint → selection → heat
    // (markers and ghost stones are DOM overlays)

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

    // Selection, paint, and heat map are rendered as DOM overlays
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

      {/* Ghost stones, markers, paint, selection, heat map, and dimmed/shifting stones rendered as DOM overlay */}
      {/* Only renders vertices that actually need DOM - not all 361 */}
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

      {/* Lines rendered as SVG overlay */}
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

// --- Drawing functions ---

interface GridParams {
  vertexSize: number;
  width: number;
  height: number;
  xs: number[];
  ys: number[];
  foregroundColor: string;
}

function drawGridLines(ctx: CanvasRenderingContext2D, params: GridParams) {
  const { vertexSize, width, height, xs, ys, foregroundColor } = params;

  if (xs.length === 0 || ys.length === 0) return;

  const halfVertexSize = vertexSize / 2;
  const gridLineSize = vertexSize / 40;

  ctx.fillStyle = foregroundColor;

  // Horizontal lines
  for (let i = 0; i < ys.length; i++) {
    // If at left edge of board, start at vertex center; otherwise extend to canvas edge
    const x = xs[0] === 0 ? halfVertexSize : 0;
    const y = (2 * i + 1) * halfVertexSize;

    // If at right edge of board, end at vertex center; otherwise extend to canvas edge
    const lineWidth =
      xs[xs.length - 1] === width - 1
        ? (2 * xs.length - 1) * halfVertexSize - x
        : xs.length * vertexSize - x;

    ctx.fillRect(x, y, lineWidth, gridLineSize);
  }

  // Vertical lines
  for (let i = 0; i < xs.length; i++) {
    // If at top edge of board, start at vertex center; otherwise extend to canvas edge
    const y = ys[0] === 0 ? halfVertexSize : 0;
    const x = (2 * i + 1) * halfVertexSize;

    // If at bottom edge of board, end at vertex center; otherwise extend to canvas edge
    const lineHeight =
      ys[ys.length - 1] === height - 1
        ? (2 * ys.length - 1) * halfVertexSize - y
        : ys.length * vertexSize - y;

    ctx.fillRect(x, y, gridLineSize, lineHeight);
  }
}

interface HoshiParams {
  vertexSize: number;
  xs: number[];
  ys: number[];
  hoshis: VertexData[];
  foregroundColor: string;
}

function drawHoshiPoints(ctx: CanvasRenderingContext2D, params: HoshiParams) {
  const { vertexSize, xs, ys, hoshis, foregroundColor } = params;

  const halfVertexSize = vertexSize / 2;
  const radius = 0.1 * vertexSize;

  ctx.fillStyle = foregroundColor;

  for (const [x, y] of hoshis) {
    const i = xs.indexOf(x);
    const j = ys.indexOf(y);
    if (i < 0 || j < 0) continue;

    const cx = (2 * i + 1) * halfVertexSize + 0.5;
    const cy = (2 * j + 1) * halfVertexSize + 0.5;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface StoneParams {
  vertexSize: number;
  xs: number[];
  ys: number[];
  signMap: Map<0 | 1 | -1>;
  fuzzyStonePlacement: boolean;
  shiftMap: number[][];
  dimmedSet: Set<string>;
  shiftingSet: Set<string>;
  placedSet: Set<string>;
  blackStoneImage: HTMLCanvasElement | null;
  whiteStoneImage: HTMLCanvasElement | null;
  blackColor: string;
  whiteColor: string;
}

function drawStones(ctx: CanvasRenderingContext2D, params: StoneParams) {
  const {
    vertexSize,
    xs,
    ys,
    signMap,
    fuzzyStonePlacement,
    shiftMap,
    dimmedSet,
    shiftingSet,
    placedSet,
    blackStoneImage,
    whiteStoneImage,
    blackColor,
    whiteColor,
  } = params;

  const halfVertexSize = vertexSize / 2;
  const stoneMargin = 0.04 * vertexSize;
  const stoneSize = vertexSize - 2 * stoneMargin;

  for (let yi = 0; yi < ys.length; yi++) {
    const y = ys[yi];
    for (let xi = 0; xi < xs.length; xi++) {
      const x = xs[xi];
      const sign = signMap?.[y]?.[x];
      if (sign === 0 || sign === undefined) continue;

      // Skip stones that are being animated, shifting, or dimmed (they're rendered as DOM)
      const key = vertexKey(x, y);
      if (placedSet.has(key)) continue;
      if (shiftingSet.has(key)) continue;
      if (dimmedSet.has(key)) continue;

      const cx = (2 * xi + 1) * halfVertexSize;
      const cy = (2 * yi + 1) * halfVertexSize;

      // Apply shift offset for fuzzy placement
      let offsetX = 0;
      let offsetY = 0;
      if (fuzzyStonePlacement) {
        const shift = shiftMap?.[y]?.[x] || 0;
        const [dx, dy] = shiftOffsets[shift] || [0, 0];
        offsetX = dx * vertexSize;
        offsetY = dy * vertexSize;
      }

      const stoneX = cx - halfVertexSize + stoneMargin + offsetX;
      const stoneY = cy - halfVertexSize + stoneMargin + offsetY;
      const stoneCenterX = stoneX + stoneSize / 2;
      const stoneCenterY = stoneY + stoneSize / 2;

      ctx.save();

      // Draw an opaque circle to generate the shadow, matching CSS where
      // box-shadow is cast from the ::before's border-radius:50% shape.
      // Canvas shadow alpha is multiplied by source alpha, so the circle
      // must be fully opaque for the shadow to match shadowColor exactly.
      ctx.shadowColor = "rgba(23, 10, 2, 0.4)";
      ctx.shadowBlur = 0.4 * vertexSize;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0.1 * vertexSize;

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(stoneCenterX, stoneCenterY, stoneSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw stone on top without shadow (covers the opaque circle)
      ctx.shadowColor = "transparent";

      const stoneImage = sign === 1 ? blackStoneImage : whiteStoneImage;
      if (stoneImage) {
        ctx.drawImage(stoneImage, stoneX, stoneY, stoneSize, stoneSize);
      } else {
        ctx.fillStyle = sign === 1 ? blackColor : whiteColor;
        ctx.beginPath();
        ctx.arc(stoneCenterX, stoneCenterY, stoneSize / 2, 0, Math.PI * 2);
        ctx.fill();

        if (sign === -1) {
          ctx.strokeStyle = "#c3c3c3";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(stoneCenterX, stoneCenterY, stoneSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}
