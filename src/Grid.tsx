import { createElement as h, Component } from "react";
import { type Vertex } from "./helper.js";

// Relevent for Tenuki. Would want to find a better abstraction.
const MagicNumberVertexScaleFactor = 40;

export interface GridProps {
  vertexSize: number;
  width: number;
  height: number;
  xs: number[];
  ys: number[];
  hoshis: Vertex[];
}

export default class Grid extends Component<GridProps> {
  shouldComponentUpdate(nextProps: GridProps) {
    return (
      nextProps.vertexSize !== this.props.vertexSize ||
      nextProps.width !== this.props.width ||
      nextProps.height !== this.props.height ||
      nextProps.xs.length !== this.props.xs.length ||
      nextProps.ys.length !== this.props.ys.length ||
      nextProps.xs[0] !== this.props.xs[0] ||
      nextProps.ys[0] !== this.props.ys[0]
    );
  }

  render() {
    let { vertexSize, width, height, xs, ys, hoshis } = this.props;
    let halfVertexSize = vertexSize / 2;
    let gridLineSize = vertexSize / MagicNumberVertexScaleFactor;

    return (
      xs.length > 0 &&
      ys.length > 0 &&
      h(
        "svg",
        {
          className: "shudan-grid",
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          },
        },

        // Draw grid lines

        ys.map((_, i) => {
          let x = xs[0] === 0 ? halfVertexSize : 0;

          return h("rect", {
            key: `h${i}`,

            className: "shudan-gridline shudan-horizontal",
            x: x,
            y: (2 * i + 1) * halfVertexSize,
            width:
              xs[xs.length - 1] === width - 1
                ? (2 * xs.length - 1) * halfVertexSize - x
                : xs.length * vertexSize - x,
            height: gridLineSize,
          });
        }),

        xs.map((_, i) => {
          let y = ys[0] === 0 ? halfVertexSize : 0;

          return h("rect", {
            key: `v${i}`,

            className: "shudan-gridline shudan-vertical",
            x: (2 * i + 1) * halfVertexSize,
            y: y,
            width: gridLineSize,
            height:
              ys[ys.length - 1] === height - 1
                ? (2 * ys.length - 1) * halfVertexSize - y
                : ys.length * vertexSize - y,
          });
        }),

        // Draw hoshi points

        hoshis.map(([x, y]) => {
          let i = xs.indexOf(x);
          let j = ys.indexOf(y);
          if (i < 0 || j < 0) return;

          return h("circle", {
            key: [x, y].join("-"),

            className: "shudan-hoshi",
            cx: (2 * i + 1) * halfVertexSize + 0.5,
            cy: (2 * j + 1) * halfVertexSize + 0.5,
            r: ".1em",
          });
        })
      )
    );
  }
}
