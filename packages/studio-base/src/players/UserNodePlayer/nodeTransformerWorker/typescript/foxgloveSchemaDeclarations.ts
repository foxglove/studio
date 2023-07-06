// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ArrowPrimitive from "@foxglove/schemas/schemas/typescript/ArrowPrimitive.d.ts?raw";
import CameraCalibration from "@foxglove/schemas/schemas/typescript/CameraCalibration.d.ts?raw";
import CircleAnnotation from "@foxglove/schemas/schemas/typescript/CircleAnnotation.d.ts?raw";
import Color from "@foxglove/schemas/schemas/typescript/Color.d.ts?raw";
import CompressedImage from "@foxglove/schemas/schemas/typescript/CompressedImage.d.ts?raw";
import CubePrimitive from "@foxglove/schemas/schemas/typescript/CubePrimitive.d.ts?raw";
import CylinderPrimitive from "@foxglove/schemas/schemas/typescript/CylinderPrimitive.d.ts?raw";
import Duration from "@foxglove/schemas/schemas/typescript/Duration.d.ts?raw";
import FrameTransform from "@foxglove/schemas/schemas/typescript/FrameTransform.d.ts?raw";
import FrameTransforms from "@foxglove/schemas/schemas/typescript/FrameTransforms.d.ts?raw";
import GeoJSON from "@foxglove/schemas/schemas/typescript/GeoJSON.d.ts?raw";
import Grid from "@foxglove/schemas/schemas/typescript/Grid.d.ts?raw";
import ImageAnnotations from "@foxglove/schemas/schemas/typescript/ImageAnnotations.d.ts?raw";
import KeyValuePair from "@foxglove/schemas/schemas/typescript/KeyValuePair.d.ts?raw";
import LaserScan from "@foxglove/schemas/schemas/typescript/LaserScan.d.ts?raw";
import LinePrimitive from "@foxglove/schemas/schemas/typescript/LinePrimitive.d.ts?raw";
import LineType from "@foxglove/schemas/schemas/typescript/LineType.d.ts?raw";
import LocationFix from "@foxglove/schemas/schemas/typescript/LocationFix.d.ts?raw";
import Log from "@foxglove/schemas/schemas/typescript/Log.d.ts?raw";
import LogLevel from "@foxglove/schemas/schemas/typescript/LogLevel.d.ts?raw";
import ModelPrimitive from "@foxglove/schemas/schemas/typescript/ModelPrimitive.d.ts?raw";
import NumericType from "@foxglove/schemas/schemas/typescript/NumericType.d.ts?raw";
import PackedElementField from "@foxglove/schemas/schemas/typescript/PackedElementField.d.ts?raw";
import Point2 from "@foxglove/schemas/schemas/typescript/Point2.d.ts?raw";
import Point3 from "@foxglove/schemas/schemas/typescript/Point3.d.ts?raw";
import PointCloud from "@foxglove/schemas/schemas/typescript/PointCloud.d.ts?raw";
import PointsAnnotation from "@foxglove/schemas/schemas/typescript/PointsAnnotation.d.ts?raw";
import PointsAnnotationType from "@foxglove/schemas/schemas/typescript/PointsAnnotationType.d.ts?raw";
import Pose from "@foxglove/schemas/schemas/typescript/Pose.d.ts?raw";
import PoseInFrame from "@foxglove/schemas/schemas/typescript/PoseInFrame.d.ts?raw";
import PosesInFrame from "@foxglove/schemas/schemas/typescript/PosesInFrame.d.ts?raw";
import PositionCovarianceType from "@foxglove/schemas/schemas/typescript/PositionCovarianceType.d.ts?raw";
import Quaternion from "@foxglove/schemas/schemas/typescript/Quaternion.d.ts?raw";
import RawImage from "@foxglove/schemas/schemas/typescript/RawImage.d.ts?raw";
import SceneEntity from "@foxglove/schemas/schemas/typescript/SceneEntity.d.ts?raw";
import SceneEntityDeletion from "@foxglove/schemas/schemas/typescript/SceneEntityDeletion.d.ts?raw";
import SceneEntityDeletionType from "@foxglove/schemas/schemas/typescript/SceneEntityDeletionType.d.ts?raw";
import SceneUpdate from "@foxglove/schemas/schemas/typescript/SceneUpdate.d.ts?raw";
import SpherePrimitive from "@foxglove/schemas/schemas/typescript/SpherePrimitive.d.ts?raw";
import TextAnnotation from "@foxglove/schemas/schemas/typescript/TextAnnotation.d.ts?raw";
import TextPrimitive from "@foxglove/schemas/schemas/typescript/TextPrimitive.d.ts?raw";
import Time from "@foxglove/schemas/schemas/typescript/Time.d.ts?raw";
import TriangleListPrimitive from "@foxglove/schemas/schemas/typescript/TriangleListPrimitive.d.ts?raw";
import Vector2 from "@foxglove/schemas/schemas/typescript/Vector2.d.ts?raw";
import Vector3 from "@foxglove/schemas/schemas/typescript/Vector3.d.ts?raw";
import Index from "@foxglove/schemas/schemas/typescript/index.d.ts?raw";
import { NodeProjectConfig } from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/types";

