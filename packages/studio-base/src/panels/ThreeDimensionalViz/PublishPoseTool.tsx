// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactElement, useCallback, useEffect, useMemo } from "react";

import { ReglClickInfo } from "@foxglove/regl-worldview";
import { definitions as commonDefs } from "@foxglove/rosmsg-msgs-common";
import { fromDate } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { InteractionStateProps } from "@foxglove/studio-base/panels/ThreeDimensionalViz/InteractionState";
import {
  MouseEventHandlerProps,
  ThreeDimensionalVizConfig,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/types";
import {
  reglClickToPoint,
  Point,
  quaternionFromPoints,
  makeCovarianceArray,
} from "@foxglove/studio-base/util/geometry";

type Props = InteractionStateProps &
  MouseEventHandlerProps & {
    config: ThreeDimensionalVizConfig;
    frameId: string;
  };

function makePointMessage(topic: string, point: Point, frameId: string) {
  const time = fromDate(new Date());
  return {
    topic,
    msg: {
      header: { seq: 0, stamp: time, frame_id: frameId },
      point: { x: point.x, y: point.y, z: 0 },
    },
  };
}

function makeGoalMessage(topic: string, start: Point, end: Point, frameId: string) {
  const time = fromDate(new Date());
  return {
    topic,
    msg: {
      header: { seq: 0, stamp: time, frame_id: frameId },
      pose: {
        position: { x: end.x, y: end.y, z: 0 },
        orientation: quaternionFromPoints(start, end),
      },
    },
  };
}

function makePoseMessage(
  topic: string,
  start: Point,
  end: Point,
  frameId: string,
  x: number,
  y: number,
  theta: number,
) {
  const time = fromDate(new Date());
  return {
    topic,
    msg: {
      header: { seq: 0, stamp: time, frame_id: frameId },
      pose: {
        covariance: makeCovarianceArray(x, y, theta),
        pose: {
          position: { x: end.x, y: end.y, z: 0 },
          orientation: quaternionFromPoints(start, end),
        },
      },
    },
  };
}

const MessageTypes: Array<keyof typeof commonDefs> = [
  "geometry_msgs/Point",
  "geometry_msgs/PointStamped",
  "geometry_msgs/Pose",
  "geometry_msgs/PoseStamped",
  "geometry_msgs/PoseWithCovariance",
  "geometry_msgs/PoseWithCovarianceStamped",
  "geometry_msgs/Quaternion",
  "std_msgs/Header",
];

const DefaultTopics = {
  goal: "/move_base_simple/goal",
  point: "/clicked_point",
  pose: "/initialpose",
};

const publishSelector = (ctx: MessagePipelineContext) => ctx.publish;
const setPublishersSelector = (ctx: MessagePipelineContext) => ctx.setPublishers;

export function PublishPoseTool(props: Props): ReactElement {
  const {
    addMouseEventHandler,
    config,
    frameId,
    interactionState: { publish },
    interactionStateDispatch: dispatch,
    removeMouseEventHandler,
  } = props;

  const publishMessage = useMessagePipeline(publishSelector);
  const setPublishers = useMessagePipeline(setPublishersSelector);

  const topics = useMemo(() => {
    return {
      goal: config.clickToPublishGoalTopic ?? DefaultTopics.goal,
      point: config.clickToPublishPointTopic ?? DefaultTopics.point,
      pose: config.clickToPublishPoseTopic ?? DefaultTopics.pose,
    };
  }, [
    config.clickToPublishGoalTopic,
    config.clickToPublishPointTopic,
    config.clickToPublishPoseTopic,
  ]);

  useEffect(() => {
    const datatypes = new Map(MessageTypes.map((type) => [type, commonDefs[type]]));

    setPublishers("panel-click", [
      {
        topic: topics.goal,
        datatype: "geometry_msgs/PoseStamped",
        options: { datatypes },
      },
      {
        topic: topics.point,
        datatype: "geometry_msgs/PointStamped",
        options: { datatypes },
      },
      {
        topic: topics.pose,
        datatype: "geometry_msgs/PoseWithCovarianceStamped",
        options: { datatypes },
      },
    ]);
  }, [setPublishers, topics]);

  const upHandler = useCallback(
    (_ev: React.MouseEvent, click: ReglClickInfo) => {
      const point = reglClickToPoint(click);
      if (!point) {
        return;
      }

      if (publish?.type === "point") {
        const message = makePointMessage(topics.point, point, frameId);
        publishMessage(message);

        dispatch({ action: "select-tool", tool: "idle" });
      } else if (publish?.type === "goal" && publish?.start && publish?.end) {
        const message = makeGoalMessage(topics.goal, publish.start, publish.end, frameId);
        publishMessage(message);

        dispatch({ action: "select-tool", tool: "idle" });
      } else if (publish?.type === "pose" && publish?.start && publish?.end) {
        const message = makePoseMessage(
          topics.pose,
          publish.start,
          publish.end,
          frameId,
          config.clickToPublishPoseXDeviation,
          config.clickToPublishPoseYDeviation,
          config.clickToPublishPoseThetaDeviation,
        );
        publishMessage(message);

        dispatch({ action: "select-tool", tool: "idle" });
      } else {
        dispatch({ action: "publish-click-start", point });
      }
    },
    [
      config.clickToPublishPoseThetaDeviation,
      config.clickToPublishPoseXDeviation,
      config.clickToPublishPoseYDeviation,
      dispatch,
      frameId,
      publish,
      publishMessage,
      topics.goal,
      topics.point,
      topics.pose,
    ],
  );

  const moveHandler = useCallback(
    (_ev: React.MouseEvent, click: ReglClickInfo) => {
      if (!publish?.start) {
        return;
      }

      const point = reglClickToPoint(click);
      if (point) {
        dispatch({ action: "publish-click-update", point });
      }
    },
    [dispatch, publish],
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
