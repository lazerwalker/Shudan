// Core types
export type Vertex = [x: number, y: number];
export type SignMap = (0 | 1 | -1)[][];
export type Sign = 0 | 1 | -1;

export interface Marker {
  type?:
    | "circle"
    | "cross"
    | "triangle"
    | "square"
    | "point"
    | "loader"
    | "label"
    | null;
  label?: string | null;
}

export interface GhostStone {
  sign: 0 | -1 | 1;
  type?: "good" | "interesting" | "doubtful" | "bad" | null;
  faint?: boolean | null;
}

export interface HeatVertex {
  strength: number;
  text?: string | null;
}

export interface LineMarker {
  v1: Vertex;
  v2: Vertex;
  type?: "line" | "arrow";
}

// Neighbor info for paint/selection rendering
export interface NeighborInfo {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

// Shadow configuration
export interface ShadowConfig {
  dx: number;
  dy: number;
  blur: number;
  color: string;
}

// Theme configuration for canvas rendering
export interface CanvasTheme {
  // Colors
  boardBgColor: string;
  boardFgColor: string;
  boardBorderColor: string;
  blackBgColor: string;
  blackFgColor: string;
  whiteBgColor: string;
  whiteFgColor: string;

  // Board
  boardImage?: HTMLImageElement | null;
  borderWidth: number;

  // Grid
  gridLineWidth: number;
  hoshiRadius: number;
  gridDropShadow?: ShadowConfig;

  // Stones
  blackStoneImages: HTMLImageElement[];
  whiteStoneImages: HTMLImageElement[];
  stoneScale: number;
  stoneOffset: { x: number; y: number };
  stoneShadow?: ShadowConfig;

  // Pre-rendered stone canvases
  cachedBlackStones?: HTMLCanvasElement[];
  cachedWhiteStones?: HTMLCanvasElement[];

  // Markers
  markerStrokeWidth: number;

  // Coordinates
  coordFontSize: number;

  // Heat map colors
  heatColors: Record<
    number,
    { color: string; glowRadius: number; opacity: number }
  >;

  // Selection
  selectionBorderColor: string;
  selectionBorderWidth: number;
  selectionBgColor: string;
  selectionBorderRadius: number;

  // Paint
  paintOpacity: number;
  paintBorderRadius: number;

  // Ghost stones
  ghostOpacity: number;
  ghostFaintOpacity: number;
  ghostRadius: number;
  ghostTypeColors: Record<string, string>;

  // Lines
  lineStrokeWidth: number;
}

// Shift offsets for fuzzy placement
export const shiftOffsets: Record<number, { x: number; y: number }>;
