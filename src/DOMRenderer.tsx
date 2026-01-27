import { vertexEquals, type Vertex as VertexData, type Map } from "./helper.js";
import Grid from "./Grid.js";
import Vertex, { GhostStone, HeatVertex } from "./Vertex.js";
import Line, { LineMarker } from "./Line.js";
import { Marker } from "./main.js";

type DOMRendererProps = {
  vertexSize: number;
  width: number;
  height: number;
  xs: number[];
  ys: number[];
  hoshis: VertexData[];

  signMap: Map<0 | 1 | -1>;

  markerMap?: Map<Marker | null>;
  paintMap?: Map<0 | 1 | -1>;
  ghostStoneMap?: Map<GhostStone | null>;
  heatMap?: Map<HeatVertex | null>;

  fuzzyStonePlacement: boolean;
  shiftMap: number[][];
  randomMap: number[][];

  selectedVertices: VertexData[];
  dimmedVertices: VertexData[];
  shiftingStones: VertexData[];
  placedStones: VertexData[];
  lines: LineMarker[];

  rangeX: [number, number];
  rangeY: [number, number];
};

export default function DOMRenderer(props: DOMRendererProps) {
  const {
    vertexSize,
    width,
    height,
    xs,
    ys,
    hoshis,
    signMap,
    heatMap,
    markerMap,
    ghostStoneMap,
    paintMap,
    fuzzyStonePlacement,
    shiftMap,
    randomMap,
    selectedVertices,
    dimmedVertices,
    shiftingStones,
    placedStones,
    lines,
    rangeX,
    rangeY,
  } = props;

  return (
    <>
      <Grid
        vertexSize={vertexSize}
        width={width}
        height={height}
        xs={xs}
        ys={ys}
        hoshis={hoshis}
      />

      <div
        className="shudan-vertices"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${xs.length}, 1em)`,
          gridTemplateRows: `repeat(${ys.length}, 1em)`,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      >
        {ys.map((y) => {
          return xs.map((x) => {
            let equalsVertex = (v: VertexData) => vertexEquals(v, [x, y]);
            let selected = selectedVertices.some(equalsVertex);

            return (
              <Vertex
                key={[x, y].join("-")}
                position={[x, y]}
                shift={fuzzyStonePlacement ? shiftMap?.[y]?.[x] : 0}
                random={randomMap?.[y]?.[x]}
                sign={signMap?.[y]?.[x]}
                heat={heatMap?.[y]?.[x]}
                marker={markerMap?.[y]?.[x]}
                ghostStone={ghostStoneMap?.[y]?.[x]}
                dimmed={dimmedVertices.some(equalsVertex)}
                // TODO: Rename both of these to be clearer about the distinction
                animate={shiftingStones.some(equalsVertex)}
                changed={placedStones.some(equalsVertex)}
                paint={paintMap?.[y]?.[x]}
                paintLeft={paintMap?.[y]?.[x - 1]}
                paintRight={paintMap?.[y]?.[x + 1]}
                paintTop={paintMap?.[y - 1]?.[x]}
                paintBottom={paintMap?.[y + 1]?.[x]}
                paintTopLeft={paintMap?.[y - 1]?.[x - 1]}
                paintTopRight={paintMap?.[y - 1]?.[x + 1]}
                paintBottomLeft={paintMap?.[y + 1]?.[x - 1]}
                paintBottomRight={paintMap?.[y + 1]?.[x + 1]}
                selected={selected}
                selectedLeft={
                  selected &&
                  selectedVertices.some((v) => vertexEquals(v, [x - 1, y]))
                }
                selectedRight={
                  selected &&
                  selectedVertices.some((v) => vertexEquals(v, [x + 1, y]))
                }
                selectedTop={
                  selected &&
                  selectedVertices.some((v) => vertexEquals(v, [x, y - 1]))
                }
                selectedBottom={
                  selected &&
                  selectedVertices.some((v) => vertexEquals(v, [x, y + 1]))
                }
              />
            );
          });
        })}
      </div>
      <svg
        className="shudan-lines"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <g
          transform={`translate(-${rangeX[0] * vertexSize} -${
            rangeY[0] * vertexSize
          })`}
        >
          {lines.map(({ v1, v2, type }, i) => (
            <Line key={i} v1={v1} v2={v2} type={type} vertexSize={vertexSize} />
          ))}
        </g>
      </svg>
    </>
  );
}
