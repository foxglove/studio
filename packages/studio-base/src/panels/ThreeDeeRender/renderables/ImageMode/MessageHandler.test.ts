// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DeepPartial } from "ts-essentials";

import { fromNanoSec } from "@foxglove/rostime";
import {
  CameraCalibration,
  CircleAnnotation,
  ImageAnnotations,
  PointsAnnotation,
  RawImage,
  TextAnnotation,
} from "@foxglove/schemas";
import { MessageEvent } from "@foxglove/studio";
import { namespaceTopic } from "@foxglove/studio-base/panels/ThreeDeeRender/namespaceTopic";

import { MessageHandler, MessageHandlerConfig } from "./MessageHandler";
import { PartialMessageEvent } from "../../SceneExtension";

function wrapInMessageEvent<T>(
  topic: string,
  schema: string,
  time: bigint,
  message?: T | Partial<T>,
): PartialMessageEvent<T> {
  return {
    message: (message ?? {}) as DeepPartial<T>,
    topic,
    schemaName: schema,
    receiveTime: fromNanoSec(time),
    sizeInBytes: 0,
  };
}

function fixtures(messageHandlerConfig?: Partial<MessageHandlerConfig>) {
  const topic = namespaceTopic("annotations", "foxglove.ImageAnnotations");
  const messageHandler = new MessageHandler({
    synchronize: true,
    annotations: { [topic]: { visible: true } },
    ...messageHandlerConfig,
  });
  return { topic, messageHandler };
}

describe("MessageHandler: synchronized = false", () => {
  it("should return an empty state if no messages are handled", () => {
    const messageHandler = new MessageHandler({ synchronize: false });

    const state = messageHandler.getRenderState();

    expect(state).toEqual({
      annotationsByNamespacedTopic: new Map(),
    });
  });
  it("should have camera info if handled camera info", () => {
    const messageHandler = new MessageHandler({ synchronize: false });

    const cameraInfo = wrapInMessageEvent<CameraCalibration>(
      "calibration",
      "foxglove.CameraCalibration",
      0n,
    );
    messageHandler.handleCameraInfo(cameraInfo);
    const state = messageHandler.getRenderState();

    expect(state.cameraInfo).not.toBeUndefined();
  });
  it("should have image if handled image", () => {
    const messageHandler = new MessageHandler({ synchronize: false });

    const image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n);
    messageHandler.handleRawImage(image);
    const state = messageHandler.getRenderState();

    expect(state.image).not.toBeUndefined();
  });
  it("should have annotations if handled annotations", () => {
    const { topic, messageHandler } = fixtures({
      synchronize: false,
    });

    const annotation = createCircleAnnotations([0n]);
    const annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);
    const state = messageHandler.getRenderState();

    expect(state.annotationsByNamespacedTopic?.get(topic)).not.toBeUndefined();
  });
  it("clears image if image topic changed", () => {
    const messageHandler = new MessageHandler({ synchronize: false, imageTopic: "image1" });

    const image = wrapInMessageEvent<RawImage>("image1", "foxglove.RawImage", 0n);
    messageHandler.handleRawImage(image);

    messageHandler.setConfig({ imageTopic: "image2" });
    const state = messageHandler.getRenderState();

    expect(state.image).toBeUndefined();
  });
  it("clears cameraInfo if calibration topic changed", () => {
    const messageHandler = new MessageHandler({
      synchronize: false,
      calibrationTopic: "calibration1",
    });

    const cameraInfo = wrapInMessageEvent<CameraCalibration>(
      "calibration1",
      "foxglove.CameraCalibration",
      0n,
    );
    messageHandler.handleCameraInfo(cameraInfo);
    messageHandler.setConfig({ calibrationTopic: "calibration2" });
    const state = messageHandler.getRenderState();

    expect(state.cameraInfo).toBeUndefined();
  });
  it("clears specific annotations if annotations subscriptions change", () => {
    const topic1 = namespaceTopic("annotations1", "foxglove.ImageAnnotations");
    const topic2 = namespaceTopic("annotations2", "foxglove.ImageAnnotations");
    const messageHandler = new MessageHandler({
      synchronize: false,
      annotations: {
        [topic1]: { visible: true },
        [topic2]: { visible: true },
      },
    });

    const annotation = createCircleAnnotations([0n]);
    const annotation1Message = wrapInMessageEvent(
      "annotations1",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );
    const annotation2Message = wrapInMessageEvent(
      "annotations2",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );
    messageHandler.handleAnnotations(annotation1Message as MessageEvent<ImageAnnotations>);
    messageHandler.handleAnnotations(annotation2Message as MessageEvent<ImageAnnotations>);

    // annotations2 removed
    messageHandler.setConfig({
      annotations: {
        [topic1]: { visible: true },
        [topic2]: { visible: false },
      },
    });
    const state = messageHandler.getRenderState();

    expect(state.annotationsByNamespacedTopic?.get(topic1)).not.toBeUndefined();
    expect(state.annotationsByNamespacedTopic?.get(topic2)).toBeUndefined();
  });
  it("listener function called whenever a message is handled or when config changes", () => {
    const { topic, messageHandler } = fixtures();
    const listener = jest.fn();

    messageHandler.addListener(listener);

    const image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n);
    messageHandler.handleRawImage(image);

    const cameraInfo = wrapInMessageEvent<CameraCalibration>(
      "calibration",
      "foxglove.CameraCalibration",
      0n,
    );
    messageHandler.handleCameraInfo(cameraInfo);

    const annotation = createCircleAnnotations([0n]);
    const annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);

    // annotations2 removed
    messageHandler.setConfig({
      annotations: {
        [topic]: { visible: false },
      },
    });
    expect(listener).toHaveBeenCalledTimes(4);
  });
});

