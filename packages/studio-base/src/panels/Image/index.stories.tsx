// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StoryObj } from "@storybook/react";
import { useRef, useEffect } from "react";
import TestUtils from "react-dom/test-utils";

import {
  CameraCalibration,
  ImageAnnotations,
  PointsAnnotationType,
  RawImage,
  TextAnnotation,
} from "@foxglove/schemas";
import { MessageEvent } from "@foxglove/studio";
import { makeImageAndCalibration } from "@foxglove/studio-base/panels/ThreeDeeRender/stories/ImageMode/imageCommon";
import PanelSetup, { Fixture } from "@foxglove/studio-base/stories/PanelSetup";

import ImageView from "./index";

export default {
  title: "panels/ImageView",
  component: ImageView,
};

function useHoverOnPanel(andThen?: () => void) {
  const timeOutID = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    return () => {
      if (timeOutID.current != undefined) {
        clearTimeout(timeOutID.current);
      }
    };
  }, []);

  const callback = useRef(andThen); // should not change
  return () => {
    const container = document.querySelector("[data-testid~='panel-mouseenter-container']");
    if (!container) {
      throw new Error("missing mouseenter container");
    }
    TestUtils.Simulate.mouseEnter(container);

    // wait for hover to complete
    timeOutID.current = setTimeout(() => callback.current?.(), 10);
  };
}

export const NoTopic: StoryObj = {
  render: (): React.ReactElement => {
    return (
      <PanelSetup>
        <ImageView />
      </PanelSetup>
    );
  },
};

export const WithSettings: StoryObj = {
  render: function Story() {
    return (
      <PanelSetup includeSettings>
        <ImageView />
      </PanelSetup>
    );
  },

  parameters: {
    colorScheme: "light",
  },
};

