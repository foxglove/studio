// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export const POINTCLOUD_DATATYPES = new Set<string>();
addFoxgloveDataType(POINTCLOUD_DATATYPES, "foxglove.PointCloud");

// Expand a single Foxglove dataType into variations for ROS1 and ROS2 then add
// them to the given output set
function addFoxgloveDataType(output: Set<string>, dataType: string): Set<string> {
  // Add the Foxglove variation: foxglove.PointCloud
  output.add(dataType);

  // Add the ROS1 variation: foxglove/PointCloud
  output.add(`${dataType}`.replace(/\./g, "/"));

  // Add the ROS2 variation: foxglove/msg/PointCloud
  const parts = dataType.split(".");
  if (parts.length > 1) {
    const base = parts[0];
    const leaf = parts.slice(1).join("/");
    output.add(`${base}/msg/${leaf}`);
  }

  return output;
}