describe("MessageHandler: synchronized = true", () => {
  it("handles and shows camera info in state", () => {
    const messageHandler = new MessageHandler({ synchronize: true });

    const cameraInfo = wrapInMessageEvent<CameraCalibration>(
      "calibration",
      "foxglove.CameraCalibration",
      0n,
    );
    messageHandler.handleCameraInfo(cameraInfo);
    const state = messageHandler.getRenderState();

    expect(state.cameraInfo).not.toBeUndefined();
  });

  it("handles and shows image in state with no active annotations", () => {
    const messageHandler = new MessageHandler({ synchronize: true });

    const image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n);
    messageHandler.handleRawImage(image);
    const state = messageHandler.getRenderState();

    expect(state.image).not.toBeUndefined();
  });

  it("does not show state with annotations if only handled annotations", () => {
    const { messageHandler } = fixtures();

    const annotation = createCircleAnnotations([0n]);
    const annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );
    const namespacedTopic = namespaceTopic(annotationMessage.topic, annotationMessage.schemaName);

    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);
    const state = messageHandler.getRenderState();

    expect(state.annotationsByNamespacedTopic?.get(namespacedTopic)).toBeUndefined();
    expect(state.presentAnnotationTopics).toBeUndefined();
    expect(state.missingAnnotationTopics).toBeUndefined();
  });

  it("shows state with image and annotations if they have the same timestamp", () => {
    const { messageHandler } = fixtures();
    const time = 2n;

    const image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n, {
      timestamp: fromNanoSec(time),
    });

    const annotation = createCircleAnnotations([time]);
    const annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );

    const namespacedTopic = namespaceTopic(annotationMessage.topic, annotationMessage.schemaName);

    messageHandler.handleRawImage(image);
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);
    const state = messageHandler.getRenderState();

    expect(state.image).not.toBeUndefined();
    expect(state.annotationsByNamespacedTopic?.get(namespacedTopic)).not.toBeUndefined();
    expect(state.presentAnnotationTopics).toBeUndefined();
    expect(state.missingAnnotationTopics).toBeUndefined();
  });

  it("shows state without image and annotations if they have different header timestamps", () => {
    const messageHandler = new MessageHandler({
      synchronize: true,
      annotations: {
        [namespaceTopic("annotations1", "foxglove.ImageAnnotations")]: { visible: true },
        [namespaceTopic("annotations2", "foxglove.ImageAnnotations")]: { visible: true },
      },
    });
    const time = 2n;

    const image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n, {
      timestamp: fromNanoSec(time),
    });

    const annotation1 = createCircleAnnotations([time]);
    const annotationMessage1 = wrapInMessageEvent(
      "annotations1",
      "foxglove.ImageAnnotations",
      0n,
      annotation1,
    );
    const annotation2 = createCircleAnnotations([time + 1n]);
    const annotationMessage2 = wrapInMessageEvent(
      "annotations2",
      "foxglove.ImageAnnotations",
      0n,
      annotation2,
    );
    const namespacedTopic2 = namespaceTopic(
      annotationMessage2.topic,
      annotationMessage2.schemaName,
    );

    messageHandler.handleRawImage(image);
    messageHandler.handleAnnotations(annotationMessage1 as MessageEvent<ImageAnnotations>);
    messageHandler.handleAnnotations(annotationMessage2 as MessageEvent<ImageAnnotations>);
    const state = messageHandler.getRenderState();

    expect(state.image).toBeUndefined();
    expect(state.annotationsByNamespacedTopic?.get(namespacedTopic2)).toBeUndefined();
    expect(state.presentAnnotationTopics).toEqual([
      namespaceTopic("annotations1", "foxglove.ImageAnnotations"),
    ]);
    expect(state.missingAnnotationTopics).toEqual([
      namespaceTopic("annotations2", "foxglove.ImageAnnotations"),
    ]);
  });

  it("shows most recent image and annotations with same timestamps", () => {
    const { topic, messageHandler } = fixtures();
    let time = 2n;

    let image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n, {
      timestamp: fromNanoSec(time),
    });

    let annotation = createCircleAnnotations([time]);
    let annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );

    messageHandler.handleRawImage(image);
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);

    time = 4n;

    image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 1n, {
      timestamp: fromNanoSec(time),
    });

    annotation = createCircleAnnotations([time]);
    annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      1n,
      annotation,
    );

    messageHandler.handleRawImage(image);
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);
    const state = messageHandler.getRenderState();

    expect((state.image?.message as RawImage).timestamp).toEqual(fromNanoSec(time));
    expect(state.annotationsByNamespacedTopic?.get(topic)?.annotations[0]?.stamp).toEqual(
      fromNanoSec(time),
    );
  });

  it("shows most older image and annotations with same timestamps if newer messages have different timestamps", () => {
    const { topic, messageHandler } = fixtures();
    const time = 2n;

    let image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n, {
      timestamp: fromNanoSec(time),
    });

    let annotation = createCircleAnnotations([time]);
    let annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );

    messageHandler.handleRawImage(image);
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);

    // different timestamp messages
    image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 1n, {
      timestamp: fromNanoSec(3n),
    });

    annotation = createCircleAnnotations([4n]);
    annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      1n,
      annotation,
    );

    messageHandler.handleRawImage(image);
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);

    const state = messageHandler.getRenderState();

    expect((state.image?.message as RawImage).timestamp).toEqual(fromNanoSec(time));
    expect(state.annotationsByNamespacedTopic?.get(topic)?.annotations[0]?.stamp).toEqual(
      fromNanoSec(time),
    );
  });

  it("does not show image in state if it hasn't received requisite annotations at same timestamp", () => {
    const topic1 = namespaceTopic("annotations1", "foxglove.ImageAnnotations");
    const topic2 = namespaceTopic("annotations2", "foxglove.ImageAnnotations");

    const messageHandler = new MessageHandler({
      synchronize: true,
      annotations: {
        [topic1]: { visible: true },
        [topic2]: { visible: true },
      },
    });
    const time = 2n;

    const image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n, {
      timestamp: fromNanoSec(time),
    });

    const annotation = createCircleAnnotations([time]);
    const annotationMessage = wrapInMessageEvent(
      "annotations1",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );

    messageHandler.handleRawImage(image);
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);

    const state = messageHandler.getRenderState();

    expect(state.image).toBeUndefined();
    expect(state.annotationsByNamespacedTopic).toBeUndefined();
  });

  it("clears image when image topic changed", () => {
    const { messageHandler } = fixtures({
      imageTopic: "image1",
    });
    const time = 2n;

    const image = wrapInMessageEvent<RawImage>("image1", "foxglove.RawImage", 0n, {
      timestamp: fromNanoSec(time),
    });

    const annotation = createCircleAnnotations([time]);
    const annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );

    messageHandler.handleRawImage(image);
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);
    messageHandler.setConfig({ imageTopic: "image2" });
    const state = messageHandler.getRenderState();
    expect(state.image).toBeUndefined();
  });
  it("clears specific annotations if annotations subscriptions change", () => {
    const topic1 = namespaceTopic("annotations1", "foxglove.ImageAnnotations");
    const topic2 = namespaceTopic("annotations2", "foxglove.ImageAnnotations");

    const messageHandler = new MessageHandler({
      synchronize: true,
      imageTopic: "image",
      calibrationTopic: "calibration",
      annotations: {
        [topic1]: { visible: true },
        [topic2]: { visible: true },
      },
    });
    const time = 2n;

    const image = wrapInMessageEvent<RawImage>("image1", "foxglove.RawImage", 0n, {
      timestamp: fromNanoSec(time),
    });

    messageHandler.handleRawImage(image);

    const annotation = createCircleAnnotations([time]);
    const annotation1Message = wrapInMessageEvent(
      "annotations1",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );
    const annotation2Message = wrapInMessageEvent(
      "annotations2",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );
    messageHandler.handleAnnotations(annotation1Message as MessageEvent<ImageAnnotations>);
    messageHandler.handleAnnotations(annotation2Message as MessageEvent<ImageAnnotations>);

    // annotations2 removed
    messageHandler.setConfig({
      annotations: {
        [topic1]: { visible: true },
        [topic2]: { visible: false },
      },
    });
    const state = messageHandler.getRenderState();

    expect(state.annotationsByNamespacedTopic?.get(topic1)).not.toBeUndefined();
    expect(state.annotationsByNamespacedTopic?.get(topic2)).toBeUndefined();
  });
  it("listener function called whenever a message is handled or when config changes", () => {
    const { topic, messageHandler } = fixtures({
      imageTopic: "image",
      calibrationTopic: "calibration",
    });
    const listener = jest.fn();

    messageHandler.addListener(listener);

    const image = wrapInMessageEvent<RawImage>("image", "foxglove.RawImage", 0n);
    messageHandler.handleRawImage(image);

    const cameraInfo = wrapInMessageEvent<CameraCalibration>(
      "calibration",
      "foxglove.CameraCalibration",
      0n,
    );
    messageHandler.handleCameraInfo(cameraInfo);

    const annotation = createCircleAnnotations([0n]);
    const annotationMessage = wrapInMessageEvent(
      "annotations",
      "foxglove.ImageAnnotations",
      0n,
      annotation,
    );
    messageHandler.handleAnnotations(annotationMessage as MessageEvent<ImageAnnotations>);

    // annotations2 removed
    messageHandler.setConfig({
      annotations: { [topic]: { visible: false } },
    });
    expect(listener).toHaveBeenCalledTimes(4);
  });
});

function createCircleAnnotations(atTimes: bigint[]): ImageAnnotations {
  return {
    circles: atTimes.map((time) => ({
      timestamp: fromNanoSec(time),
      position: { x: 20, y: 5 },
      diameter: 4,
      thickness: 1,
      fill_color: { r: 1, g: 0, b: 1, a: 1 },
      outline_color: { r: 1, g: 1, b: 0, a: 1 },
    })) as CircleAnnotation[],
    points: [] as PointsAnnotation[],
    texts: [] as TextAnnotation[],
  };
}
