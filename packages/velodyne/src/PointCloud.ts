// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export enum PointFieldDataType {
  INT8 = 1,
  UINT8 = 2,
  INT16 = 3,
  UINT16 = 4,
  INT32 = 5,
  UINT32 = 6,
  FLOAT32 = 7,
  FLOAT64 = 8,
}

export type PointField = {
  name: string;
  offset: number;
  datatype: PointFieldDataType;
  count: number;
};

export type Point = {
  x: number;
  y: number;
  z: number;
  distance: number;
  intensity: number;
  ring: number;
  azimuth: number;
};

export type PointCloudOptions = {
  stamp: number;
  count: number;
};

export class PointCloud {
  static POINT_STEP = 24;

  stamp: number;
  fields: PointField[];
  height: number;
  width: number;
  is_bigendian: boolean;
  point_step: number;
  row_step: number;
  data: Uint8Array;
  is_dense: boolean;

  #index = 0;
  #view: DataView;

  constructor({ stamp, count }: PointCloudOptions) {
    this.stamp = stamp;
    this.fields = [
      { name: "x", offset: 0, datatype: PointFieldDataType.FLOAT32, count: 1 },
      { name: "y", offset: 4, datatype: PointFieldDataType.FLOAT32, count: 1 },
      { name: "z", offset: 8, datatype: PointFieldDataType.FLOAT32, count: 1 },
      { name: "distance", offset: 12, datatype: PointFieldDataType.FLOAT32, count: 1 },
      { name: "intensity", offset: 16, datatype: PointFieldDataType.FLOAT32, count: 1 },
      { name: "ring", offset: 20, datatype: PointFieldDataType.UINT16, count: 1 },
      { name: "azimuth", offset: 22, datatype: PointFieldDataType.UINT16, count: 1 },
    ];
    this.height = 1;
    this.width = count;
    this.is_bigendian = false;
    this.point_step = PointCloud.POINT_STEP;
    this.row_step = count * PointCloud.POINT_STEP;
    this.data = new Uint8Array(this.row_step);
    this.is_dense = true;

    this.#view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
  }

  addPoint(
    x: number,
    y: number,
    z: number,
    distance: number,
    intensity: number,
    ring: number,
    azimuth: number,
  ): void {
    const offset = this.#index * PointCloud.POINT_STEP;
    this.#view.setFloat32(offset + 0, x, true);
    this.#view.setFloat32(offset + 4, y, true);
    this.#view.setFloat32(offset + 8, z, true);
    this.#view.setFloat32(offset + 12, distance, true);
    this.#view.setFloat32(offset + 16, intensity, true);
    this.#view.setUint16(offset + 20, ring, true);
    this.#view.setUint16(offset + 22, azimuth, true);
    this.#index++;
  }

  point(index: number): Point {
    const offset = index * PointCloud.POINT_STEP;
    return {
      x: this.#view.getFloat32(offset + 0, true),
      y: this.#view.getFloat32(offset + 4, true),
      z: this.#view.getFloat32(offset + 8, true),
      distance: this.#view.getFloat32(offset + 12, true),
      intensity: this.#view.getFloat32(offset + 16, true),
      ring: this.#view.getUint16(offset + 20, true),
      azimuth: this.#view.getUint16(offset + 22, true),
    };
  }
}
