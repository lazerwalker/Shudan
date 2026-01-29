import { GRID_LINE_DIVISOR } from "./constants";
import { type Vertex, type Map } from "./helper";
import { vertexKey } from "./useDomVertices";

// Shift offsets for fuzzy stone placement (in em units)
// Taken from index.css
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

interface GridParams {
  vertexSize: number;
  width: number;
  height: number;
  xs: number[];
  ys: number[];
  foregroundColor: string;
}

export function drawGridLines(ctx: CanvasRenderingContext2D, params: GridParams) {
  const { vertexSize, width, height, xs, ys, foregroundColor } = params;

  if (xs.length === 0 || ys.length === 0) return;

  const halfVertexSize = vertexSize / 2;
  const gridLineSize = vertexSize / GRID_LINE_DIVISOR;

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

export interface HoshiParams {
  vertexSize: number;
  xs: number[];
  ys: number[];
  hoshis: Vertex[];
  foregroundColor: string;
}

export function drawHoshiPoints(ctx: CanvasRenderingContext2D, params: HoshiParams) {
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

export function drawStones(ctx: CanvasRenderingContext2D, params: StoneParams) {
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
