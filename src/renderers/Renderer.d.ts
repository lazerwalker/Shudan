import type {
  CanvasTheme,
  Vertex,
  Marker,
  GhostStone,
  HeatVertex,
  NeighborInfo,
  Sign,
} from "../types";

/**
 * Abstract renderer interface for the Go board.
 */
export interface Renderer {
  setSize(width: number, height: number, dpr: number): void;
  clear(): void;
  drawBoard(theme: CanvasTheme, width: number, height: number): void;
  drawGrid(
    xs: number[],
    ys: number[],
    hoshis: Vertex[],
    vertexSize: number,
    rangeX: [number, number],
    rangeY: [number, number],
    theme: CanvasTheme
  ): void;
  drawStone(
    x: number,
    y: number,
    sign: 1 | -1,
    random: number,
    shift: number,
    vertexSize: number,
    rangeX: [number, number],
    rangeY: [number, number],
    dimmed: boolean,
    theme: CanvasTheme
  ): void;
  drawMarker(
    x: number,
    y: number,
    marker: Marker,
    sign: Sign,
    vertexSize: number,
    rangeX: [number, number],
    rangeY: [number, number],
    theme: CanvasTheme
  ): void;
  drawGhostStone(
    x: number,
    y: number,
    ghostStone: GhostStone,
    sign: Sign,
    vertexSize: number,
    rangeX: [number, number],
    rangeY: [number, number],
    theme: CanvasTheme
  ): void;
  drawPaint(
    x: number,
    y: number,
    paint: 1 | -1,
    neighbors: NeighborInfo,
    vertexSize: number,
    rangeX: [number, number],
    rangeY: [number, number],
    theme: CanvasTheme
  ): void;
  drawSelection(
    x: number,
    y: number,
    neighbors: NeighborInfo,
    vertexSize: number,
    rangeX: [number, number],
    rangeY: [number, number],
    theme: CanvasTheme
  ): void;
  drawHeat(
    x: number,
    y: number,
    heat: HeatVertex,
    vertexSize: number,
    rangeX: [number, number],
    rangeY: [number, number],
    theme: CanvasTheme
  ): void;
  flush(): void;
  getCanvas(): HTMLCanvasElement;
  dispose(): void;
}
