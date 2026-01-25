import { createElement as h, Component } from "react";
import Goban, { GobanProps } from "./Goban.js";

export interface BoundedGobanProps extends GobanProps {
  maxWidth: number;
  maxHeight: number;
  maxVertexSize?: number;
  onResized?: () => void;
}

interface BoundedGobanState {
  vertexSize: number;
  visibility: "hidden" | "visible";
}

export default class BoundedGoban extends Component<
  BoundedGobanProps,
  BoundedGobanState
> {
  element: HTMLDivElement | null = null;

  constructor(props: BoundedGobanProps) {
    super(props);

    this.state = {
      vertexSize: 1,
      visibility: "hidden",
    };
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate(prevProps?: BoundedGobanProps) {
    let {
      showCoordinates,
      maxWidth,
      maxHeight,
      maxVertexSize,
      rangeX,
      rangeY,
      signMap,
      onResized = () => {},
    } = this.props;

    if (
      this.state.visibility !== "visible" ||
      showCoordinates !== prevProps?.showCoordinates ||
      maxWidth !== prevProps?.maxWidth ||
      maxHeight !== prevProps?.maxHeight ||
      maxVertexSize !== prevProps?.maxVertexSize ||
      JSON.stringify(rangeX) !== JSON.stringify(prevProps?.rangeX) ||
      JSON.stringify(rangeY) !== JSON.stringify(prevProps?.rangeY) ||
      signMap?.length !== prevProps?.signMap?.length ||
      (signMap?.[0] || []).length !== (prevProps?.signMap?.[0] || []).length
    ) {
      let { offsetWidth, offsetHeight } = this.element!;
      let scale = Math.min(maxWidth / offsetWidth, maxHeight / offsetHeight);
      let vertexSize = Math.max(Math.floor(this.state.vertexSize * scale), 1);

      if (this.state.vertexSize !== vertexSize) {
        this.setState({ vertexSize }, onResized);
      }

      if (this.state.visibility !== "visible") {
        this.setState({ visibility: "visible" });
      }
    }
  }

  render() {
    let { innerProps = {}, style = {}, maxVertexSize = Infinity } = this.props;
    let { ref: innerRef } = innerProps as { ref?: React.Ref<HTMLDivElement> };

    return h(Goban, {
      ...this.props,

      innerProps: {
        ...innerProps,
        ref: (el) => {
          if (typeof innerRef === "function") innerRef(el);
          this.element = el;
        },
      },

      style: {
        visibility: this.state.visibility,
        ...style,
      },

      vertexSize: Math.min(this.state.vertexSize, maxVertexSize),
    });
  }
}
