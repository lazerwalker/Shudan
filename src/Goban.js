import { createElement as h } from "react";
import DOMGoban from "./DOMGoban.js";
import CanvasGoban from "./CanvasGoban.js";

/**
 * Unified Goban component with selectable renderer.
 *
 * @param {Object} props - All standard Goban props plus:
 * @param {'dom' | 'canvas'} props.renderer - Which renderer to use (default: 'dom')
 */
export default function Goban(props) {
  const { renderer = "dom", ...rest } = props;

  if (renderer === "canvas") {
    return h(CanvasGoban, rest);
  }

  return h(DOMGoban, rest);
}
