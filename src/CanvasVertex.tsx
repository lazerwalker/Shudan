import Vertex, { VertexProps } from "./Vertex.js";

interface CanvasVertexProps extends VertexProps {
  xi: number;
  yi: number;
  vertexSize: number;
}

export function CanvasVertex(props: CanvasVertexProps) {
  const { xi, yi, vertexSize, sign, shifting, placed, dimmed } = props;

  // Stone is rendered on canvas unless it needs DOM for animation/dimming
  const stoneRenderedExternally = sign !== 0 && !placed && !shifting && !dimmed;

  return (
    <div
      style={{
        position: "absolute",
        left: xi * vertexSize,
        top: yi * vertexSize,
        width: vertexSize,
        height: vertexSize,
        display: "grid",
      }}
    >
      <Vertex {...props} stoneRenderedExternally={stoneRenderedExternally} />
    </div>
  );
}
