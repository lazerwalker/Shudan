import { createElement as h, Component } from "react";
import { alpha } from "./helper.js";
import classnames from "classnames";

// TODO: Can probably make this a single coordprops, with ns and coord

interface CoordXProps {
  style?: React.CSSProperties;
  xs: number[];
  coordX?: (i: number) => string | number;
  outside?: boolean;
}

interface CoordYProps {
  style?: React.CSSProperties;
  height: number;
  ys: number[];
  coordY?: (i: number) => string | number;
  outside?: boolean;
}

export class CoordX extends Component<CoordXProps> {
  render() {
    let {
      style,
      xs,
      coordX = (i) => alpha[i] || alpha[alpha.length - 1],
      outside,
    } = this.props;

    return h(
      "div",
      {
        className: classnames("shudan-coordx", outside && "outside"),
        style: {
          display: "flex",
          textAlign: "center",
          ...style,
        },
      },

      xs.map((i) =>
        h(
          "div",
          { key: i, style: { width: "1em" } },
          h("span", { style: { display: "block" } }, coordX(i))
        )
      )
    );
  }
}

export class CoordY extends Component<CoordYProps> {
  render() {
    let { style, height, ys, outside, coordY = (i) => height - i } = this.props;

    return h(
      "div",
      {
        className: classnames("shudan-coordy", outside && "outside"),
        style: {
          textAlign: "center",
          width: "100%",
          ...style,
        },
      },

      ys.map((i) => {
        const text = coordY(i);
        const isMultiChar = typeof text === "string" && text.length > 1;

        return h(
          "div",
          {
            key: i,
            style: {
              height: "1em",
              textAlign: "center"
            },
          },
          h(
            "span",
            {
              style: {
                display: "block",
                ...(isMultiChar
                  ? { fontSize: "0.45em", lineHeight: "1em", }
                  : {}),
              },
            },
            (isMultiChar ? text.split("").map((char, index) => h("div", { key: index, style: { height: "1em" } }, char)) : text)
          )
        );
      })
    );
  }
}
