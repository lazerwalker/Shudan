import type { Vertex } from "./types";

export function getVertexFromPoint(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  vertexSize: number,
  rangeX: [number, number],
  rangeY: [number, number],
  offsetX?: number,
  offsetY?: number
): Vertex | null;

export function getVertexCenter(
  vertex: Vertex,
  vertexSize: number,
  rangeX: [number, number],
  rangeY: [number, number]
): { x: number; y: number };

export function isPointNearVertex(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  vertex: Vertex,
  vertexSize: number,
  rangeX: [number, number],
  rangeY: [number, number],
  threshold?: number
): boolean;

export function getVerticesInRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  vertexSize: number,
  rangeX: [number, number],
  rangeY: [number, number]
): Vertex[];
