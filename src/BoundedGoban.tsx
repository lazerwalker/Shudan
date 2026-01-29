import { useMemo } from "react";
import Goban, { type GobanProps } from "./Goban.js";
import { calculateBoundedSize, type BoardConfig } from "./sizeCalculator.js";
import { range } from "./helper.js";

export interface BoundedGobanProps
  extends Omit<GobanProps, "vertexSize" | "padding"> {
  /** Target width in pixels. At least one of width or height must be provided. */
  width?: number;

  /** Target height in pixels. At least one of width or height must be provided. */
  height?: number;
}

/**
 * A Goban component that fits within specified width/height bounds.
 * Calculates the optimal integer vertexSize and padding automatically.
 */
export default function BoundedGoban(props: BoundedGobanProps) {
  const {
    width: targetWidth,
    height: targetHeight,
    signMap = [],
    showCoordinates = false,
    coordinatesOnOutside = false,
    rangeX = [0, Infinity],
    rangeY = [0, Infinity],
    ...gobanProps
  } = props;

  // Extract board dimensions from signMap
  const boardWidth = signMap.length === 0 ? 0 : signMap[0].length;
  const boardHeight = signMap.length;

  // Calculate xs and ys (same logic as Goban)
  const xs = useMemo(() => {
    return range(boardWidth).slice(rangeX[0], rangeX[1] + 1);
  }, [boardWidth, rangeX]);

  const ys = useMemo(() => {
    return range(boardHeight).slice(rangeY[0], rangeY[1] + 1);
  }, [boardHeight, rangeY]);

  // Calculate optimal vertexSize and padding
  const { vertexSize, padding } = useMemo(() => {
    if (targetWidth === undefined && targetHeight === undefined) {
      // No bounds specified, use default
      return { vertexSize: 24, padding: { x: 0, y: 0 } };
    }

    if (xs.length === 0 || ys.length === 0) {
      // Empty board
      return { vertexSize: 24, padding: { x: 0, y: 0 } };
    }

    const config: BoardConfig = {
      cols: xs.length,
      rows: ys.length,
      showCoordinates,
      coordinatesOnOutside,
    };

    return calculateBoundedSize(targetWidth, targetHeight, config);
  }, [
    targetWidth,
    targetHeight,
    xs.length,
    ys.length,
    showCoordinates,
    coordinatesOnOutside,
  ]);

  return (
    <Goban
      {...gobanProps}
      signMap={signMap}
      showCoordinates={showCoordinates}
      coordinatesOnOutside={coordinatesOnOutside}
      rangeX={rangeX}
      rangeY={rangeY}
      vertexSize={vertexSize}
      padding={padding}
    />
  );
}
