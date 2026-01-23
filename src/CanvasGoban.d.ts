import type { FunctionComponent } from "react";
import type { Vertex, Map, Marker, GhostStone, HeatVertex, LineMarker, CanvasTheme } from "./types";

export interface CanvasGobanProps {
  id?: string;
  class?: string;
  className?: string;
  style?: React.CSSProperties;
  innerProps?: React.HTMLAttributes<HTMLDivElement>;

  busy?: boolean;
  vertexSize?: number;
  rangeX?: [start: number, stop: number];
  rangeY?: [start: number, stop: number];

  showCoordinates?: boolean;
  coordinatesOnOutside?: boolean;
  coordX?: (x: number) => string | number;
  coordY?: (y: number) => string | number;

  fuzzyStonePlacement?: boolean;
  animateStonePlacement?: boolean;
  animationDuration?: number;

  signMap?: Map<0 | 1 | -1>;
  markerMap?: Map<Marker | null>;
  paintMap?: Map<0 | 1 | -1>;
  ghostStoneMap?: Map<GhostStone | null>;
  heatMap?: Map<HeatVertex | null>;

  selectedVertices?: Vertex[];
  dimmedVertices?: Vertex[];
  lines?: LineMarker[];

  onVertexClick?: (evt: MouseEvent, vertex: Vertex) => void;
  onVertexMouseUp?: (evt: MouseEvent, vertex: Vertex) => void;
  onVertexMouseDown?: (evt: MouseEvent, vertex: Vertex) => void;
  onVertexMouseMove?: (evt: MouseEvent, vertex: Vertex) => void;
  onVertexMouseEnter?: (evt: MouseEvent, vertex: Vertex) => void;
  onVertexMouseLeave?: (evt: MouseEvent, vertex: Vertex) => void;
  onVertexPointerUp?: (evt: PointerEvent, vertex: Vertex) => void;
  onVertexPointerDown?: (evt: PointerEvent, vertex: Vertex) => void;
  onVertexPointerMove?: (evt: PointerEvent, vertex: Vertex) => void;
  onVertexPointerEnter?: (evt: PointerEvent, vertex: Vertex) => void;
  onVertexPointerLeave?: (evt: PointerEvent, vertex: Vertex) => void;

  // Canvas-specific props
  theme?: CanvasTheme;
  maxStonesToAnimate?: number;
  enableA11y?: boolean;
  onVertexLongPress?: (evt: PointerEvent, vertex: Vertex) => void;
}

declare const CanvasGoban: FunctionComponent<CanvasGobanProps>;

export default CanvasGoban;
