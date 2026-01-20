import { createElement as h, Component } from "react";
import { alpha } from "./helper.js";
import classnames from "classnames";

export class CoordX extends Component {
  render() {
    let {
      style,
      xs,
      coordX = (i) => alpha[i] || alpha[alpha.length - 1],
      outside
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

export class CoordY extends Component {
  render() {
    let { style, height, ys, outside, coordY = (i) => height - i } = this.props;

    return h(
      "div",
      {
        className: classnames("shudan-coordy", outside && "outside"),
        style: {
          textAlign: "center",
          ...style,
        },
      },

      ys.map((i) =>
        h(
          "div",
          { key: i, style: { height: "1em" } },
          h("span", { style: { display: "block" } }, coordY(i))
        )
      )
    );
  }
}
