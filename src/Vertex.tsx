import { createElement as h, memo, CSSProperties } from "react";
import classnames from "classnames";

import { avg, signEquals, Sign } from "./helper.js";
import Marker, { type Marker as MarkerData } from "./Marker.js";

export interface GhostStone {
  sign: 0 | -1 | 1;
  type?: "good" | "interesting" | "doubtful" | "bad" | null;
  faint?: boolean | null;
}

export interface HeatVertex {
  strength: number;
  text?: string | null;
}

export type VertexProps = {
  position: [number, number];
  shift?: number;
  random?: number;
  sign: Sign;
  heat?: HeatVertex | null;

  paint?: number;
  paintLeft?: number;
  paintRight?: number;
  paintTop?: number;
  paintBottom?: number;
  paintTopLeft?: number;
  paintTopRight?: number;
  paintBottomLeft?: number;
  paintBottomRight?: number;

  dimmed?: boolean;
  marker?: MarkerData | null;
  ghostStone?: GhostStone | null;

  animate?: boolean;
  changed?: boolean;
  selected?: boolean;

  selectedLeft?: boolean;
  selectedRight?: boolean;
  selectedTop?: boolean;
  selectedBottom?: boolean;
};

const absoluteStyle = (zIndex?: number): CSSProperties => ({
  position: "absolute",
  zIndex,
});

function Vertex(props: VertexProps) {
  let {
    position,
    shift,
    random,
    sign,
    heat,
    paint,
    paintLeft,
    paintRight,
    paintTop,
    paintBottom,
    paintTopLeft,
    paintTopRight,
    paintBottomLeft,
    paintBottomRight,
    dimmed,
    marker,
    ghostStone,
    animate,
    changed,
    selected,
    selectedLeft,
    selectedRight,
    selectedTop,
    selectedBottom,
  } = props;

  let markerMarkup = (zIndex?: number) =>
    !!marker &&
    h(Marker, {
      key: "marker",
      sign,
      type: marker.type,
      label: marker.label,
      zIndex,
    });

  return h(
    "div",
    {
      "data-x": position[0],
      "data-y": position[1],

      title: marker?.label,
      style: {
        position: "relative",
      },
      className: classnames(
        "shudan-vertex",
        `shudan-random_${random}`,
        `shudan-sign_${sign}`,
        {
          [`shudan-shift_${shift}`]: !!shift,
          [`shudan-heat_${!!heat && heat.strength}`]: !!heat,
          "shudan-dimmed": dimmed,
          "shudan-animate": animate,
          "shudan-changed": changed,

          [`shudan-paint_${paint! > 0 ? 1 : -1}`]: !!paint,
          "shudan-paintedleft": !!paint && signEquals(paintLeft, paint),
          "shudan-paintedright": !!paint && signEquals(paintRight, paint),
          "shudan-paintedtop": !!paint && signEquals(paintTop, paint),
          "shudan-paintedbottom": !!paint && signEquals(paintBottom, paint),

          "shudan-selected": selected,
          "shudan-selectedleft": selectedLeft,
          "shudan-selectedright": selectedRight,
          "shudan-selectedtop": selectedTop,
          "shudan-selectedbottom": selectedBottom,

          [`shudan-marker_${marker?.type}`]: !!marker?.type,
          "shudan-smalllabel":
            marker?.type === "label" &&
            (marker.label?.includes("\n") || (marker.label?.length || 0) >= 3),

          [`shudan-ghost_${ghostStone?.sign}`]: !!ghostStone,
          [`shudan-ghost_${ghostStone?.type}`]: !!ghostStone?.type,
          "shudan-ghost_faint": !!ghostStone?.faint,
        }
      ),
    },

    !sign && markerMarkup(0),
    !sign &&
      !!ghostStone &&
      h("div", {
        key: "ghost",
        className: "shudan-ghost",
        style: absoluteStyle(1),
      }),

    h(
      "div",
      { key: "stone", className: "shudan-stone", style: absoluteStyle(2) },

      !!sign &&
        h(
          "div",
          {
            key: "inner",
            className: classnames(
              "shudan-inner",
              "shudan-stone-image",
              `shudan-random_${random}`,
              `shudan-sign_${sign}`
            ),
            style: absoluteStyle(),
          },
          sign
        ),

      !!sign && markerMarkup()
    ),

    (!!paint || !!paintLeft || !!paintRight || !!paintTop || !!paintBottom) &&
      h("div", {
        key: "paint",
        className: "shudan-paint",
        style: {
          ...absoluteStyle(3),
          "--shudan-paint-opacity": avg(
            (!!paint
              ? [paint]
              : [paintLeft, paintRight, paintTop, paintBottom].map(
                  (x) => x !== 0 && !isNaN(x!)
                )
            ).map((x) => Math.abs((x ?? 0) as number) * 0.5)
          ),
          "--shudan-paint-box-shadow": [
            signEquals(paintLeft, paintTop, paintTopLeft)
              ? [Math.sign(paintTop!), "-.5em -.5em"]
              : null,
            signEquals(paintRight, paintTop, paintTopRight)
              ? [Math.sign(paintTop!), ".5em -.5em"]
              : null,
            signEquals(paintLeft, paintBottom, paintBottomLeft)
              ? [Math.sign(paintBottom!), "-.5em .5em"]
              : null,
            signEquals(paintRight, paintBottom, paintBottomRight)
              ? [Math.sign(paintBottom!), ".5em .5em"]
              : null,
          ]
            .filter((x): x is [number, string] => !!x && x[0] !== 0)
            .map(
              ([sign, translation]) =>
                `${translation} 0 0 var(${
                  sign > 0
                    ? "--shudan-black-background-color"
                    : "--shudan-white-background-color"
                })`
            )
            .join(","),
        },
      }),

    !!selected &&
      h("div", {
        key: "selection",
        className: "shudan-selection",
        style: absoluteStyle(4),
      }),

    h("div", {
      key: "heat",
      className: "shudan-heat",
      style: absoluteStyle(5),
    }),
    heat?.text != null &&
      h(
        "div",
        {
          key: "heatlabel",
          className: "shudan-heatlabel",
          style: absoluteStyle(6),
        },
        heat.text && heat.text.toString()
      )
  );
}

export default memo(Vertex, (prevProps, nextProps) => {
  // Deep compare position array
  if (
    prevProps.position[0] !== nextProps.position[0] ||
    prevProps.position[1] !== nextProps.position[1]
  ) {
    return false; // position changed, re-render
  }

  // Shallow compare all other props
  for (let key in nextProps) {
    const k = key as keyof VertexProps;
    if (k === "position") continue;
    if (prevProps[k] !== nextProps[k]) {
      return false; // prop changed, re-render
    }
  }

  return true; // props equal, skip render
});
