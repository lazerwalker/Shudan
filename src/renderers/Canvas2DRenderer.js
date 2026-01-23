import { shiftOffsets } from "../types.js";

/**
 * Canvas 2D implementation of the board renderer.
 */
export class Canvas2DRenderer {
  constructor(canvas) {
    this.canvas = canvas ?? document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.dpr = 1;

    if (!this.ctx) {
      throw new Error("Could not get 2D rendering context");
    }
  }

  setSize(width, height, dpr) {
    this.dpr = dpr;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
    this.offsetX = 0;
    this.offsetY = 0;
  }

  setOffset(x, y) {
    this.offsetX = x;
    this.offsetY = y;
  }

  clear() {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.clearRect(
      0,
      0,
      this.canvas.width / this.dpr,
      this.canvas.height / this.dpr
    );
    // Apply offset translation after clearing
    this.ctx.translate(this.offsetX, this.offsetY);
  }

  drawBoard(theme, width, height) {
    const ctx = this.ctx;

    ctx.fillStyle = theme.boardBgColor;
    ctx.fillRect(0, 0, width, height);

    if (theme.boardImage) {
      ctx.drawImage(theme.boardImage, 0, 0, width, height);
    }
  }

  drawGrid(xs, ys, hoshis, vertexSize, rangeX, rangeY, boardWidth, boardHeight, theme) {
    const ctx = this.ctx;
    const lineWidth = theme.gridLineWidth * vertexSize;

    ctx.fillStyle = theme.boardFgColor;

    const gridWidth = xs.length * vertexSize;
    const gridHeight = ys.length * vertexSize;

    // Check if we're at actual board edges
    const atLeftEdge = xs[0] === 0;
    const atRightEdge = xs[xs.length - 1] === boardWidth - 1;
    const atTopEdge = ys[0] === 0;
    const atBottomEdge = ys[ys.length - 1] === boardHeight - 1;

    // Draw vertical lines
    for (let i = 0; i < xs.length; i++) {
      const x = (i + 0.5) * vertexSize;

      // Lines start at center of first row if at top edge, else extend to canvas edge
      const lineTop = atTopEdge ? 0.5 * vertexSize : 0;
      // Lines end at center of last row if at bottom edge, else extend to canvas edge
      const lineBottom = atBottomEdge ? (ys.length - 0.5) * vertexSize : gridHeight;

      ctx.fillRect(x - lineWidth / 2, lineTop, lineWidth, lineBottom - lineTop);
    }

    // Draw horizontal lines
    for (let i = 0; i < ys.length; i++) {
      const y = (i + 0.5) * vertexSize;

      // Lines start at center of first column if at left edge, else extend to canvas edge
      const lineLeft = atLeftEdge ? 0.5 * vertexSize : 0;
      // Lines end at center of last column if at right edge, else extend to canvas edge
      const lineRight = atRightEdge ? (xs.length - 0.5) * vertexSize : gridWidth;

      ctx.fillRect(lineLeft, y - lineWidth / 2, lineRight - lineLeft, lineWidth);
    }

    // Draw hoshi points
    const hoshiRadius = theme.hoshiRadius * vertexSize;
    for (const [hx, hy] of hoshis) {
      if (hx < rangeX[0] || hx > rangeX[1] || hy < rangeY[0] || hy > rangeY[1]) {
        continue;
      }

      const cx = (hx - rangeX[0] + 0.5) * vertexSize;
      const cy = (hy - rangeY[0] + 0.5) * vertexSize;

      ctx.beginPath();
      ctx.arc(cx, cy, hoshiRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawStone(x, y, sign, random, shift, vertexSize, rangeX, rangeY, dimmed, theme) {
    const ctx = this.ctx;

    const shiftOffset = shiftOffsets[shift] || shiftOffsets[0];
    const baseX = (x - rangeX[0] + 0.5) * vertexSize;
    const baseY = (y - rangeY[0] + 0.5) * vertexSize;
    const drawX = baseX + shiftOffset.x * vertexSize;
    const drawY = baseY + shiftOffset.y * vertexSize;

    const offset = theme.stoneOffset;
    const stoneSize = vertexSize - offset.x * 2 * vertexSize;
    const stoneRadius = stoneSize / 2;

    const cachedStones =
      sign === 1 ? theme.cachedBlackStones : theme.cachedWhiteStones;
    const stoneImages =
      sign === 1 ? theme.blackStoneImages : theme.whiteStoneImages;

    ctx.save();

    if (dimmed) {
      ctx.globalAlpha = 0.6;
    }

    if (cachedStones && cachedStones[random]) {
      const cached = cachedStones[random];
      const shadowPadding = (theme.stoneShadow?.blur ?? 0) * 2 * vertexSize;
      ctx.drawImage(
        cached,
        drawX - stoneRadius - shadowPadding,
        drawY - stoneRadius - shadowPadding,
        stoneSize + shadowPadding * 2,
        stoneSize + shadowPadding * 2
      );
    } else if (stoneImages && stoneImages[random]) {
      // Draw stone image with shadow
      if (theme.stoneShadow) {
        ctx.shadowColor = theme.stoneShadow.color;
        ctx.shadowBlur = theme.stoneShadow.blur * vertexSize;
        ctx.shadowOffsetX = theme.stoneShadow.dx * vertexSize;
        ctx.shadowOffsetY = theme.stoneShadow.dy * vertexSize;
      }

      ctx.drawImage(
        stoneImages[random],
        drawX - stoneRadius,
        drawY - stoneRadius,
        stoneSize,
        stoneSize
      );
    } else {
      // Fallback: draw solid colored circle with shadow
      if (theme.stoneShadow) {
        ctx.shadowColor = theme.stoneShadow.color;
        ctx.shadowBlur = theme.stoneShadow.blur * vertexSize;
        ctx.shadowOffsetX = theme.stoneShadow.dx * vertexSize;
        ctx.shadowOffsetY = theme.stoneShadow.dy * vertexSize;
      }

      ctx.beginPath();
      ctx.arc(drawX, drawY, stoneRadius, 0, Math.PI * 2);
      ctx.fillStyle = sign === 1 ? theme.blackBgColor : theme.whiteBgColor;
      ctx.fill();
    }

    ctx.restore();
  }

  drawMarker(x, y, marker, sign, vertexSize, rangeX, rangeY, theme, shift = 0) {
    if (!marker.type) return;

    const ctx = this.ctx;
    const shiftOffset = shiftOffsets[shift] || shiftOffsets[0];
    const baseX = (x - rangeX[0] + 0.5) * vertexSize;
    const baseY = (y - rangeY[0] + 0.5) * vertexSize;
    // Apply shift only for markers on stones (sign !== 0)
    const cx = sign !== 0 ? baseX + shiftOffset.x * vertexSize : baseX;
    const cy = sign !== 0 ? baseY + shiftOffset.y * vertexSize : baseY;

    const offset = sign !== 0 ? 0 : 0.04 * vertexSize;
    const markerSize = vertexSize - offset * 2;
    const markerRadius = markerSize / 2;

    let strokeColor;
    let fillColor;

    if (sign === 1) {
      strokeColor = theme.blackFgColor;
      fillColor = "transparent";
    } else if (sign === -1) {
      strokeColor = theme.whiteFgColor;
      fillColor = "transparent";
    } else {
      strokeColor = theme.boardFgColor;
      fillColor = theme.boardBgColor;
    }

    const strokeWidth = theme.markerStrokeWidth * vertexSize;

    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    switch (marker.type) {
      case "circle":
        ctx.beginPath();
        ctx.arc(cx, cy, markerRadius * 0.5, 0, Math.PI * 2);
        if (sign === 0) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        ctx.stroke();
        break;

      case "square": {
        const halfSize = markerRadius * 0.45;
        ctx.beginPath();
        ctx.rect(cx - halfSize, cy - halfSize, halfSize * 2, halfSize * 2);
        if (sign === 0) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        ctx.stroke();
        break;
      }

      case "triangle": {
        const triRadius = markerRadius * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - triRadius);
        ctx.lineTo(cx + triRadius * 0.866, cy + triRadius * 0.5);
        ctx.lineTo(cx - triRadius * 0.866, cy + triRadius * 0.5);
        ctx.closePath();
        if (sign === 0) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        ctx.stroke();
        break;
      }

      case "cross": {
        const crossSize = markerRadius * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx - crossSize, cy - crossSize);
        ctx.lineTo(cx + crossSize, cy + crossSize);
        ctx.moveTo(cx + crossSize, cy - crossSize);
        ctx.lineTo(cx - crossSize, cy + crossSize);
        ctx.stroke();
        break;
      }

      case "point":
        ctx.fillStyle =
          sign === 1
            ? theme.blackFgColor
            : sign === -1
            ? theme.whiteFgColor
            : theme.boardFgColor;
        ctx.beginPath();
        // Match DOM SVG: r=0.18 in viewBox 0-1, so radius is 0.18 * vertexSize
        ctx.arc(cx, cy, 0.18 * vertexSize, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "label":
        if (marker.label) {
          const isSmall = marker.label.length > 2;
          const fontSize = isSmall ? 0.36 * vertexSize : 0.6 * vertexSize;

          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (sign === 0) {
            const metrics = ctx.measureText(marker.label);
            const labelWidth = Math.min(
              metrics.width + 4,
              isSmall ? 2.7 * fontSize : 1.67 * fontSize
            );
            const labelHeight = isSmall ? 2.7 * fontSize : 1.67 * fontSize;

            ctx.fillStyle = theme.boardBgColor;
            ctx.fillRect(
              cx - labelWidth / 2,
              cy - labelHeight / 2,
              labelWidth,
              labelHeight
            );
          }

          ctx.fillStyle =
            sign === 1
              ? theme.blackFgColor
              : sign === -1
              ? theme.whiteFgColor
              : theme.boardFgColor;
          ctx.fillText(marker.label, cx, cy);
        }
        break;

      case "loader":
        ctx.setLineDash([vertexSize * 0.3, vertexSize * 0.3]);
        ctx.beginPath();
        ctx.arc(cx, cy, markerRadius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
    }

    ctx.restore();
  }

  drawGhostStone(x, y, ghostStone, sign, vertexSize, rangeX, rangeY, theme) {
    if (sign !== 0 && ghostStone.sign !== 0) return;

    const ctx = this.ctx;
    const cx = (x - rangeX[0] + 0.5) * vertexSize;
    const cy = (y - rangeY[0] + 0.5) * vertexSize;

    const radius = theme.ghostRadius * vertexSize;
    const opacity = ghostStone.faint
      ? theme.ghostFaintOpacity
      : theme.ghostOpacity;

    ctx.save();
    ctx.globalAlpha = opacity;

    let color;
    if (ghostStone.type && theme.ghostTypeColors[ghostStone.type]) {
      color = theme.ghostTypeColors[ghostStone.type];
    } else if (ghostStone.sign === 1) {
      color = "rgba(0, 0, 0, 0.8)";
    } else if (ghostStone.sign === -1) {
      color = "white";
    } else {
      ctx.restore();
      return;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPaint(x, y, paint, neighbors, vertexSize, rangeX, rangeY, theme) {
    const ctx = this.ctx;
    const px = (x - rangeX[0]) * vertexSize;
    const py = (y - rangeY[0]) * vertexSize;

    ctx.save();
    ctx.globalAlpha = theme.paintOpacity;

    const borderRadius = theme.paintBorderRadius * vertexSize;
    const color = paint === 1 ? theme.blackBgColor : theme.whiteBgColor;

    ctx.fillStyle = color;

    this._drawRoundedRectWithNeighbors(
      px,
      py,
      vertexSize,
      vertexSize,
      borderRadius,
      neighbors
    );
    ctx.fill();

    ctx.restore();
  }

  drawSelection(x, y, neighbors, vertexSize, rangeX, rangeY, theme) {
    const ctx = this.ctx;
    const px = (x - rangeX[0]) * vertexSize;
    const py = (y - rangeY[0]) * vertexSize;

    const borderRadius = theme.selectionBorderRadius * vertexSize;
    const borderWidth = theme.selectionBorderWidth * vertexSize;

    ctx.save();

    // Draw background
    ctx.fillStyle = theme.selectionBgColor;
    this._drawRoundedRectWithNeighbors(
      px,
      py,
      vertexSize,
      vertexSize,
      borderRadius,
      neighbors
    );
    ctx.fill();

    // Draw border segments
    ctx.strokeStyle = theme.selectionBorderColor;
    ctx.lineWidth = borderWidth;

    if (!neighbors.top) {
      ctx.beginPath();
      ctx.moveTo(px + (neighbors.left ? 0 : borderRadius), py);
      ctx.lineTo(px + vertexSize - (neighbors.right ? 0 : borderRadius), py);
      ctx.stroke();
    }
    if (!neighbors.bottom) {
      ctx.beginPath();
      ctx.moveTo(px + (neighbors.left ? 0 : borderRadius), py + vertexSize);
      ctx.lineTo(
        px + vertexSize - (neighbors.right ? 0 : borderRadius),
        py + vertexSize
      );
      ctx.stroke();
    }
    if (!neighbors.left) {
      ctx.beginPath();
      ctx.moveTo(px, py + (neighbors.top ? 0 : borderRadius));
      ctx.lineTo(px, py + vertexSize - (neighbors.bottom ? 0 : borderRadius));
      ctx.stroke();
    }
    if (!neighbors.right) {
      ctx.beginPath();
      ctx.moveTo(px + vertexSize, py + (neighbors.top ? 0 : borderRadius));
      ctx.lineTo(
        px + vertexSize,
        py + vertexSize - (neighbors.bottom ? 0 : borderRadius)
      );
      ctx.stroke();
    }

    // Draw corner arcs
    if (!neighbors.top && !neighbors.left) {
      ctx.beginPath();
      ctx.arc(
        px + borderRadius,
        py + borderRadius,
        borderRadius,
        Math.PI,
        Math.PI * 1.5
      );
      ctx.stroke();
    }
    if (!neighbors.top && !neighbors.right) {
      ctx.beginPath();
      ctx.arc(
        px + vertexSize - borderRadius,
        py + borderRadius,
        borderRadius,
        Math.PI * 1.5,
        0
      );
      ctx.stroke();
    }
    if (!neighbors.bottom && !neighbors.left) {
      ctx.beginPath();
      ctx.arc(
        px + borderRadius,
        py + vertexSize - borderRadius,
        borderRadius,
        Math.PI * 0.5,
        Math.PI
      );
      ctx.stroke();
    }
    if (!neighbors.bottom && !neighbors.right) {
      ctx.beginPath();
      ctx.arc(
        px + vertexSize - borderRadius,
        py + vertexSize - borderRadius,
        borderRadius,
        0,
        Math.PI * 0.5
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  drawHeat(x, y, heat, vertexSize, rangeX, rangeY, theme) {
    const ctx = this.ctx;
    const cx = (x - rangeX[0] + 0.5) * vertexSize;
    const cy = (y - rangeY[0] + 0.5) * vertexSize;

    const strength = Math.max(1, Math.min(9, heat.strength));
    const heatConfig = theme.heatColors[strength];

    if (!heatConfig) return;

    ctx.save();
    ctx.globalAlpha = heatConfig.opacity;

    const glowRadius = heatConfig.glowRadius * vertexSize;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, heatConfig.color);
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    if (heat.text) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "white";
      ctx.font = `${0.36 * vertexSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 0.3 * vertexSize;
      ctx.shadowOffsetY = 0.1 * vertexSize;
      ctx.fillText(heat.text, cx, cy);
    }

    ctx.restore();
  }

  flush() {
    // Canvas 2D doesn't require explicit flushing
  }

  getCanvas() {
    return this.canvas;
  }

  dispose() {
    // Clean up resources
  }

  _drawRoundedRectWithNeighbors(x, y, width, height, radius, neighbors) {
    const ctx = this.ctx;
    const { left, right, top, bottom } = neighbors;

    ctx.beginPath();

    // Top-left corner
    if (top || left) {
      ctx.moveTo(x, y);
    } else {
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x, y, x, y + radius, radius);
    }

    // Left edge and bottom-left corner
    if (bottom || left) {
      ctx.lineTo(x, y + height);
    } else {
      ctx.lineTo(x, y + height - radius);
      ctx.arcTo(x, y + height, x + radius, y + height, radius);
    }

    // Bottom edge and bottom-right corner
    if (bottom || right) {
      ctx.lineTo(x + width, y + height);
    } else {
      ctx.lineTo(x + width - radius, y + height);
      ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    }

    // Right edge and top-right corner
    if (top || right) {
      ctx.lineTo(x + width, y);
    } else {
      ctx.lineTo(x + width, y + radius);
      ctx.arcTo(x + width, y, x + width - radius, y, radius);
    }

    ctx.closePath();
  }
}
