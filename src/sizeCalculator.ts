import {
  BORDER_WIDTH_EM,
  DEFAULT_PADDING_EM,
  COORD_GUTTER_EM,
} from "./constants.js";

export interface BoardConfig {
  // Cols and rows are after applying rangeX/rangeY
  cols: number;
  rows: number;

  showCoordinates: boolean;
  coordinatesOnOutside: boolean;
}

/**
 * Calculate the total "em units" needed for the board in each direction.
 * This accounts for the content area, coordinates, padding, and border.
 */
export function calculateTotalEms(config: BoardConfig): {
  x: number;
  y: number;
} {
  const { cols, rows, showCoordinates, coordinatesOnOutside } = config;

  let totalEmsX: number;
  let totalEmsY: number;

  if (showCoordinates) {
    if (coordinatesOnOutside) {
      totalEmsX =
        cols +
        2 * COORD_GUTTER_EM +
        2 * DEFAULT_PADDING_EM +
        2 * BORDER_WIDTH_EM;
      totalEmsY =
        rows +
        2 * COORD_GUTTER_EM +
        2 * DEFAULT_PADDING_EM +
        2 * BORDER_WIDTH_EM;
    } else {
      // Coordinate gutter acts as padding, no extra padding
      totalEmsX = cols + 2 * COORD_GUTTER_EM + 2 * BORDER_WIDTH_EM;
      totalEmsY = rows + 2 * COORD_GUTTER_EM + 2 * BORDER_WIDTH_EM;
    }
  } else {
    totalEmsX = cols + 2 * DEFAULT_PADDING_EM + 2 * BORDER_WIDTH_EM;
    totalEmsY = rows + 2 * DEFAULT_PADDING_EM + 2 * BORDER_WIDTH_EM;
  }

  return { x: totalEmsX, y: totalEmsY };
}

export interface BoundedSizeResult {
  /** Optimal integer vertex size in pixels */
  vertexSize: number;

  /** Padding to add to each border side (in pixels) (so total padding is 2x and 2y) */
  padding: { x: number; y: number };
}

/**
 * Calculate the optimal integer vertexSize and padding for a bounded goban.
 *
 * @param targetWidth - Target width in pixels (optional if targetHeight provided)
 * @param targetHeight - Target height in pixels (optional if targetWidth provided)
 * @param config - Board configuration (dimensions, coordinates, etc.)
 * @returns The optimal vertexSize and padding values
 */
export function calculateBoundedSize(
  targetWidth: number | undefined,
  targetHeight: number | undefined,
  config: BoardConfig
): BoundedSizeResult {
  if (targetWidth === undefined && targetHeight === undefined) {
    throw new Error(
      "At least one of targetWidth or targetHeight must be provided"
    );
  }

  const totalEms = calculateTotalEms(config);

  // Determine the maximum integer vertexSize that fits
  // Interntionally floor'd to a whole number
  let vertexSize: number;
  if (targetWidth !== undefined && targetHeight !== undefined) {
    vertexSize = Math.floor(
      Math.min(targetWidth / totalEms.x, targetHeight / totalEms.y)
    );
  } else if (targetWidth !== undefined) {
    vertexSize = Math.floor(targetWidth / totalEms.x);
  } else {
    vertexSize = Math.floor(targetHeight! / totalEms.y);
  }

  if (vertexSize < 1) {
    throw new Error(
      `Target dimensions too small: need at least ${Math.ceil(totalEms.x)}x${Math.ceil(totalEms.y)}px`
    );
  }

  // Calculate actual rendered size
  const actualWidth = vertexSize * totalEms.x;
  const actualHeight = vertexSize * totalEms.y;

  // Calculate padding to fill remaining space (distributed evenly on both sides)
  // This would be the extra space caused by imperfect fit due to integer vertexSize
  const paddingX =
    targetWidth !== undefined ? (targetWidth - actualWidth) / 2 : 0;
  const paddingY =
    targetHeight !== undefined ? (targetHeight - actualHeight) / 2 : 0;

  return {
    vertexSize,
    padding: { x: Math.max(0, paddingX), y: Math.max(0, paddingY) },
  };
}
