// Layout constants matching goban.css
// These define the structural sizing of the goban component

/** Border width around the board (em units relative to vertexSize) */
export const BORDER_WIDTH_EM = 0.15;

/** Default padding inside the board when coordinates are not shown (em units) */
export const DEFAULT_PADDING_EM = 0.25;

/** Space allocated for coordinate labels (em units) */
export const COORD_GUTTER_EM = 1;

/**
 * Divisor for calculating grid line thickness from vertexSize.
 * At vertexSize=40, gridLineWidth = 1px.
 * At vertexSize=20, gridLineWidth = 0.5px.
 */
export const GRID_LINE_DIVISOR = 40;
