// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { CameraInfo, Color, ImageMarker, Point2D } from "@foxglove/studio-base/types/Messages";

import type PinholeCameraModel from "./PinholeCameraModel";
import type { NormalizedImageMessage } from "./normalizeMessage";

export type PanZoom = { x: number; y: number; scale: number };

export type ZoomMode = "fit" | "fill" | "other";

export type Dimensions = { width: number; height: number };

export type RawMarkerData = {
  markers: Annotation[];
  transformMarkers: boolean;
  cameraInfo?: CameraInfo;
};

export type RenderOptions = {
  imageSmoothing?: boolean;
  minValue?: number;
  maxValue?: number;

  // resize the canvas element to fit the bitmap
  // default is false
  resizeCanvas?: boolean;
};

export type RenderGeometry = {
  flipVertical: boolean;
  flipHorizontal: boolean;
  panZoom: PanZoom;
  rotation: number;
  viewport: Dimensions;
  zoomMode: ZoomMode;
};

export type RenderArgs = {
  // an undefined imageMessage clears the canvas
  imageMessage?: NormalizedImageMessage;
  geometry: RenderGeometry;
  options?: RenderOptions;
  rawMarkerData: RawMarkerData;
};

export type PixelData = {
  color: { r: number; g: number; b: number; a: number };
  position: { x: number; y: number };
  markerIndex?: number;
  marker?: ImageMarker;
};

export type RenderableCanvas = HTMLCanvasElement | OffscreenCanvas;

export type RenderDimensions = Dimensions & { transform: DOMMatrix };

export type MarkerData = {
  markers: Annotation[];
  originalWidth?: number; // undefined means no scaling is needed (use the image's size)
  originalHeight?: number; // undefined means no scaling is needed (use the image's size)
  cameraModel?: PinholeCameraModel; // undefined means no transformation is needed
};

type FoxgloveImageAnnotationCircleAnnotation = {
  timestamp: bigint;
  id: string;
  action: number;
  position: Point2D;
  diameter: number;
  filled: boolean;
  fill_color: Color;
  lifetime: bigint;
};

type FoxgloveImageAnnotationPointsAnnotation = {
  timestamp: bigint;
  id: string;
  action: number;
  type: number;
  points: Point2D[];
  outline_colors: Color[];
  filled: boolean;
  fill_color: Color;
  lifetime: bigint;
};

export type FoxgloveImageAnnotationsMessage = {
  circles?: FoxgloveImageAnnotationCircleAnnotation[];
  points?: FoxgloveImageAnnotationPointsAnnotation[];
};

export type CircleAnnotation = {
  type: "circle";
  fillColor?: Color;
  outlineColor?: Color;
  radius: number;
  thickness: number;
  position: Point2D;
};

export type PointsAnnotation = {
  type: "points";
  style: "points" | "polygon" | "line_strip" | "line_list";
  points: Point2D[];
  outlineColors: Color[];
  outlineColor?: Color;
  thickness?: number;
  fillColor?: Color;
};

export type TextAnnotation = {
  type: "text";
  position: Point2D;
  text: string;
  textColor: Color;
  backgroundColor?: Color;
  fontSize: number;
  padding: number;
};

export type Annotation = CircleAnnotation | PointsAnnotation | TextAnnotation;
