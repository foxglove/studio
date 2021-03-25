// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Calibration } from "./Calibration";
import { PointCloud } from "./PointCloud";
import { RawBlock, RawPacket } from "./RawPacket";
import { FactoryId, LaserCorrection, Model } from "./VelodyneTypes";

export type TransformerOptions = {
  minRange?: number;
  maxRange?: number;
  minAngle?: number;
  maxAngle?: number;
};

// Check if a given angle is within [min..max], handling wraparound
function angleInRange(angle: number, min: number, max: number): boolean {
  if (min <= max) {
    return angle >= min && angle <= max;
  } else {
    return angle >= min || angle <= max;
  }
}

// Clamp a value in the range of [min..max]
function clamp(value: number, min: number, max: number): number {
  return value <= min ? min : value >= max ? max : value;
}

// Return the default [min, max] range of valid distances for a given hardware model
function defaultRange(model: Model): [number, number] {
  switch (model) {
    case Model.VLP16:
    case Model.VLP16HiRes:
    case Model.HDL32E:
      return [0.4, 100];
    case Model.HDL64E:
    case Model.HDL64E_S21:
    case Model.HDL64E_S3:
      return [0.4, 120];
    case Model.VLP32C:
      return [0.4, 200];
    case Model.VLS128:
      return [0.4, 300];
  }
}

export class Transformer {
  calibration: Calibration;
  minRange: number; // [m]
  maxRange: number; // [m]
  minAngle: number; // [0-35999], degrees as uint16
  maxAngle: number; // [0-35999], degrees as uint16

  constructor(
    calibration: Calibration,
    { minRange, maxRange, minAngle, maxAngle }: TransformerOptions = {},
  ) {
    const [defMinRange, defMaxRange] = defaultRange(calibration.model);
    this.calibration = calibration;
    this.minRange = minRange ?? defMinRange;
    this.maxRange = maxRange ?? defMaxRange;
    this.minAngle = minAngle ?? 0;
    this.maxAngle = maxAngle ?? 35999;
  }

  // Count the number of valid laser scans (non-zero return and angle is within
  // [minAngle..maxAngle]) in this raw packet
  validPoints(raw: RawPacket): number {
    const minAngle = this.minAngle;
    const maxAngle = this.maxAngle;

    let valid = 0;
    for (const block of raw.blocks) {
      for (let j = 0; j < RawPacket.SCANS_PER_BLOCK; j++) {
        if (block.isValid(j) && angleInRange(block.rotation, minAngle, maxAngle)) {
          valid++;
        }
      }
    }
    return valid;
  }

  unpack(raw: RawPacket, scanStamp: number, packetStamp: number, output: PointCloud): void {
    switch (raw.factoryId) {
      case FactoryId.VLP16:
      case FactoryId.VLP16HiRes:
        return this._unpackVLP16(raw, scanStamp, packetStamp, output);
      case FactoryId.VLS128:
      case FactoryId.VLS128Old:
        return this._unpackVLS128(raw, scanStamp, packetStamp, output);
      default:
        return this._unpackGeneric(raw, scanStamp, packetStamp, output);
    }
  }

