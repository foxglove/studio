// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactElement, useCallback, useEffect } from "react";

import { ReglClickInfo } from "@foxglove/regl-worldview";
import { InteractionStateProps } from "@foxglove/studio-base/panels/ThreeDimensionalViz/InteractionState";
import { MouseEventHandlerProps } from "@foxglove/studio-base/panels/ThreeDimensionalViz/types";
import { distanceBetweenPoints, reglClickToPoint } from "@foxglove/studio-base/util/geometry";

type Props = InteractionStateProps & MouseEventHandlerProps;

export function MeasuringTool(props: Props): ReactElement {
  const {
    addMouseEventHandler,
    removeMouseEventHandler,
    interactionState: { measure },
    interactionStateDispatch: dispatch,
  } = props;

  const upHandler = useCallback(
    (_ev: React.MouseEvent, click: ReglClickInfo) => {
      const point = reglClickToPoint(click);
      if (!point) {
        return;
      }

      if (measure) {
        dispatch({ action: "select-tool", tool: "idle" });
      } else {
        dispatch({ action: "measure-start", point });
      }
    },
    [dispatch, measure],
  );

  const moveHandler = useCallback(
    (_ev: React.MouseEvent, click: ReglClickInfo) => {
      if (!measure) {
        return;
      }

      const point = reglClickToPoint(click);
      const start = measure.start;
      if (point) {
        const distance = distanceBetweenPoints(start, point);
        dispatch({ action: "measure-update", distance, point });
      }
    },
    [dispatch, measure],
  );

  useEffect(() => {
    addMouseEventHandler("onMouseUp", upHandler);
    addMouseEventHandler("onMouseMove", moveHandler);

    return () => {
      removeMouseEventHandler("onMouseUp", upHandler);
      removeMouseEventHandler("onMouseMove", moveHandler);
    };
  }, [addMouseEventHandler, moveHandler, removeMouseEventHandler, upHandler]);

  return <div style={{ display: "none" }} />;
}