// TODO: REMOVE BEFORE LANDING
export const WithSettingsAndData: StoryObj = {
  render: function Story() {
    const width = 60;
    const height = 45;

    const { calibrationMessage, cameraMessage } = makeImageAndCalibration({
      width,
      height,
      frameId: "camera",
      imageTopic: "camera",
      calibrationTopic: "calibration",
    });

    const annotationsMessage: MessageEvent<Partial<ImageAnnotations>> = {
      topic: "annotations",
      receiveTime: { sec: 10, nsec: 0 },
      message: {
        circles: [
          {
            timestamp: { sec: 0, nsec: 0 },
            position: { x: 20, y: 5 },
            diameter: 4,
            thickness: 1,
            fill_color: { r: 1, g: 0, b: 1, a: 1 },
            outline_color: { r: 1, g: 1, b: 0, a: 1 },
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            position: { x: 25, y: 5 },
            diameter: 4,
            thickness: 1,
            fill_color: { r: 1, g: 0, b: 1, a: 0.5 },
            outline_color: { r: 0, g: 0, b: 0, a: 0 },
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            position: { x: 30, y: 5 },
            diameter: 4,
            thickness: 0.5,
            fill_color: { r: 1, g: 1, b: 0, a: 0 },
            outline_color: { r: 0, g: 1, b: 1, a: 0.5 },
          },
        ],
        points: [
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.POINTS,
            points: [
              { x: 0, y: 0 },
              { x: 0, y: 8 },
              { x: 2, y: 6 },
              { x: 5, y: 2 },
            ],
            outline_color: { r: 1, g: 0, b: 0, a: 1 },
            outline_colors: [],
            fill_color: { r: 0, g: 0, b: 0, a: 0 },
            thickness: 1,
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.POINTS,
            points: [
              { x: 10 + 0, y: 0 },
              { x: 10 + 0, y: 8 },
              { x: 10 + 2, y: 6 },
              { x: 10 + 5, y: 2 },
            ],
            outline_color: { r: 0, g: 0, b: 0, a: 1 },
            outline_colors: [
              { r: 1, g: 0, b: 0, a: 1 },
              { r: 0, g: 1, b: 0, a: 1 },
              { r: 0, g: 0, b: 1, a: 1 },
              { r: 0, g: 1, b: 1, a: 1 },
            ],
            fill_color: { r: 0, g: 0, b: 0, a: 0 },
            thickness: 2,
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.LINE_LIST,
            points: [
              { x: 0, y: 10 + 0 },
              { x: 0, y: 10 + 8 },
              { x: 2, y: 10 + 6 },
              { x: 5, y: 10 + 2 },
            ],
            outline_color: { r: 1, g: 0, b: 0, a: 1 },
            outline_colors: [],
            fill_color: { r: 0, g: 0, b: 0, a: 0 },
            thickness: 1,
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.LINE_LIST,
            points: [
              { x: 10 + 0, y: 10 + 0 },
              { x: 10 + 0, y: 10 + 8 },
              { x: 10 + 2, y: 10 + 6 },
              { x: 10 + 5, y: 10 + 2 },
            ],
            outline_color: { r: 0, g: 0, b: 0, a: 1 },
            outline_colors: [
              // 1 color per point
              { r: 1, g: 0, b: 0, a: 1 },
              { r: 0, g: 1, b: 0, a: 1 },
              { r: 0, g: 0, b: 1, a: 1 },
              { r: 0, g: 1, b: 1, a: 1 },
            ],
            fill_color: { r: 0, g: 0, b: 0, a: 0 },
            thickness: 2,
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.LINE_LIST,
            points: [
              { x: 20 + 0, y: 10 + 0 },
              { x: 20 + 0, y: 10 + 8 },
              { x: 20 + 2, y: 10 + 6 },
              { x: 20 + 5, y: 10 + 2 },
            ],
            outline_color: { r: 0, g: 0, b: 0, a: 1 },
            outline_colors: [
              // 1 color per line
              { r: 1, g: 0, b: 0, a: 1 },
              { r: 0, g: 1, b: 0, a: 1 },
            ],
            fill_color: { r: 0, g: 0, b: 0, a: 0 },
            thickness: 2,
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.LINE_STRIP,
            points: [
              { x: 0, y: 20 + 0 },
              { x: 0, y: 20 + 8 },
              { x: 2, y: 20 + 6 },
              { x: 5, y: 20 + 2 },
            ],
            outline_color: { r: 1, g: 0, b: 0, a: 1 },
            outline_colors: [],
            fill_color: { r: 0, g: 0, b: 0, a: 0 },
            thickness: 1,
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.LINE_STRIP,
            points: [
              { x: 10 + 0, y: 20 + 0 },
              { x: 10 + 0, y: 20 + 8 },
              { x: 10 + 2, y: 20 + 6 },
              { x: 10 + 5, y: 20 + 2 },
            ],
            outline_color: { r: 1, g: 1, b: 0, a: 1 },
            outline_colors: [],
            fill_color: { r: 1, g: 0, b: 1, a: 1 },
            thickness: 0.5,
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.LINE_LOOP,
            points: [
              { x: 0, y: 30 + 0 },
              { x: 0, y: 30 + 8 },
              { x: 2, y: 30 + 6 },
              { x: 5, y: 30 + 2 },
            ],
            outline_color: { r: 1, g: 0, b: 0, a: 1 },
            outline_colors: [],
            fill_color: { r: 0, g: 0, b: 0, a: 0 },
            thickness: 1,
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            type: PointsAnnotationType.LINE_LOOP,
            points: [
              { x: 10 + 0, y: 30 + 0 },
              { x: 10 + 0, y: 30 + 8 },
              { x: 10 + 2, y: 30 + 6 },
              { x: 10 + 5, y: 30 + 2 },
            ],
            outline_color: { r: 1, g: 1, b: 0, a: 1 },
            outline_colors: [],
            fill_color: { r: 1, g: 0, b: 1, a: 1 },
            thickness: 0.5,
          },
        ],
        texts: [
          {
            timestamp: { sec: 0, nsec: 0 },
            position: { x: 20, y: 30 },
            text: "Hi",
            font_size: 5,
            text_color: { r: 1, g: 0, b: 0, a: 1 },
            background_color: { r: 1, g: 1, b: 0, a: 1 },
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            position: { x: 20, y: 32 },
            text: "hello",
            font_size: 3,
            text_color: { r: 0.3, g: 0.5, b: 0.5, a: 0.8 },
            background_color: { r: 1, g: 1, b: 1, a: 0.2 },
          },
          {
            timestamp: { sec: 0, nsec: 0 },
            position: { x: 40, y: 10 },
            text: "I'm but a measly single a pixel tall!",
            font_size: 1,
            text_color: { r: 1, g: 0.5, b: 0.5, a: 0.8 },
            background_color: { r: 1, g: 1, b: 1, a: 0.8 },
          },
        ],
      },

      schemaName: "foxglove.ImageAnnotations",
      sizeInBytes: 0,
    };

    const numRandomTextAnnotations = 10;
    for (let i = 0; i < numRandomTextAnnotations; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 5;
      const randomTextAnnotation: TextAnnotation = {
        timestamp: { sec: 0, nsec: 0 },
        position: { x, y },
        text: `size: ${size.toFixed(2)} @ ${x.toFixed(2)}, ${y.toFixed(2)}`,
        font_size: 1,
        text_color: { r: 1, g: 0, b: size / 5, a: 0.8 },
        background_color: { r: Math.random(), g: 1, b: 0, a: 0.8 },
      };
      annotationsMessage.message.texts!.push(randomTextAnnotation);
    }
    const fixture: Fixture = {
      topics: [
        { name: "calibration", schemaName: "foxglove.CameraCalibration" },
        { name: "camera", schemaName: "foxglove.RawImage" },
        { name: "annotations", schemaName: "foxglove.ImageAnnotations" },
      ],
      frame: {
        calibration: [calibrationMessage],
        camera: [cameraMessage],
        annotations: [annotationsMessage],
      },
      capabilities: [],
      activeData: {
        currentTime: { sec: 0, nsec: 0 },
      },
    };
    return (
      <PanelSetup includeSettings fixture={fixture}>
        <ImageView
          overrideConfig={{
            enabledMarkerTopics: ["annotations"],
            showTextAnchorPoints: true,
          }}
        />
      </PanelSetup>
    );
  },

  parameters: {
    colorScheme: "light",
  },
};

export const TopicButNoDataSource: StoryObj = {
  render: (): React.ReactElement => {
    return (
      <PanelSetup>
        <ImageView overrideConfig={{ ...ImageView.defaultConfig, cameraTopic: "a_topic" }} />
      </PanelSetup>
    );
  },
};

export const TopicButNoDataSourceHovered: StoryObj = {
  render: function Story() {
    const onMount = useHoverOnPanel();
    return (
      <PanelSetup onMount={onMount}>
        <ImageView overrideConfig={{ ...ImageView.defaultConfig, cameraTopic: "a_topic" }} />
      </PanelSetup>
    );
  },

  parameters: { colorScheme: "dark" },
};

export const TopicButNoDataSourceHoveredLight: StoryObj = {
  ...TopicButNoDataSourceHovered,
  parameters: { colorScheme: "light" },
};