function declaration(sourceCode: string, name: string) {
  return {
    fileName: `FoxgloveSchemas/${name}.d.ts`,
    filePath: `FoxgloveSchemas/${name}.d.ts`,
    sourceCode,
  };
}

export const FoxgloveSchemaDeclarations: NodeProjectConfig["declarations"] = [
  declaration(ArrowPrimitive, "ArrowPrimitive"),
  declaration(CameraCalibration, "CameraCalibration"),
  declaration(CircleAnnotation, "CircleAnnotation"),
  declaration(Color, "Color"),
  declaration(CompressedImage, "CompressedImage"),
  declaration(CubePrimitive, "CubePrimitive"),
  declaration(CylinderPrimitive, "CylinderPrimitive"),
  declaration(Duration, "Duration"),
  declaration(FrameTransform, "FrameTransform"),
  declaration(FrameTransforms, "FrameTransforms"),
  declaration(GeoJSON, "GeoJSON"),
  declaration(Grid, "Grid"),
  declaration(ImageAnnotations, "ImageAnnotations"),
  declaration(Index, "index"),
  declaration(KeyValuePair, "KeyValuePair"),
  declaration(LaserScan, "LaserScan"),
  declaration(LinePrimitive, "LinePrimitive"),
  declaration(LineType, "LineType"),
  declaration(LocationFix, "LocationFix"),
  declaration(Log, "Log"),
  declaration(LogLevel, "LogLevel"),
  declaration(ModelPrimitive, "ModelPrimitive"),
  declaration(NumericType, "NumericType"),
  declaration(PackedElementField, "PackedElementField"),
  declaration(Point2, "Point2"),
  declaration(Point3, "Point3"),
  declaration(PointCloud, "PointCloud"),
  declaration(PointsAnnotation, "PointsAnnotation"),
  declaration(PointsAnnotationType, "PointsAnnotationType"),
  declaration(Pose, "Pose"),
  declaration(PoseInFrame, "PoseInFrame"),
  declaration(PosesInFrame, "PosesInFrame"),
  declaration(PositionCovarianceType, "PositionCovarianceType"),
  declaration(Quaternion, "Quaternion"),
  declaration(RawImage, "RawImage"),
  declaration(SceneEntity, "SceneEntity"),
  declaration(SceneEntityDeletion, "SceneEntityDeletion"),
  declaration(SceneEntityDeletionType, "SceneEntityDeletionType"),
  declaration(SceneUpdate, "SceneUpdate"),
  declaration(SpherePrimitive, "SpherePrimitive"),
  declaration(TextAnnotation, "TextAnnotation"),
  declaration(TextPrimitive, "TextPrimitive"),
  declaration(Time, "Time"),
  declaration(TriangleListPrimitive, "TriangleListPrimitive"),
  declaration(Vector2, "Vector2"),
  declaration(Vector3, "Vector3"),
];
