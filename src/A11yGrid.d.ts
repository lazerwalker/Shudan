import type { FunctionComponent } from "react";
import type { Vertex, SignMap, Marker } from "./types";

export interface A11yGridProps {
  signMap: SignMap;
  markerMap?: (Marker | null)[][];
  xs: number[];
  ys: number[];
  coordX?: (x: number) => string | number;
  coordY?: (y: number) => string | number;
  onVertexClick?: (vertex: Vertex) => void;
  onVertexFocus?: (vertex: Vertex) => void;
}

declare const A11yGrid: FunctionComponent<A11yGridProps>;

export default A11yGrid;
