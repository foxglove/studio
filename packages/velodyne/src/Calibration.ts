// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { LaserCorrection, Model } from "./VelodyneTypes";
import { deg2rad } from "./angles";
import HDL32E_json from "./data/calibration/32db.json";
import HDL64E_S21_json from "./data/calibration/64e_s2.1-sztaki.json";
import HDL64E_S3_json from "./data/calibration/64e_s3-xiesc.json";
import HDL64E_json from "./data/calibration/64e_utexas.json";
import VLP16HiRes_json from "./data/calibration/VLP16_hires_db.json";
import VLP16_json from "./data/calibration/VLP16db.json";
import VLS128_json from "./data/calibration/VLS128.json";
import VLP32C_json from "./data/calibration/VeloView-VLP-32C.json";

export class Calibration {
  static ROTATION_RESOLUTION = 0.01; // [deg]
  static ROTATION_MAX_UNITS = 36000; // [deg/100]

  static VLP16_FIRINGS_PER_BLOCK = 2;
  static VLP16_SCANS_PER_FIRING = 16;
  static VLP16_BLOCK_TDURATION = 110.592; // [µs]
  static VLP16_DSR_TOFFSET = 2.304; // [µs]
  static VLP16_FIRING_TOFFSET = 55.296; // [µs]

  readonly laserCorrections: LaserCorrection[];
  readonly distanceResolution: number; // [m]
  readonly timingOffsets: number[][];
  readonly sinRotTable: number[];
  readonly cosRotTable: number[];
  readonly vls128LaserAzimuthCache: number[];

  constructor(model: Model) {
    const data = Calibration.Data(model);
    this.laserCorrections = data.lasers.map((v) => {
      return {
        laserId: v.laser_id,
        rotCorrection: v.rot_correction,
        vertCorrection: v.vert_correction,
        distCorrection: v.dist_correction,
        twoPtCorrectionAvailable: v.two_pt_correction_available ?? false,
        distCorrectionX: v.dist_correction_x,
        distCorrectionY: v.dist_correction_y,
        vertOffsetCorrection: v.vert_offset_correction,
        horizOffsetCorrection: v.horiz_offset_correction,
        maxIntensity: v.max_intensity ?? 255,
        minIntensity: v.min_intensity ?? 0,
        focalDistance: v.focal_distance,
        focalSlope: v.focal_slope,
        cosRotCorrection: Math.cos(v.rot_correction),
        sinRotCorrection: Math.sin(v.rot_correction),
        cosVertCorrection: Math.cos(v.vert_correction),
        sinVertCorrection: Math.sin(v.vert_correction),
      };
    });
    this.distanceResolution = data.distance_resolution;
    this.timingOffsets = Calibration.BuildTimingsFor(model);

    // Set up cached values for sin and cos of all the possible headings
    this.cosRotTable = Array(Calibration.ROTATION_MAX_UNITS);
    this.sinRotTable = Array(Calibration.ROTATION_MAX_UNITS);
    for (let i = 0; i < Calibration.ROTATION_MAX_UNITS; i++) {
      const rotation = deg2rad(Calibration.ROTATION_RESOLUTION * i);
      this.cosRotTable[i] = Math.cos(rotation);
      this.sinRotTable[i] = Math.sin(rotation);
    }

    this.vls128LaserAzimuthCache = Array(16).fill(0);
    const VLS128_CHANNEL_TDURATION = 2.665; // [µs] Corresponds to one laser firing
    const VLS128_SEQ_TDURATION = 53.3; // [µs] A set of laser firings including recharging
    for (let i = 0; i < 16; i++) {
      this.vls128LaserAzimuthCache[i] =
        (VLS128_CHANNEL_TDURATION / VLS128_SEQ_TDURATION) * (i + i / 8);
    }
  }

  // Build a timing table with cells for each channel (laser)
  static BuildTimingsFor(model: Model): number[][] {
    const block1 = (x: number, _y: number) => x;
    const block16 = (x: number, y: number) => x * 2 + y / 16;
    const point1 = (_x: number, y: number) => y;
    const point2 = (_x: number, y: number) => y / 2;
    const point16 = (_x: number, y: number) => y % 16;
    switch (model) {
      case Model.VLP16:
      case Model.VLP16HiRes: {
        const full = Calibration.VLP16_FIRING_TOFFSET;
        const single = Calibration.VLP16_DSR_TOFFSET;
        return Calibration.BuildTimings(12, 32, full, single, 0, block16, point16);
      }
      case Model.VLP32C: {
        const full = Calibration.VLP16_FIRING_TOFFSET;
        const single = Calibration.VLP16_DSR_TOFFSET;
        return Calibration.BuildTimings(12, 32, full, single, 0, block1, point2);
      }
      case Model.HDL32E:
        return Calibration.BuildTimings(12, 32, 46.08, 1.152, 0, block1, point2);
      case Model.VLS128:
        return Calibration.BuildTimings(3, 17, 53.3, 2.665, -8.7, block1, point1);
      default:
        return [];
    }
  }

  static BuildTimings(
    rows: number,
    cols: number,
    fullFiringUs: number, // [µs]
    singleFiringUs: number, // [µs]
    offsetUs: number, // [µs]
    block: IndexCalc,
    point: IndexCalc,
  ): number[][] {
    const fullFiring = fullFiringUs * 1e-6;
    const singleFiring = singleFiringUs * 1e-6;
    const offset = offsetUs * 1e-6;
    return Array(rows)
      .fill(0)
      .map((_row, x) =>
        Array(cols)
          .fill(0)
          .map((_col, y) => fullFiring * block(x, y) + singleFiring * point(x, y) + offset),
      );
  }

  static Data(model: Model): CalibrationData {
    switch (model) {
      case Model.VLP16:
        return VLP16_json as CalibrationData;
      case Model.VLP16HiRes:
        return VLP16HiRes_json as CalibrationData;
      case Model.VLP32C:
        return VLP32C_json as CalibrationData;
      case Model.HDL32E:
        return HDL32E_json as CalibrationData;
      case Model.HDL64E:
        return HDL64E_json as CalibrationData;
      case Model.HDL64E_S21:
        return HDL64E_S21_json as CalibrationData;
      case Model.HDL64E_S3:
        return HDL64E_S3_json as CalibrationData;
      case Model.VLS128:
        return VLS128_json as CalibrationData;
    }
  }
}

type IndexCalc = (x: number, y: number) => number;

type LaserEntry = {
  rot_correction: number;
  vert_correction: number;
  dist_correction: number;
  two_pt_correction_available?: boolean;
  dist_correction_x: number;
  dist_correction_y: number;
  vert_offset_correction: number;
  horiz_offset_correction: number;
  max_intensity?: number;
  min_intensity?: number;
  focal_distance: number;
  focal_slope: number;
  laser_id: number;
};

type CalibrationData = {
  lasers: LaserEntry[];
  distance_resolution: number;
};