  private _unpackGeneric = (
    raw: RawPacket,
    scanStamp: number,
    packetStamp: number,
    output: PointCloud,
  ): void => {
    const timeDiffStartToThisPacket = packetStamp - scanStamp;

    for (let i = 0; i < RawPacket.BLOCKS_PER_PACKET; i++) {
      const block = raw.blocks[i] as RawBlock;
      // upper bank lasers are numbered [0..31], lower bank lasers are [32..63]
      const bankOrigin = block.isUpperBlock() ? 32 : 0;

      for (let j = 0; j < RawPacket.SCANS_PER_BLOCK; j++) {
        // Discard points which are not valid or in the area of interest
        if (!block.isValid(j) || !angleInRange(block.rotation, this.minAngle, this.maxAngle)) {
          continue;
        }

        const laserNumber = j + bankOrigin;
        const corrections = this.calibration.laserCorrections[laserNumber] as LaserCorrection;
        const offsetSec = timeDiffStartToThisPacket + (this.calibration.timingOffsets[i]?.[j] ?? 0);

        const rawDistance = block.distance(j);
        const distance =
          rawDistance * this.calibration.distanceResolution + corrections.distCorrection;

        const cosVertAngle = corrections.cosVertCorrection;
        const sinVertAngle = corrections.sinVertCorrection;
        const cosRotCorrection = corrections.cosRotCorrection;
        const sinRotCorrection = corrections.sinRotCorrection;

        const cosRot = this.calibration.cosRotTable[block.rotation] as number;
        const sinRot = this.calibration.sinRotTable[block.rotation] as number;
        // cos(a-b) = cos(a)*cos(b) + sin(a)*sin(b)
        const cosRotAngle = cosRot * cosRotCorrection + sinRot * sinRotCorrection;
        // sin(a-b) = sin(a)*cos(b) - cos(a)*sin(b)
        const sinRotAngle = sinRot * cosRotCorrection - cosRot * sinRotCorrection;

        const horizOffset = corrections.horizOffsetCorrection;
        const vertOffset = corrections.vertOffsetCorrection;

        // Compute the distance in the xy plane (w/o accounting for rotation)
        let xyDistance = distance * cosVertAngle - vertOffset * sinVertAngle;

        // Calculate temporal X, use absolute value
        let xx = xyDistance * sinRotAngle - horizOffset * cosRotAngle;
        // Calculate temporal Y, use absolute value
        let yy = xyDistance * cosRotAngle + horizOffset * sinRotAngle;
        if (xx < 0) {
          xx = -xx;
        }
        if (yy < 0) {
          yy = -yy;
        }

        // Get 2 point calibration values, linear interpolation to get distance
        // correction for X and Y. This means distance correction uses different
        // values at different distances
        let distanceCorrX = 0;
        let distanceCorrY = 0;
        if (corrections.twoPtCorrectionAvailable) {
          distanceCorrX =
            ((corrections.distCorrection - corrections.distCorrectionX) * (xx - 2.4)) /
              (25.04 - 2.4) +
            corrections.distCorrectionX;
          distanceCorrX -= corrections.distCorrection;
          distanceCorrY =
            ((corrections.distCorrection - corrections.distCorrectionY) * (yy - 1.93)) /
              (25.04 - 1.93) +
            corrections.distCorrectionY;
          distanceCorrY -= corrections.distCorrection;
        }

        const distanceX = distance + distanceCorrX;
        xyDistance = distanceX * cosVertAngle - vertOffset * sinVertAngle;
        const x = xyDistance * sinRotAngle - horizOffset * cosRotAngle;

        const distanceY = distance + distanceCorrY;
        xyDistance = distanceY * cosVertAngle - vertOffset * sinVertAngle;
        const y = xyDistance * cosRotAngle + horizOffset * sinRotAngle;

        const z = distanceY * sinVertAngle + vertOffset * cosVertAngle;

        // Intensity calculation

        const minIntensity = corrections.minIntensity;
        const maxIntensity = corrections.maxIntensity;

        const focalOffset =
          256 * (1 - corrections.focalDistance / 13100) * (1 - corrections.focalDistance / 13100);
        const focalSlope = corrections.focalSlope;
        const rawIntensity = block.intensity(j);
        const intensity = clamp(
          rawIntensity + focalSlope * Math.abs(focalOffset - 256 * sqr(1 - rawDistance / 65535)),
          minIntensity,
          maxIntensity,
        );

        output.addPoint(
          // Use standard ROS coordinate system (right-hand rule)
          y,
          -x,
          z,
          distance,
          intensity,
          corrections.laserId,
          block.rotation,
          offsetSec * 1e9,
        );
      }
    }
  };

  private _unpackVLS128 = (
    _raw: RawPacket,
    _scanStamp: number,
    _packetStamp: number,
    _output: PointCloud,
  ): void => {};

  private _unpackVLP16 = (
    _raw: RawPacket,
    _scanStamp: number,
    _packetStamp: number,
    _output: PointCloud,
  ): void => {};
}

function sqr(x: number): number {
  return x * x;
}
