import classnames from "classnames";
import { CoordX, CoordY } from "./Coord.js";

type GobanShellProps = {
  vertexSize: number | string;
  xs: number[];
  ys: number[];
  height: number; // TODO: Refactor this away

  showCoordinates: boolean;
  coordinatesOnOutside: boolean;
  coordX?: (i: number) => string | number;
  coordY?: (i: number) => string | number;

  busy?: boolean;

  id?: string;
  className?: string;
  style?: React.CSSProperties;
  innerProps?: React.HTMLAttributes<HTMLDivElement>;

  contentRef?: React.Ref<HTMLDivElement>;
  contentProps?: React.HTMLAttributes<HTMLDivElement>;

  children?: React.ReactNode;
};

export default function GobanShell(props: GobanShellProps) {
  const {
    showCoordinates,
    coordinatesOnOutside,
    vertexSize,
    xs,
    ys,
    coordX,
    coordY,
    height,
    innerProps,
    busy,
    contentRef,
    contentProps,
  } = props;

  const showCoordinatesInside = showCoordinates && !coordinatesOnOutside;
  const showCoordinatesOutside = showCoordinates && coordinatesOnOutside;

  const mainContentGrid = showCoordinatesInside
    ? "1 / 1 / 4 / 4"
    : showCoordinatesOutside
    ? "2 / 2"
    : "1 / 1";

  return (
    <div
      className="shudan"
      style={{
        display: "inline-grid",
        gridTemplateRows: showCoordinates ? "1em auto 1em" : "auto",
        gridTemplateColumns: showCoordinates ? "1em auto 1em" : "auto",
        fontSize: vertexSize,
        lineHeight: "1em",
      }}
    >
      {showCoordinatesOutside && (
        <CoordX
          xs={xs}
          style={{ gridRow: "1", gridColumn: "2" }}
          coordX={coordX}
          outside={true}
        />
      )}

      {showCoordinatesOutside && (
        <CoordY
          height={height}
          ys={ys}
          style={{ gridRow: "2", gridColumn: "1" }}
          coordY={coordY}
          outside={true}
        />
      )}

      <div
        {...innerProps}
        id={props.id}
        className={classnames(
          "shudan-goban",
          "shudan-goban-image",
          {
            "shudan-busy": busy,
            "shudan-coordinates": showCoordinatesInside,
          },
          props.className
        )}
        style={{
          ...(props.style ?? {}),
          display: "inline-grid",
          gridArea: mainContentGrid,
          ...(showCoordinatesInside && {
            gridTemplateRows: "1em auto 1em",
            gridTemplateColumns: "1em auto 1em",
          }),
        }}
      >
        {showCoordinatesInside && (
          <CoordX
            xs={xs}
            style={{ gridRow: "1", gridColumn: "2" }}
            coordX={coordX}
          />
        )}

        {showCoordinatesInside && (
          <CoordY
            height={height}
            ys={ys}
            style={{ gridRow: "2", gridColumn: "1" }}
            coordY={coordY}
          />
        )}
        <div
          ref={contentRef}
          className="shudan-content"
          style={{
            position: "relative",
            width: `${xs.length}em`,
            height: `${ys.length}em`,
            gridRow: showCoordinates ? "2" : "1",
            gridColumn: showCoordinates ? "2" : "1",
          }}
          {...contentProps}
        >
          {props.children}
        </div>
        {showCoordinatesInside && (
          <CoordY
            height={height}
            ys={ys}
            style={{
              gridRow: "2",
              gridColumn: "3",
            }}
            coordY={coordY}
          />
        )}
        {showCoordinatesInside && (
          <CoordX
            xs={xs}
            style={{ gridRow: "3", gridColumn: "2" }}
            coordX={coordX}
          />
        )}
      </div>
      {showCoordinatesOutside && (
        <CoordY
          height={height}
          ys={ys}
          style={{ gridRow: "2", gridColumn: "3" }}
          coordY={coordY}
          outside={true}
        />
      )}
      {showCoordinatesOutside && (
        <CoordX
          xs={xs}
          style={{ gridRow: "3", gridColumn: "2" }}
          coordX={coordX}
          outside={true}
        />
      )}
    </div>
  );
}
