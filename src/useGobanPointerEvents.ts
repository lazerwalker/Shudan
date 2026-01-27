import { useCallback, useRef, useEffect, RefObject } from "react";
import { vertexFromPoint, vertexEquals, type Vertex } from "./helper.js";

export interface UseGobanPointerEventsOptions {
  onVertexClick?: (vertex: Vertex, evt: React.PointerEvent) => void;
  onVertexRightClick?: (vertex: Vertex, evt: React.MouseEvent) => void;
  onVertexLongPress?: (vertex: Vertex, evt: React.PointerEvent) => void;
  onVertexHover?: (vertex: Vertex | null, evt: React.PointerEvent) => void;
  onVertexDrag?: (vertex: Vertex, evt: React.PointerEvent) => void;

  contentRef: RefObject<HTMLDivElement | null>;
  vertexSize: number;
  xs: number[];
  ys: number[];
  longPressThreshold?: number;
}

export interface GobanPointerEventProps {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function useGobanPointerEvents({
  contentRef,
  vertexSize,
  xs,
  ys,
  onVertexClick,
  onVertexRightClick,
  onVertexLongPress,
  onVertexHover,
  onVertexDrag,
  longPressThreshold = 500,
}: UseGobanPointerEventsOptions): GobanPointerEventProps {
  // Event handling refs
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartVertexRef = useRef<Vertex | null>(null);
  const lastHoveredVertexRef = useRef<Vertex | null>(null);
  const isPointerDownRef = useRef(false);

  // Helper to get vertex from pointer coordinates
  const getVertexFromEvent = useCallback(
    (e: React.PointerEvent | React.MouseEvent): Vertex | null => {
      if (!contentRef.current) return null;
      const rect = contentRef.current.getBoundingClientRect();
      return vertexFromPoint(e.clientX, e.clientY, rect, vertexSize, xs, ys);
    },
    [contentRef, vertexSize, xs, ys]
  );

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      // Only track left-button for click/long-press (right-click handled by contextmenu)
      if (e.button !== 0) return;

      isPointerDownRef.current = true;
      const vertex = getVertexFromEvent(e);
      pointerStartVertexRef.current = vertex;
      longPressTriggeredRef.current = false;

      // Clear any existing timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Start long press timer for touch/pen only (mouse has right-click)
      if (vertex && onVertexLongPress && e.pointerType !== "mouse") {
        longPressTimerRef.current = setTimeout(() => {
          longPressTriggeredRef.current = true;
          onVertexLongPress(vertex, e);
        }, longPressThreshold);
      }
    },
    [getVertexFromEvent, onVertexLongPress, longPressThreshold]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      const vertex = getVertexFromEvent(e);

      if (isPointerDownRef.current) {
        // Dragging - check if moved to a different vertex than start
        const startVertex = pointerStartVertexRef.current;
        if (
          onVertexDrag &&
          vertex &&
          startVertex &&
          !vertexEquals(vertex, startVertex)
        ) {
          // Cancel long press on drag
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          onVertexDrag(vertex, e);
        }
      } else {
        // Hovering - check if vertex changed
        const lastVertex = lastHoveredVertexRef.current;
        const vertexChanged =
          (vertex === null && lastVertex !== null) ||
          (vertex !== null && lastVertex === null) ||
          (vertex !== null &&
            lastVertex !== null &&
            !vertexEquals(vertex, lastVertex));

        if (onVertexHover && vertexChanged) {
          onVertexHover(vertex, e);
        }
        lastHoveredVertexRef.current = vertex;
      }
    },
    [getVertexFromEvent, onVertexDrag, onVertexHover]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Fire click if we tracked a pointerdown and not a long press
      if (isPointerDownRef.current && !longPressTriggeredRef.current) {
        const vertex = getVertexFromEvent(e);
        if (vertex && onVertexClick) {
          onVertexClick(vertex, e);
        }
      }

      // Reset state
      isPointerDownRef.current = false;
      pointerStartVertexRef.current = null;
      longPressTriggeredRef.current = false;
    },
    [getVertexFromEvent, onVertexClick]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      // Apple Pencil can fire pointercancel instead of pointerup
      // Treat as click if we tracked a pointerdown and no long press
      if (
        isPointerDownRef.current &&
        !longPressTriggeredRef.current &&
        onVertexClick
      ) {
        const vertex = getVertexFromEvent(e);
        if (vertex) {
          onVertexClick(vertex, e);
        }
      }

      // Clear timer and reset state
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      isPointerDownRef.current = false;
      pointerStartVertexRef.current = null;
      longPressTriggeredRef.current = false;
    },
    [getVertexFromEvent, onVertexClick]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;

      // Fire hover with null when leaving board
      if (onVertexHover && lastHoveredVertexRef.current !== null) {
        onVertexHover(null, e);
        lastHoveredVertexRef.current = null;
      }
    },
    [onVertexHover]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const vertex = getVertexFromEvent(e as unknown as React.PointerEvent);
      if (vertex && onVertexRightClick) {
        e.preventDefault();
        onVertexRightClick(vertex, e);
      }
    },
    [getVertexFromEvent, onVertexRightClick]
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onPointerLeave: handlePointerLeave,
    onContextMenu: handleContextMenu,
  };
}
