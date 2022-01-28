// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactElement, useCallback, useEffect, useMemo } from "react";

import Logger from "@foxglove/log";
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
import { PublishPayload } from "@foxglove/studio-base/players/types";
import {
  reglClickToPoint,
  Point,
  quaternionFromPoints,
  makeCovarianceArray,
} from "@foxglove/studio-base/util/geometry";

const log = Logger.getLogger(__filename);

export type PublishClickType = "pose" | "goal" | "point";

export type PublishClickState =
  | { state: "start"; start?: Point; end?: Point; type: PublishClickType }
  | { state: "finish"; start: Point; end: Point; type: PublishClickType };

type Props = InteractionStateProps<"publish"> &
  MouseEventHandlerProps & {
    config: Partial<ThreeDimensionalVizConfig>;
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

function makePoseMessage(topic: string, start: Point, end: Point, frameId: string) {
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

function makePoseEstimateMessage(
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

function normalizeEndpoint(a: Point, b: Point): Point {
  const indicatorLength = 2;
  const delta = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const deltaLength = Math.hypot(delta.x, delta.y, delta.z);
  const factor = indicatorLength / deltaLength;
  return {
    x: a.x + delta.x * factor,
    y: a.y + delta.y * factor,
    z: a.z + delta.z * factor,
  };
}

export function PublishClickTool(props: Props): ReactElement {
  const {
    addMouseEventHandler,
    config,
    frameId,
    interactionStateDispatch: dispatch,
    publish,
    removeMouseEventHandler,
  } = props;

  const publishMessage = useMessagePipeline(publishSelector);
  const setPublishers = useMessagePipeline(setPublishersSelector);

  const safePublishMessage = useCallback(
    (message: PublishPayload) => {
      try {
        publishMessage(message);
      } catch (error) {
        log.info(error);
      }
    },
    [publishMessage],
  );

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
      if (!point || !publish) {
        return;
      }

      if (publish.type === "point") {
        const message = makePointMessage(topics.point, point, frameId);
        safePublishMessage(message);

        dispatch({ action: "select-tool", tool: "idle" });
        return;
      }

      if (publish.state === "start") {
        dispatch({
          action: "publish-click-update",
          state: { ...publish, state: "finish", start: point, end: point },
        });
        return;
      }

      if (publish.type === "goal") {
        const normalEnd = normalizeEndpoint(publish.start, publish.end);
        const message = makePoseMessage(topics.goal, publish.start, normalEnd, frameId);
        safePublishMessage(message);

        dispatch({ action: "select-tool", tool: "idle" });
      } else {
        const normalEnd = normalizeEndpoint(publish.start, publish.end);
        const message = makePoseEstimateMessage(
          topics.pose,
          publish.start,
          normalEnd,
          frameId,
          config.clickToPublishPoseXDeviation ?? 0,
          config.clickToPublishPoseYDeviation ?? 0,
          config.clickToPublishPoseThetaDeviation ?? 0,
        );
        safePublishMessage(message);

        dispatch({ action: "select-tool", tool: "idle" });
      }
    },
    [
      config.clickToPublishPoseThetaDeviation,
      config.clickToPublishPoseXDeviation,
      config.clickToPublishPoseYDeviation,
      dispatch,
      frameId,
      publish,
      safePublishMessage,
      topics.goal,
      topics.point,
      topics.pose,
    ],
  );

  const moveHandler = useCallback(
    (_ev: React.MouseEvent, click: ReglClickInfo) => {
      const point = reglClickToPoint(click);
      if (!point || !publish) {
        return;
      }

      if (publish.state === "start") {
        dispatch({ action: "publish-click-update", state: { ...publish, start: point } });
      } else {
        const normalPoint = normalizeEndpoint(publish.start, point);
        dispatch({ action: "publish-click-update", state: { ...publish, end: normalPoint } });
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
