// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Calibration } from "./Calibration";
import { RawBlock, RawPacket } from "./RawPacket";
import { FactoryId, LaserCorrection } from "./VelodyneTypes";

export class Transformer {
  minRange = 0.9; // [m]
  maxRange = 130; // [m]
  minAngle = -Math.PI; // [rad]
  maxAngle = Math.PI; // [rad]

  constructor(public calibration: Calibration) {}

  unpack(data: Uint8Array, stamp: number): void {
    if (data.length !== 1206) {
      throw new Error(`data has invalid length ${data.length}, expected 1206`);
    }

    const raw = new RawPacket(data);

    switch (raw.factoryId) {
      case FactoryId.VLP16:
      case FactoryId.VLP16HiRes:
        return this.unpackVLP16(raw, stamp);
      case FactoryId.VLS128:
      case FactoryId.VLS128Old:
        return this.unpackVLS128(raw, stamp);
      default:
        return this.unpackGeneric(raw, stamp);
    }
  }

  unpackGeneric(raw: RawPacket, stamp: number): void {
    const scanStartTime = 0; // FIXME
    const timeDiffStartToThisPacket = stamp - scanStartTime;

    for (let i = 0; i < RawPacket.BLOCKS_PER_PACKET; i++) {
      const block = raw.blocks[i] as RawBlock;
      // upper bank lasers are numbered [0..31], lower bank lasers are [32..63]
      const bankOrigin = block.isUpperBlock() ? 32 : 0;

      for (let j = 0, k = 0; j < RawPacket.SCANS_PER_BLOCK; j++, k += RawPacket.RAW_SCAN_SIZE) {
        let x, y, z;
        const laserNumber = j + bankOrigin;
        let time = 0;

        const corrections = this.calibration.laserCorrections[laserNumber] as LaserCorrection;

        // Position calculation
        // union two_bytes tmp;
        // tmp.bytes[0] = block.data[k];
        // tmp.bytes[1] = block.data[k + 1];

        // Avoid calculating points which are not in the area of interest
        // (minAngle < area < maxAngle)
        if (
          (block.rotation >= this.minAngle &&
            block.rotation <= this.maxAngle &&
            this.minAngle < this.maxAngle) ||
          (this.minAngle > this.maxAngle &&
            (block.rotation <= this.maxAngle || block.rotation >= this.minAngle))
        ) {
          if (this.calibration.timingOffsets.length > 0) {
            const offset = this.calibration.timingOffsets[i]?.[j] ?? 0;
            time = offset + timeDiffStartToThisPacket;
          }

          const [rawDistance, rawIntensity] = block.laserReturn(j);

          if (rawDistance === 0) {
            // FIXME
            // call to addPoint is still required since output could be organized
            // data.addPoint(Number.NaN, Number.NaN, Number.NaN, corrections.laserId,
            //               block.rotation, Number.NaN, Number.NaN, time);
            continue;
          }

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
          /**the new term of 'vert_offset * sin_vert_angle'
           * was added to the expression due to the mathemathical
           * model we used.
           */
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

          // Get 2points calibration values,Linear interpolation to get distance
          // correction for X and Y, that means distance correction use
          // different value at different distance
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
          x = xyDistance * sinRotAngle - horizOffset * cosRotAngle;

          const distanceY = distance + distanceCorrY;
          xyDistance = distanceY * cosVertAngle - vertOffset * sinVertAngle;
          y = xyDistance * cosRotAngle + horizOffset * sinRotAngle;

          z = distanceY * sinVertAngle + vertOffset * cosVertAngle;

          // Use standard ROS coordinate system (right-hand rule)
          const xCoord = y;
          const yCoord = -x;
          const zCoord = z;

          // Intensity calculation

          const minIntensity = corrections.minIntensity;
          const maxIntensity = corrections.maxIntensity;

          const focal_offset =
            256 * (1 - corrections.focalDistance / 13100) * (1 - corrections.focalDistance / 13100);
          const focal_slope = corrections.focalSlope;
          let intensity = rawIntensity;
          intensity += focal_slope * Math.abs(focal_offset - 256 * sqr(1 - rawDistance / 65535));
          intensity = intensity < minIntensity ? minIntensity : intensity;
          intensity = intensity > maxIntensity ? maxIntensity : intensity;

          // FIXME
          // data.addPoint(xCoord, yCoord, zCoord, corrections.laserId, block.rotation,
          //               distance, intensity, time);
        }
      }
      // FIXME
      // data.newLine();
    }
  }

  unpackVLS128(_raw: RawPacket, _stamp: number): void {}

  unpackVLP16(_raw: RawPacket, _stamp: number): void {}
}

function sqr(x: number): number {
  return x * x;
}
