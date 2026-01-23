import { createElement as h, useCallback } from "react";
import { alpha } from "./helper.js";

/**
 * Generate a human-readable description of a vertex for screen readers.
 */
function describeVertex(x, y, signMap, markerMap, coordX, coordY) {
  const coord = `${coordX(x)}${coordY(y)}`;
  const sign = signMap[y]?.[x];
  const marker = markerMap?.[y]?.[x];

  let description = coord;

  if (sign === 1) {
    description += ", black stone";
  } else if (sign === -1) {
    description += ", white stone";
  } else {
    description += ", empty";
  }

  if (marker) {
    if (marker.label) {
      description += `, marked ${marker.label}`;
    } else if (marker.type) {
      description += `, ${marker.type} marker`;
    }
  }

  return description;
}

/**
 * Hidden semantic grid for screen reader accessibility.
 */
export default function A11yGrid({
  signMap,
  markerMap,
  xs,
  ys,
  coordX = (x) => alpha[x],
  coordY = (y) => (signMap.length - y).toString(),
  onVertexClick,
  onVertexFocus,
}) {
  const handleKeyDown = useCallback(
    (evt, x, y) => {
      const xIndex = xs.indexOf(x);
      const yIndex = ys.indexOf(y);

      let newX = x;
      let newY = y;

      switch (evt.key) {
        case "ArrowLeft":
          if (xIndex > 0) newX = xs[xIndex - 1];
          break;
        case "ArrowRight":
          if (xIndex < xs.length - 1) newX = xs[xIndex + 1];
          break;
        case "ArrowUp":
          if (yIndex > 0) newY = ys[yIndex - 1];
          break;
        case "ArrowDown":
          if (yIndex < ys.length - 1) newY = ys[yIndex + 1];
          break;
        case "Enter":
        case " ":
          evt.preventDefault();
          onVertexClick?.([x, y]);
          return;
        default:
          return;
      }

      if (newX !== x || newY !== y) {
        evt.preventDefault();
        const newCell = document.querySelector(
          `[data-a11y-x="${newX}"][data-a11y-y="${newY}"]`
        );
        newCell?.focus();
      }
    },
    [xs, ys, onVertexClick]
  );

  const handleFocus = useCallback(
    (x, y) => {
      onVertexFocus?.([x, y]);
    },
    [onVertexFocus]
  );

  const handleClick = useCallback(
    (x, y) => {
      onVertexClick?.([x, y]);
    },
    [onVertexClick]
  );

  return h(
    "div",
    {
      role: "grid",
      "aria-label": `Go board, ${xs.length} by ${ys.length}`,
      className: "shudan-a11y-grid",
      style: {
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      },
    },
    ys.map((y) =>
      h(
        "div",
        {
          key: y,
          role: "row",
        },
        xs.map((x) =>
          h("div", {
            key: x,
            role: "gridcell",
            tabIndex: 0,
            "data-a11y-x": x,
            "data-a11y-y": y,
            "aria-label": describeVertex(
              x,
              y,
              signMap,
              markerMap,
              coordX,
              coordY
            ),
            onKeyDown: (evt) => handleKeyDown(evt, x, y),
            onFocus: () => handleFocus(x, y),
            onClick: () => handleClick(x, y),
          })
        )
      )
    )
  );
}
