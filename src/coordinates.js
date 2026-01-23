/**
 * Convert a client-relative point to a board vertex.
 *
 * @param {number} clientX - Mouse/touch X position relative to viewport
 * @param {number} clientY - Mouse/touch Y position relative to viewport
 * @param {DOMRect} canvasRect - Bounding client rect of the canvas element
 * @param {number} vertexSize - Size of each vertex in CSS pixels
 * @param {[number, number]} rangeX - [start, stop] range for x coordinates
 * @param {[number, number]} rangeY - [start, stop] range for y coordinates
 * @param {number} offsetX - Additional X offset
 * @param {number} offsetY - Additional Y offset
 * @returns {[number, number] | null} The vertex at this position, or null if outside the board
 */
export function getVertexFromPoint(
  clientX,
  clientY,
  canvasRect,
  vertexSize,
  rangeX,
  rangeY,
  offsetX = 0,
  offsetY = 0
) {
  const relX = clientX - canvasRect.left - offsetX;
  const relY = clientY - canvasRect.top - offsetY;

  const x = Math.floor(relX / vertexSize) + rangeX[0];
  const y = Math.floor(relY / vertexSize) + rangeY[0];

  if (x < rangeX[0] || x > rangeX[1] || y < rangeY[0] || y > rangeY[1]) {
    return null;
  }

  return [x, y];
}

/**
 * Get the center point of a vertex in canvas-relative coordinates.
 *
 * @param {[number, number]} vertex - The vertex to get the center of
 * @param {number} vertexSize - Size of each vertex in CSS pixels
 * @param {[number, number]} rangeX - [start, stop] range for x coordinates
 * @param {[number, number]} rangeY - [start, stop] range for y coordinates
 * @returns {{ x: number, y: number }} The center point in canvas-relative coordinates
 */
export function getVertexCenter(vertex, vertexSize, rangeX, rangeY) {
  const [vx, vy] = vertex;
  return {
    x: (vx - rangeX[0] + 0.5) * vertexSize,
    y: (vy - rangeY[0] + 0.5) * vertexSize,
  };
}

/**
 * Check if a point is within a certain distance of a vertex center.
 *
 * @param {number} clientX - Mouse/touch X position relative to viewport
 * @param {number} clientY - Mouse/touch Y position relative to viewport
 * @param {DOMRect} canvasRect - Bounding client rect of the canvas element
 * @param {[number, number]} vertex - The vertex to check against
 * @param {number} vertexSize - Size of each vertex in CSS pixels
 * @param {[number, number]} rangeX - [start, stop] range for x coordinates
 * @param {[number, number]} rangeY - [start, stop] range for y coordinates
 * @param {number} threshold - Maximum distance from center
 * @returns {boolean} True if the point is within the threshold distance
 */
export function isPointNearVertex(
  clientX,
  clientY,
  canvasRect,
  vertex,
  vertexSize,
  rangeX,
  rangeY,
  threshold
) {
  const relX = clientX - canvasRect.left;
  const relY = clientY - canvasRect.top;

  const center = getVertexCenter(vertex, vertexSize, rangeX, rangeY);
  const maxDist = threshold ?? vertexSize / 2;

  const dx = relX - center.x;
  const dy = relY - center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return dist <= maxDist;
}

/**
 * Get all vertices within a rectangular selection.
 *
 * @param {number} startX - Start X position relative to canvas
 * @param {number} startY - Start Y position relative to canvas
 * @param {number} endX - End X position relative to canvas
 * @param {number} endY - End Y position relative to canvas
 * @param {number} vertexSize - Size of each vertex in CSS pixels
 * @param {[number, number]} rangeX - [start, stop] range for x coordinates
 * @param {[number, number]} rangeY - [start, stop] range for y coordinates
 * @returns {Array<[number, number]>} Array of vertices within the selection rectangle
 */
export function getVerticesInRect(
  startX,
  startY,
  endX,
  endY,
  vertexSize,
  rangeX,
  rangeY
) {
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);

  const startBoardX = Math.max(
    rangeX[0],
    Math.floor(minX / vertexSize) + rangeX[0]
  );
  const endBoardX = Math.min(
    rangeX[1],
    Math.floor(maxX / vertexSize) + rangeX[0]
  );
  const startBoardY = Math.max(
    rangeY[0],
    Math.floor(minY / vertexSize) + rangeY[0]
  );
  const endBoardY = Math.min(
    rangeY[1],
    Math.floor(maxY / vertexSize) + rangeY[0]
  );

  const vertices = [];

  for (let y = startBoardY; y <= endBoardY; y++) {
    for (let x = startBoardX; x <= endBoardX; x++) {
      vertices.push([x, y]);
    }
  }

  return vertices;
}
