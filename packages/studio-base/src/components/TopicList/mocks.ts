// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// prettier-ignore
export const topics = [
  { name: "/CAM_BACK/camera_info", schemaName: "sensor_msgs/CameraInfo" },
  { name: "/CAM_BACK/image_markers_annotations", schemaName: "foxglove_msgs/ImageMarkerArray" },
  { name: "/CAM_BACK/image_markers_lidar", schemaName: "visualization_msgs/ImageMarker" },
  { name: "/CAM_BACK/image_rect_compressed", schemaName: "sensor_msgs/CompressedImage" },
  { name: "/CAM_FRONT/camera_info", schemaName: "sensor_msgs/CameraInfo" },
  { name: "/CAM_FRONT/image_markers_annotations", schemaName: "foxglove_msgs/ImageMarkerArray" },
  { name: "/CAM_FRONT/image_markers_lidar", schemaName: "visualization_msgs/ImageMarker" },
  { name: "/CAM_FRONT/image_rect_compressed", schemaName: "sensor_msgs/CompressedImage" },
  { name: "/diagnostics", schemaName: "diagnostic_msgs/DiagnosticArray" },
  { name: "/drivable_area", schemaName: "nav_msgs/OccupancyGrid" },
  { name: "/gps", schemaName: "sensor_msgs/NavSatFix" },
  { name: "/imu", schemaName: "sensor_msgs/Imu" },
  { name: "/LIDAR_TOP", schemaName: "sensor_msgs/PointCloud2" },
  { name: "/map", schemaName: "nav_msgs/OccupancyGrid" },
  { name: "/markers/annotations", schemaName: "visualization_msgs/MarkerArray" },
  { name: "/odom", schemaName: "nav_msgs/Odometry" },
  { name: "/pose", schemaName: "geometry_msgs/PoseStamped" },
  { name: "/RADAR_BACK_LEFT", schemaName: "sensor_msgs/PointCloud2" },
  { name: "/RADAR_BACK_RIGHT", schemaName: "sensor_msgs/PointCloud2" },
  { name: "/RADAR_FRONT", schemaName: "sensor_msgs/PointCloud2" },
  { name: "/RADAR_FRONT_LEFT", schemaName: "sensor_msgs/PointCloud2" },
  { name: "/RADAR_FRONT_RIGHT", schemaName: "sensor_msgs/PointCloud2" },
  { name: "/semantic_map", schemaName: "visualization_msgs/MarkerArray" },
  { name: "/tf", schemaName: "tf2_msgs/TFMessage" },
];

export const datatypes = new Map([
  [
    "action_msgs/GoalInfo",
    {
      name: "action_msgs/GoalInfo",
      definitions: [
        { name: "goal_id", type: "unique_identifier_msgs/UUID", isComplex: true, isArray: false },
        { name: "stamp", type: "time", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "unique_identifier_msgs/UUID",
    {
      name: "unique_identifier_msgs/UUID",
      definitions: [
        { name: "uuid", type: "uint8", isComplex: false, isArray: true, arrayLength: 16 },
      ],
    },
  ],
  [
    "action_msgs/GoalStatus",
    {
      name: "action_msgs/GoalStatus",
      definitions: [
        { name: "STATUS_UNKNOWN", type: "int8", isConstant: true, value: 0, valueText: "0" },
        { name: "STATUS_ACCEPTED", type: "int8", isConstant: true, value: 1, valueText: "1" },
        { name: "STATUS_EXECUTING", type: "int8", isConstant: true, value: 2, valueText: "2" },
        { name: "STATUS_CANCELING", type: "int8", isConstant: true, value: 3, valueText: "3" },
        { name: "STATUS_SUCCEEDED", type: "int8", isConstant: true, value: 4, valueText: "4" },
        { name: "STATUS_CANCELED", type: "int8", isConstant: true, value: 5, valueText: "5" },
        { name: "STATUS_ABORTED", type: "int8", isConstant: true, value: 6, valueText: "6" },
        { name: "goal_info", type: "action_msgs/GoalInfo", isComplex: true, isArray: false },
        { name: "status", type: "int8", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "action_msgs/GoalStatusArray",
    {
      name: "action_msgs/GoalStatusArray",
      definitions: [
        { name: "status_list", type: "action_msgs/GoalStatus", isComplex: true, isArray: true },
      ],
    },
  ],
  [
    "actionlib_msgs/GoalID",
    {
      name: "actionlib_msgs/GoalID",
      definitions: [
        { type: "time", isArray: false, name: "stamp", isComplex: false },
        { type: "string", isArray: false, name: "id", isComplex: false },
      ],
    },
  ],
  [
    "actionlib_msgs/GoalStatus",
    {
      name: "actionlib_msgs/GoalStatus",
      definitions: [
        { type: "actionlib_msgs/GoalID", isArray: false, name: "goal_id", isComplex: true },
        { type: "uint8", isArray: false, name: "status", isComplex: false },
        { type: "uint8", name: "PENDING", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "ACTIVE", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "PREEMPTED", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", name: "SUCCEEDED", isConstant: true, value: 3, valueText: "3" },
        { type: "uint8", name: "ABORTED", isConstant: true, value: 4, valueText: "4" },
        { type: "uint8", name: "REJECTED", isConstant: true, value: 5, valueText: "5" },
        { type: "uint8", name: "PREEMPTING", isConstant: true, value: 6, valueText: "6" },
        { type: "uint8", name: "RECALLING", isConstant: true, value: 7, valueText: "7" },
        { type: "uint8", name: "RECALLED", isConstant: true, value: 8, valueText: "8" },
        { type: "uint8", name: "LOST", isConstant: true, value: 9, valueText: "9" },
        { type: "string", isArray: false, name: "text", isComplex: false },
      ],
    },
  ],
  [
    "actionlib_msgs/GoalStatusArray",
    {
      name: "actionlib_msgs/GoalStatusArray",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "actionlib_msgs/GoalStatus", isArray: true, name: "status_list", isComplex: true },
      ],
    },
  ],
  [
    "std_msgs/Header",
    {
      name: "std_msgs/Header",
      definitions: [
        { type: "uint32", isArray: false, name: "seq", isComplex: false },
        { type: "time", isArray: false, name: "stamp", isComplex: false },
        { type: "string", isArray: false, name: "frame_id", isComplex: false },
      ],
    },
  ],
  [
    "builtin_interfaces/Duration",
    {
      name: "builtin_interfaces/Duration",
      definitions: [
        { name: "sec", type: "int32", isComplex: false, isArray: false },
        { name: "nanosec", type: "uint32", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "builtin_interfaces/Time",
    {
      name: "builtin_interfaces/Time",
      definitions: [
        { name: "sec", type: "int32", isComplex: false, isArray: false },
        { name: "nanosec", type: "uint32", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "diagnostic_msgs/DiagnosticArray",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        {
          type: "diagnostic_msgs/DiagnosticStatus",
          isArray: true,
          name: "status",
          isComplex: true,
        },
      ],
    },
  ],
  [
    "diagnostic_msgs/DiagnosticStatus",
    {
      name: "diagnostic_msgs/DiagnosticStatus",
      definitions: [
        { type: "int8", name: "OK", isConstant: true, value: 0, valueText: "0" },
        { type: "int8", name: "WARN", isConstant: true, value: 1, valueText: "1" },
        { type: "int8", name: "ERROR", isConstant: true, value: 2, valueText: "2" },
        { type: "int8", name: "STALE", isConstant: true, value: 3, valueText: "3" },
        { type: "int8", isArray: false, name: "level", isComplex: false },
        { type: "string", isArray: false, name: "name", isComplex: false },
        { type: "string", isArray: false, name: "message", isComplex: false },
        { type: "string", isArray: false, name: "hardware_id", isComplex: false },
        { type: "diagnostic_msgs/KeyValue", isArray: true, name: "values", isComplex: true },
      ],
    },
  ],
  [
    "diagnostic_msgs/KeyValue",
    {
      name: "diagnostic_msgs/KeyValue",
      definitions: [
        { type: "string", isArray: false, name: "key", isComplex: false },
        { type: "string", isArray: false, name: "value", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/Accel",
    {
      name: "geometry_msgs/Accel",
      definitions: [
        { type: "geometry_msgs/Vector3", isArray: false, name: "linear", isComplex: true },
        { type: "geometry_msgs/Vector3", isArray: false, name: "angular", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/Vector3",
    {
      name: "geometry_msgs/Vector3",
      definitions: [
        { type: "float64", isArray: false, name: "x", isComplex: false },
        { type: "float64", isArray: false, name: "y", isComplex: false },
        { type: "float64", isArray: false, name: "z", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/AccelStamped",
    {
      name: "geometry_msgs/AccelStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Accel", isArray: false, name: "accel", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/AccelWithCovariance",
    {
      name: "geometry_msgs/AccelWithCovariance",
      definitions: [
        { type: "geometry_msgs/Accel", isArray: false, name: "accel", isComplex: true },
        { type: "float64", isArray: true, arrayLength: 36, name: "covariance", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/AccelWithCovarianceStamped",
    {
      name: "geometry_msgs/AccelWithCovarianceStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        {
          type: "geometry_msgs/AccelWithCovariance",
          isArray: false,
          name: "accel",
          isComplex: true,
        },
      ],
    },
  ],
  [
    "geometry_msgs/Inertia",
    {
      name: "geometry_msgs/Inertia",
      definitions: [
        { type: "float64", isArray: false, name: "m", isComplex: false },
        { type: "geometry_msgs/Vector3", isArray: false, name: "com", isComplex: true },
        { type: "float64", isArray: false, name: "ixx", isComplex: false },
        { type: "float64", isArray: false, name: "ixy", isComplex: false },
        { type: "float64", isArray: false, name: "ixz", isComplex: false },
        { type: "float64", isArray: false, name: "iyy", isComplex: false },
        { type: "float64", isArray: false, name: "iyz", isComplex: false },
        { type: "float64", isArray: false, name: "izz", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/InertiaStamped",
    {
      name: "geometry_msgs/InertiaStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Inertia", isArray: false, name: "inertia", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/Point",
    {
      name: "geometry_msgs/Point",
      definitions: [
        { type: "float64", isArray: false, name: "x", isComplex: false },
        { type: "float64", isArray: false, name: "y", isComplex: false },
        { type: "float64", isArray: false, name: "z", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/Point32",
    {
      name: "geometry_msgs/Point32",
      definitions: [
        { type: "float32", isArray: false, name: "x", isComplex: false },
        { type: "float32", isArray: false, name: "y", isComplex: false },
        { type: "float32", isArray: false, name: "z", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/PointStamped",
    {
      name: "geometry_msgs/PointStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Point", isArray: false, name: "point", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/Polygon",
    {
      name: "geometry_msgs/Polygon",
      definitions: [
        { type: "geometry_msgs/Point32", isArray: true, name: "points", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/PolygonStamped",
    {
      name: "geometry_msgs/PolygonStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Polygon", isArray: false, name: "polygon", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/Pose",
    {
      name: "geometry_msgs/Pose",
      definitions: [
        { type: "geometry_msgs/Point", isArray: false, name: "position", isComplex: true },
        { type: "geometry_msgs/Quaternion", isArray: false, name: "orientation", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/Quaternion",
    {
      name: "geometry_msgs/Quaternion",
      definitions: [
        { type: "float64", isArray: false, name: "x", isComplex: false },
        { type: "float64", isArray: false, name: "y", isComplex: false },
        { type: "float64", isArray: false, name: "z", isComplex: false },
        { type: "float64", isArray: false, name: "w", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/Pose2D",
    {
      name: "geometry_msgs/Pose2D",
      definitions: [
        { name: "x", type: "float64", isComplex: false, isArray: false },
        { name: "y", type: "float64", isComplex: false, isArray: false },
        { name: "theta", type: "float64", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "geometry_msgs/PoseArray",
    {
      name: "geometry_msgs/PoseArray",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Pose", isArray: true, name: "poses", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/PoseStamped",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Pose", isArray: false, name: "pose", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/PoseWithCovariance",
    {
      name: "geometry_msgs/PoseWithCovariance",
      definitions: [
        { type: "geometry_msgs/Pose", isArray: false, name: "pose", isComplex: true },
        { type: "float64", isArray: true, arrayLength: 36, name: "covariance", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/PoseWithCovarianceStamped",
    {
      name: "geometry_msgs/PoseWithCovarianceStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/PoseWithCovariance", isArray: false, name: "pose", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/QuaternionStamped",
    {
      name: "geometry_msgs/QuaternionStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Quaternion", isArray: false, name: "quaternion", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/Transform",
    {
      name: "geometry_msgs/Transform",
      definitions: [
        { type: "geometry_msgs/Vector3", isArray: false, name: "translation", isComplex: true },
        { type: "geometry_msgs/Quaternion", isArray: false, name: "rotation", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/TransformStamped",
    {
      name: "geometry_msgs/TransformStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: false, name: "child_frame_id", isComplex: false },
        { type: "geometry_msgs/Transform", isArray: false, name: "transform", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/Twist",
    {
      name: "geometry_msgs/Twist",
      definitions: [
        { type: "geometry_msgs/Vector3", isArray: false, name: "linear", isComplex: true },
        { type: "geometry_msgs/Vector3", isArray: false, name: "angular", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/TwistStamped",
    {
      name: "geometry_msgs/TwistStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Twist", isArray: false, name: "twist", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/TwistWithCovariance",
    {
      name: "geometry_msgs/TwistWithCovariance",
      definitions: [
        { type: "geometry_msgs/Twist", isArray: false, name: "twist", isComplex: true },
        { type: "float64", isArray: true, arrayLength: 36, name: "covariance", isComplex: false },
      ],
    },
  ],
  [
    "geometry_msgs/TwistWithCovarianceStamped",
    {
      name: "geometry_msgs/TwistWithCovarianceStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        {
          type: "geometry_msgs/TwistWithCovariance",
          isArray: false,
          name: "twist",
          isComplex: true,
        },
      ],
    },
  ],
  [
    "geometry_msgs/Vector3Stamped",
    {
      name: "geometry_msgs/Vector3Stamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Vector3", isArray: false, name: "vector", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/Wrench",
    {
      name: "geometry_msgs/Wrench",
      definitions: [
        { type: "geometry_msgs/Vector3", isArray: false, name: "force", isComplex: true },
        { type: "geometry_msgs/Vector3", isArray: false, name: "torque", isComplex: true },
      ],
    },
  ],
  [
    "geometry_msgs/WrenchStamped",
    {
      name: "geometry_msgs/WrenchStamped",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Wrench", isArray: false, name: "wrench", isComplex: true },
      ],
    },
  ],
  [
    "lifecycle_msgs/State",
    {
      name: "lifecycle_msgs/State",
      definitions: [
        {
          name: "PRIMARY_STATE_UNKNOWN",
          type: "uint8",
          isConstant: true,
          value: 0,
          valueText: "0",
        },
        {
          name: "PRIMARY_STATE_UNCONFIGURED",
          type: "uint8",
          isConstant: true,
          value: 1,
          valueText: "1",
        },
        {
          name: "PRIMARY_STATE_INACTIVE",
          type: "uint8",
          isConstant: true,
          value: 2,
          valueText: "2",
        },
        { name: "PRIMARY_STATE_ACTIVE", type: "uint8", isConstant: true, value: 3, valueText: "3" },
        {
          name: "PRIMARY_STATE_FINALIZED",
          type: "uint8",
          isConstant: true,
          value: 4,
          valueText: "4",
        },
        {
          name: "TRANSITION_STATE_CONFIGURING",
          type: "uint8",
          isConstant: true,
          value: 10,
          valueText: "10",
        },
        {
          name: "TRANSITION_STATE_CLEANINGUP",
          type: "uint8",
          isConstant: true,
          value: 11,
          valueText: "11",
        },
        {
          name: "TRANSITION_STATE_SHUTTINGDOWN",
          type: "uint8",
          isConstant: true,
          value: 12,
          valueText: "12",
        },
        {
          name: "TRANSITION_STATE_ACTIVATING",
          type: "uint8",
          isConstant: true,
          value: 13,
          valueText: "13",
        },
        {
          name: "TRANSITION_STATE_DEACTIVATING",
          type: "uint8",
          isConstant: true,
          value: 14,
          valueText: "14",
        },
        {
          name: "TRANSITION_STATE_ERRORPROCESSING",
          type: "uint8",
          isConstant: true,
          value: 15,
          valueText: "15",
        },
        { name: "id", type: "uint8", isComplex: false, isArray: false },
        { name: "label", type: "string", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "lifecycle_msgs/Transition",
    {
      name: "lifecycle_msgs/Transition",
      definitions: [
        { name: "TRANSITION_CREATE", type: "uint8", isConstant: true, value: 0, valueText: "0" },
        { name: "TRANSITION_CONFIGURE", type: "uint8", isConstant: true, value: 1, valueText: "1" },
        { name: "TRANSITION_CLEANUP", type: "uint8", isConstant: true, value: 2, valueText: "2" },
        { name: "TRANSITION_ACTIVATE", type: "uint8", isConstant: true, value: 3, valueText: "3" },
        {
          name: "TRANSITION_DEACTIVATE",
          type: "uint8",
          isConstant: true,
          value: 4,
          valueText: "4",
        },
        {
          name: "TRANSITION_UNCONFIGURED_SHUTDOWN",
          type: "uint8",
          isConstant: true,
          value: 5,
          valueText: "5",
        },
        {
          name: "TRANSITION_INACTIVE_SHUTDOWN",
          type: "uint8",
          isConstant: true,
          value: 6,
          valueText: "6",
        },
        {
          name: "TRANSITION_ACTIVE_SHUTDOWN",
          type: "uint8",
          isConstant: true,
          value: 7,
          valueText: "7",
        },
        { name: "TRANSITION_DESTROY", type: "uint8", isConstant: true, value: 8, valueText: "8" },
        {
          name: "TRANSITION_ON_CONFIGURE_SUCCESS",
          type: "uint8",
          isConstant: true,
          value: 10,
          valueText: "10",
        },
        {
          name: "TRANSITION_ON_CONFIGURE_FAILURE",
          type: "uint8",
          isConstant: true,
          value: 11,
          valueText: "11",
        },
        {
          name: "TRANSITION_ON_CONFIGURE_ERROR",
          type: "uint8",
          isConstant: true,
          value: 12,
          valueText: "12",
        },
        {
          name: "TRANSITION_ON_CLEANUP_SUCCESS",
          type: "uint8",
          isConstant: true,
          value: 20,
          valueText: "20",
        },
        {
          name: "TRANSITION_ON_CLEANUP_FAILURE",
          type: "uint8",
          isConstant: true,
          value: 21,
          valueText: "21",
        },
        {
          name: "TRANSITION_ON_CLEANUP_ERROR",
          type: "uint8",
          isConstant: true,
          value: 22,
          valueText: "22",
        },
        {
          name: "TRANSITION_ON_ACTIVATE_SUCCESS",
          type: "uint8",
          isConstant: true,
          value: 30,
          valueText: "30",
        },
        {
          name: "TRANSITION_ON_ACTIVATE_FAILURE",
          type: "uint8",
          isConstant: true,
          value: 31,
          valueText: "31",
        },
        {
          name: "TRANSITION_ON_ACTIVATE_ERROR",
          type: "uint8",
          isConstant: true,
          value: 32,
          valueText: "32",
        },
        {
          name: "TRANSITION_ON_DEACTIVATE_SUCCESS",
          type: "uint8",
          isConstant: true,
          value: 40,
          valueText: "40",
        },
        {
          name: "TRANSITION_ON_DEACTIVATE_FAILURE",
          type: "uint8",
          isConstant: true,
          value: 41,
          valueText: "41",
        },
        {
          name: "TRANSITION_ON_DEACTIVATE_ERROR",
          type: "uint8",
          isConstant: true,
          value: 42,
          valueText: "42",
        },
        {
          name: "TRANSITION_ON_SHUTDOWN_SUCCESS",
          type: "uint8",
          isConstant: true,
          value: 50,
          valueText: "50",
        },
        {
          name: "TRANSITION_ON_SHUTDOWN_FAILURE",
          type: "uint8",
          isConstant: true,
          value: 51,
          valueText: "51",
        },
        {
          name: "TRANSITION_ON_SHUTDOWN_ERROR",
          type: "uint8",
          isConstant: true,
          value: 52,
          valueText: "52",
        },
        {
          name: "TRANSITION_ON_ERROR_SUCCESS",
          type: "uint8",
          isConstant: true,
          value: 60,
          valueText: "60",
        },
        {
          name: "TRANSITION_ON_ERROR_FAILURE",
          type: "uint8",
          isConstant: true,
          value: 61,
          valueText: "61",
        },
        {
          name: "TRANSITION_ON_ERROR_ERROR",
          type: "uint8",
          isConstant: true,
          value: 62,
          valueText: "62",
        },
        {
          name: "TRANSITION_CALLBACK_SUCCESS",
          type: "uint8",
          isConstant: true,
          value: 97,
          valueText: "97",
        },
        {
          name: "TRANSITION_CALLBACK_FAILURE",
          type: "uint8",
          isConstant: true,
          value: 98,
          valueText: "98",
        },
        {
          name: "TRANSITION_CALLBACK_ERROR",
          type: "uint8",
          isConstant: true,
          value: 99,
          valueText: "99",
        },
        { name: "id", type: "uint8", isComplex: false, isArray: false },
        { name: "label", type: "string", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "lifecycle_msgs/TransitionDescription",
    {
      name: "lifecycle_msgs/TransitionDescription",
      definitions: [
        { name: "transition", type: "lifecycle_msgs/Transition", isComplex: true, isArray: false },
        { name: "start_state", type: "lifecycle_msgs/State", isComplex: true, isArray: false },
        { name: "goal_state", type: "lifecycle_msgs/State", isComplex: true, isArray: false },
      ],
    },
  ],
  [
    "lifecycle_msgs/TransitionEvent",
    {
      name: "lifecycle_msgs/TransitionEvent",
      definitions: [
        { name: "timestamp", type: "uint64", isComplex: false, isArray: false },
        { name: "transition", type: "lifecycle_msgs/Transition", isComplex: true, isArray: false },
        { name: "start_state", type: "lifecycle_msgs/State", isComplex: true, isArray: false },
        { name: "goal_state", type: "lifecycle_msgs/State", isComplex: true, isArray: false },
      ],
    },
  ],
  [
    "nav_msgs/GridCells",
    {
      name: "nav_msgs/GridCells",
      definitions: [
        { name: "header", type: "std_msgs/Header", isComplex: true, isArray: false },
        { name: "cell_width", type: "float32", isComplex: false, isArray: false },
        { name: "cell_height", type: "float32", isComplex: false, isArray: false },
        { name: "cells", type: "geometry_msgs/Point", isComplex: true, isArray: true },
      ],
    },
  ],
  [
    "nav_msgs/MapMetaData",
    {
      name: "nav_msgs/MapMetaData",
      definitions: [
        { type: "time", isArray: false, name: "map_load_time", isComplex: false },
        { type: "float32", isArray: false, name: "resolution", isComplex: false },
        { type: "uint32", isArray: false, name: "width", isComplex: false },
        { type: "uint32", isArray: false, name: "height", isComplex: false },
        { type: "geometry_msgs/Pose", isArray: false, name: "origin", isComplex: true },
      ],
    },
  ],
  [
    "nav_msgs/OccupancyGrid",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "nav_msgs/MapMetaData", isArray: false, name: "info", isComplex: true },
        { type: "int8", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "nav_msgs/Odometry",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: false, name: "child_frame_id", isComplex: false },
        { type: "geometry_msgs/PoseWithCovariance", isArray: false, name: "pose", isComplex: true },
        {
          type: "geometry_msgs/TwistWithCovariance",
          isArray: false,
          name: "twist",
          isComplex: true,
        },
      ],
    },
  ],
  [
    "nav_msgs/Path",
    {
      name: "nav_msgs/Path",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/PoseStamped", isArray: true, name: "poses", isComplex: true },
      ],
    },
  ],
  [
    "rcl_interfaces/FloatingPointRange",
    {
      name: "rcl_interfaces/FloatingPointRange",
      definitions: [
        { name: "from_value", type: "float64", isComplex: false, isArray: false },
        { name: "to_value", type: "float64", isComplex: false, isArray: false },
        { name: "step", type: "float64", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "rcl_interfaces/IntegerRange",
    {
      name: "rcl_interfaces/IntegerRange",
      definitions: [
        { name: "from_value", type: "int64", isComplex: false, isArray: false },
        { name: "to_value", type: "int64", isComplex: false, isArray: false },
        { name: "step", type: "uint64", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "rcl_interfaces/ListParametersResult",
    {
      name: "rcl_interfaces/ListParametersResult",
      definitions: [
        { name: "names", type: "string", isComplex: false, isArray: true },
        { name: "prefixes", type: "string", isComplex: false, isArray: true },
      ],
    },
  ],
  [
    "rcl_interfaces/Log",
    {
      name: "rcl_interfaces/Log",
      definitions: [
        { type: "int8", name: "DEBUG", isConstant: true, value: 10, valueText: "10" },
        { type: "int8", name: "INFO", isConstant: true, value: 20, valueText: "20" },
        { type: "int8", name: "WARN", isConstant: true, value: 30, valueText: "30" },
        { type: "int8", name: "ERROR", isConstant: true, value: 40, valueText: "40" },
        { type: "int8", name: "FATAL", isConstant: true, value: 50, valueText: "50" },
        { type: "time", isArray: false, name: "stamp", isComplex: false },
        { type: "uint8", isArray: false, name: "level", isComplex: false },
        { type: "string", isArray: false, name: "name", isComplex: false },
        { type: "string", isArray: false, name: "msg", isComplex: false },
        { type: "string", isArray: false, name: "file", isComplex: false },
        { type: "string", isArray: false, name: "function", isComplex: false },
        { type: "uint32", isArray: false, name: "line", isComplex: false },
      ],
    },
  ],
  [
    "rcl_interfaces/Parameter",
    {
      name: "rcl_interfaces/Parameter",
      definitions: [
        { name: "name", type: "string", isComplex: false, isArray: false },
        { name: "value", type: "rcl_interfaces/ParameterValue", isComplex: true, isArray: false },
      ],
    },
  ],
  [
    "rcl_interfaces/ParameterValue",
    {
      name: "rcl_interfaces/ParameterValue",
      definitions: [
        { name: "type", type: "uint8", isComplex: false, isArray: false },
        { name: "bool_value", type: "bool", isComplex: false, isArray: false },
        { name: "integer_value", type: "int64", isComplex: false, isArray: false },
        { name: "double_value", type: "float64", isComplex: false, isArray: false },
        { name: "string_value", type: "string", isComplex: false, isArray: false },
        { name: "byte_array_value", type: "int8", isComplex: false, isArray: true },
        { name: "bool_array_value", type: "bool", isComplex: false, isArray: true },
        { name: "integer_array_value", type: "int64", isComplex: false, isArray: true },
        { name: "double_array_value", type: "float64", isComplex: false, isArray: true },
        { name: "string_array_value", type: "string", isComplex: false, isArray: true },
      ],
    },
  ],
  [
    "rcl_interfaces/ParameterDescriptor",
    {
      name: "rcl_interfaces/ParameterDescriptor",
      definitions: [
        { name: "name", type: "string", isComplex: false, isArray: false },
        { name: "type", type: "uint8", isComplex: false, isArray: false },
        { name: "description", type: "string", isComplex: false, isArray: false },
        { name: "additional_constraints", type: "string", isComplex: false, isArray: false },
        { name: "read_only", type: "bool", isComplex: false, isArray: false, defaultValue: false },
        {
          name: "dynamic_typing",
          type: "bool",
          isComplex: false,
          isArray: false,
          defaultValue: false,
        },
        {
          name: "floating_point_range",
          type: "rcl_interfaces/FloatingPointRange",
          isComplex: true,
          isArray: true,
          arrayUpperBound: 1,
        },
        {
          name: "integer_range",
          type: "rcl_interfaces/IntegerRange",
          isComplex: true,
          isArray: true,
          arrayUpperBound: 1,
        },
      ],
    },
  ],
  [
    "rcl_interfaces/ParameterEvent",
    {
      name: "rcl_interfaces/ParameterEvent",
      definitions: [
        { name: "stamp", type: "time", isComplex: false, isArray: false },
        { name: "node", type: "string", isComplex: false, isArray: false },
        {
          name: "new_parameters",
          type: "rcl_interfaces/Parameter",
          isComplex: true,
          isArray: true,
        },
        {
          name: "changed_parameters",
          type: "rcl_interfaces/Parameter",
          isComplex: true,
          isArray: true,
        },
        {
          name: "deleted_parameters",
          type: "rcl_interfaces/Parameter",
          isComplex: true,
          isArray: true,
        },
      ],
    },
  ],
  [
    "rcl_interfaces/ParameterEventDescriptors",
    {
      name: "rcl_interfaces/ParameterEventDescriptors",
      definitions: [
        {
          name: "new_parameters",
          type: "rcl_interfaces/ParameterDescriptor",
          isComplex: true,
          isArray: true,
        },
        {
          name: "changed_parameters",
          type: "rcl_interfaces/ParameterDescriptor",
          isComplex: true,
          isArray: true,
        },
        {
          name: "deleted_parameters",
          type: "rcl_interfaces/ParameterDescriptor",
          isComplex: true,
          isArray: true,
        },
      ],
    },
  ],
  [
    "rcl_interfaces/ParameterType",
    {
      name: "rcl_interfaces/ParameterType",
      definitions: [
        { name: "PARAMETER_NOT_SET", type: "uint8", isConstant: true, value: 0, valueText: "0" },
        { name: "PARAMETER_BOOL", type: "uint8", isConstant: true, value: 1, valueText: "1" },
        { name: "PARAMETER_INTEGER", type: "uint8", isConstant: true, value: 2, valueText: "2" },
        { name: "PARAMETER_DOUBLE", type: "uint8", isConstant: true, value: 3, valueText: "3" },
        { name: "PARAMETER_STRING", type: "uint8", isConstant: true, value: 4, valueText: "4" },
        { name: "PARAMETER_BYTE_ARRAY", type: "uint8", isConstant: true, value: 5, valueText: "5" },
        { name: "PARAMETER_BOOL_ARRAY", type: "uint8", isConstant: true, value: 6, valueText: "6" },
        {
          name: "PARAMETER_INTEGER_ARRAY",
          type: "uint8",
          isConstant: true,
          value: 7,
          valueText: "7",
        },
        {
          name: "PARAMETER_DOUBLE_ARRAY",
          type: "uint8",
          isConstant: true,
          value: 8,
          valueText: "8",
        },
        {
          name: "PARAMETER_STRING_ARRAY",
          type: "uint8",
          isConstant: true,
          value: 9,
          valueText: "9",
        },
      ],
    },
  ],
  [
    "rcl_interfaces/SetParametersResult",
    {
      name: "rcl_interfaces/SetParametersResult",
      definitions: [
        { name: "successful", type: "bool", isComplex: false, isArray: false },
        { name: "reason", type: "string", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "rosgraph_msgs/Clock",
    {
      name: "rosgraph_msgs/Clock",
      definitions: [{ type: "time", isArray: false, name: "clock", isComplex: false }],
    },
  ],
  [
    "sensor_msgs/BatteryState",
    {
      name: "sensor_msgs/BatteryState",
      definitions: [
        {
          type: "uint8",
          name: "POWER_SUPPLY_STATUS_UNKNOWN",
          isConstant: true,
          value: 0,
          valueText: "0",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_STATUS_CHARGING",
          isConstant: true,
          value: 1,
          valueText: "1",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_STATUS_DISCHARGING",
          isConstant: true,
          value: 2,
          valueText: "2",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_STATUS_NOT_CHARGING",
          isConstant: true,
          value: 3,
          valueText: "3",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_STATUS_FULL",
          isConstant: true,
          value: 4,
          valueText: "4",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_UNKNOWN",
          isConstant: true,
          value: 0,
          valueText: "0",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_GOOD",
          isConstant: true,
          value: 1,
          valueText: "1",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_OVERHEAT",
          isConstant: true,
          value: 2,
          valueText: "2",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_DEAD",
          isConstant: true,
          value: 3,
          valueText: "3",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_OVERVOLTAGE",
          isConstant: true,
          value: 4,
          valueText: "4",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_UNSPEC_FAILURE",
          isConstant: true,
          value: 5,
          valueText: "5",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_COLD",
          isConstant: true,
          value: 6,
          valueText: "6",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_WATCHDOG_TIMER_EXPIRE",
          isConstant: true,
          value: 7,
          valueText: "7",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_HEALTH_SAFETY_TIMER_EXPIRE",
          isConstant: true,
          value: 8,
          valueText: "8",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_TECHNOLOGY_UNKNOWN",
          isConstant: true,
          value: 0,
          valueText: "0",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_TECHNOLOGY_NIMH",
          isConstant: true,
          value: 1,
          valueText: "1",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_TECHNOLOGY_LION",
          isConstant: true,
          value: 2,
          valueText: "2",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_TECHNOLOGY_LIPO",
          isConstant: true,
          value: 3,
          valueText: "3",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_TECHNOLOGY_LIFE",
          isConstant: true,
          value: 4,
          valueText: "4",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_TECHNOLOGY_NICD",
          isConstant: true,
          value: 5,
          valueText: "5",
        },
        {
          type: "uint8",
          name: "POWER_SUPPLY_TECHNOLOGY_LIMN",
          isConstant: true,
          value: 6,
          valueText: "6",
        },
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "float32", isArray: false, name: "voltage", isComplex: false },
        { type: "float32", isArray: false, name: "temperature", isComplex: false },
        { type: "float32", isArray: false, name: "current", isComplex: false },
        { type: "float32", isArray: false, name: "charge", isComplex: false },
        { type: "float32", isArray: false, name: "capacity", isComplex: false },
        { type: "float32", isArray: false, name: "design_capacity", isComplex: false },
        { type: "float32", isArray: false, name: "percentage", isComplex: false },
        { type: "uint8", isArray: false, name: "power_supply_status", isComplex: false },
        { type: "uint8", isArray: false, name: "power_supply_health", isComplex: false },
        { type: "uint8", isArray: false, name: "power_supply_technology", isComplex: false },
        { type: "bool", isArray: false, name: "present", isComplex: false },
        { type: "float32", isArray: true, name: "cell_voltage", isComplex: false },
        { type: "float32", isArray: true, name: "cell_temperature", isComplex: false },
        { type: "string", isArray: false, name: "location", isComplex: false },
        { type: "string", isArray: false, name: "serial_number", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/CameraInfo",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "uint32", isArray: false, name: "height", isComplex: false },
        { type: "uint32", isArray: false, name: "width", isComplex: false },
        { type: "string", isArray: false, name: "distortion_model", isComplex: false },
        { type: "float64", isArray: true, name: "D", isComplex: false },
        { type: "float64", isArray: true, arrayLength: 9, name: "K", isComplex: false },
        { type: "float64", isArray: true, arrayLength: 9, name: "R", isComplex: false },
        { type: "float64", isArray: true, arrayLength: 12, name: "P", isComplex: false },
        { type: "uint32", isArray: false, name: "binning_x", isComplex: false },
        { type: "uint32", isArray: false, name: "binning_y", isComplex: false },
        { type: "sensor_msgs/RegionOfInterest", isArray: false, name: "roi", isComplex: true },
      ],
    },
  ],
  [
    "sensor_msgs/RegionOfInterest",
    {
      name: "sensor_msgs/RegionOfInterest",
      definitions: [
        { type: "uint32", isArray: false, name: "x_offset", isComplex: false },
        { type: "uint32", isArray: false, name: "y_offset", isComplex: false },
        { type: "uint32", isArray: false, name: "height", isComplex: false },
        { type: "uint32", isArray: false, name: "width", isComplex: false },
        { type: "bool", isArray: false, name: "do_rectify", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/ChannelFloat32",
    {
      name: "sensor_msgs/ChannelFloat32",
      definitions: [
        { name: "name", type: "string", isComplex: false, isArray: false },
        { name: "values", type: "float32", isComplex: false, isArray: true },
      ],
    },
  ],
  [
    "sensor_msgs/CompressedImage",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: false, name: "format", isComplex: false },
        { type: "uint8", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/FluidPressure",
    {
      name: "sensor_msgs/FluidPressure",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "float64", isArray: false, name: "fluid_pressure", isComplex: false },
        { type: "float64", isArray: false, name: "variance", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/Illuminance",
    {
      name: "sensor_msgs/Illuminance",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "float64", isArray: false, name: "illuminance", isComplex: false },
        { type: "float64", isArray: false, name: "variance", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/Image",
    {
      name: "sensor_msgs/Image",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "uint32", isArray: false, name: "height", isComplex: false },
        { type: "uint32", isArray: false, name: "width", isComplex: false },
        { type: "string", isArray: false, name: "encoding", isComplex: false },
        { type: "uint8", isArray: false, name: "is_bigendian", isComplex: false },
        { type: "uint32", isArray: false, name: "step", isComplex: false },
        { type: "uint8", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/Imu",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Quaternion", isArray: false, name: "orientation", isComplex: true },
        {
          type: "float64",
          isArray: true,
          arrayLength: 9,
          name: "orientation_covariance",
          isComplex: false,
        },
        {
          type: "geometry_msgs/Vector3",
          isArray: false,
          name: "angular_velocity",
          isComplex: true,
        },
        {
          type: "float64",
          isArray: true,
          arrayLength: 9,
          name: "angular_velocity_covariance",
          isComplex: false,
        },
        {
          type: "geometry_msgs/Vector3",
          isArray: false,
          name: "linear_acceleration",
          isComplex: true,
        },
        {
          type: "float64",
          isArray: true,
          arrayLength: 9,
          name: "linear_acceleration_covariance",
          isComplex: false,
        },
      ],
    },
  ],
  [
    "sensor_msgs/JointState",
    {
      name: "sensor_msgs/JointState",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: true, name: "name", isComplex: false },
        { type: "float64", isArray: true, name: "position", isComplex: false },
        { type: "float64", isArray: true, name: "velocity", isComplex: false },
        { type: "float64", isArray: true, name: "effort", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/Joy",
    {
      name: "sensor_msgs/Joy",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "float32", isArray: true, name: "axes", isComplex: false },
        { type: "int32", isArray: true, name: "buttons", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/JoyFeedback",
    {
      name: "sensor_msgs/JoyFeedback",
      definitions: [
        { type: "uint8", name: "TYPE_LED", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "TYPE_RUMBLE", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "TYPE_BUZZER", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", isArray: false, name: "type", isComplex: false },
        { type: "uint8", isArray: false, name: "id", isComplex: false },
        { type: "float32", isArray: false, name: "intensity", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/JoyFeedbackArray",
    {
      name: "sensor_msgs/JoyFeedbackArray",
      definitions: [
        { type: "sensor_msgs/JoyFeedback", isArray: true, name: "array", isComplex: true },
      ],
    },
  ],
  [
    "sensor_msgs/LaserEcho",
    {
      name: "sensor_msgs/LaserEcho",
      definitions: [{ type: "float32", isArray: true, name: "echoes", isComplex: false }],
    },
  ],
  [
    "sensor_msgs/LaserScan",
    {
      name: "sensor_msgs/LaserScan",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "float32", isArray: false, name: "angle_min", isComplex: false },
        { type: "float32", isArray: false, name: "angle_max", isComplex: false },
        { type: "float32", isArray: false, name: "angle_increment", isComplex: false },
        { type: "float32", isArray: false, name: "time_increment", isComplex: false },
        { type: "float32", isArray: false, name: "scan_time", isComplex: false },
        { type: "float32", isArray: false, name: "range_min", isComplex: false },
        { type: "float32", isArray: false, name: "range_max", isComplex: false },
        { type: "float32", isArray: true, name: "ranges", isComplex: false },
        { type: "float32", isArray: true, name: "intensities", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/MagneticField",
    {
      name: "sensor_msgs/MagneticField",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Vector3", isArray: false, name: "magnetic_field", isComplex: true },
        {
          type: "float64",
          isArray: true,
          arrayLength: 9,
          name: "magnetic_field_covariance",
          isComplex: false,
        },
      ],
    },
  ],
  [
    "sensor_msgs/MultiDOFJointState",
    {
      name: "sensor_msgs/MultiDOFJointState",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: true, name: "joint_names", isComplex: false },
        { type: "geometry_msgs/Transform", isArray: true, name: "transforms", isComplex: true },
        { type: "geometry_msgs/Twist", isArray: true, name: "twist", isComplex: true },
        { type: "geometry_msgs/Wrench", isArray: true, name: "wrench", isComplex: true },
      ],
    },
  ],
  [
    "sensor_msgs/MultiEchoLaserScan",
    {
      name: "sensor_msgs/MultiEchoLaserScan",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "float32", isArray: false, name: "angle_min", isComplex: false },
        { type: "float32", isArray: false, name: "angle_max", isComplex: false },
        { type: "float32", isArray: false, name: "angle_increment", isComplex: false },
        { type: "float32", isArray: false, name: "time_increment", isComplex: false },
        { type: "float32", isArray: false, name: "scan_time", isComplex: false },
        { type: "float32", isArray: false, name: "range_min", isComplex: false },
        { type: "float32", isArray: false, name: "range_max", isComplex: false },
        { type: "sensor_msgs/LaserEcho", isArray: true, name: "ranges", isComplex: true },
        { type: "sensor_msgs/LaserEcho", isArray: true, name: "intensities", isComplex: true },
      ],
    },
  ],
  [
    "sensor_msgs/NavSatFix",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "sensor_msgs/NavSatStatus", isArray: false, name: "status", isComplex: true },
        { type: "float64", isArray: false, name: "latitude", isComplex: false },
        { type: "float64", isArray: false, name: "longitude", isComplex: false },
        { type: "float64", isArray: false, name: "altitude", isComplex: false },
        {
          type: "float64",
          isArray: true,
          arrayLength: 9,
          name: "position_covariance",
          isComplex: false,
        },
        {
          type: "uint8",
          name: "COVARIANCE_TYPE_UNKNOWN",
          isConstant: true,
          value: 0,
          valueText: "0",
        },
        {
          type: "uint8",
          name: "COVARIANCE_TYPE_APPROXIMATED",
          isConstant: true,
          value: 1,
          valueText: "1",
        },
        {
          type: "uint8",
          name: "COVARIANCE_TYPE_DIAGONAL_KNOWN",
          isConstant: true,
          value: 2,
          valueText: "2",
        },
        {
          type: "uint8",
          name: "COVARIANCE_TYPE_KNOWN",
          isConstant: true,
          value: 3,
          valueText: "3",
        },
        { type: "uint8", isArray: false, name: "position_covariance_type", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/NavSatStatus",
    {
      name: "sensor_msgs/NavSatStatus",
      definitions: [
        { type: "int8", name: "STATUS_NO_FIX", isConstant: true, value: -1, valueText: "-1" },
        { type: "int8", name: "STATUS_FIX", isConstant: true, value: 0, valueText: "0" },
        { type: "int8", name: "STATUS_SBAS_FIX", isConstant: true, value: 1, valueText: "1" },
        { type: "int8", name: "STATUS_GBAS_FIX", isConstant: true, value: 2, valueText: "2" },
        { type: "int8", isArray: false, name: "status", isComplex: false },
        { type: "uint16", name: "SERVICE_GPS", isConstant: true, value: 1, valueText: "1" },
        { type: "uint16", name: "SERVICE_GLONASS", isConstant: true, value: 2, valueText: "2" },
        { type: "uint16", name: "SERVICE_COMPASS", isConstant: true, value: 4, valueText: "4" },
        { type: "uint16", name: "SERVICE_GALILEO", isConstant: true, value: 8, valueText: "8" },
        { type: "uint16", isArray: false, name: "service", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/PointCloud",
    {
      name: "sensor_msgs/PointCloud",
      definitions: [
        { name: "header", type: "std_msgs/Header", isComplex: true, isArray: false },
        { name: "points", type: "geometry_msgs/Point32", isComplex: true, isArray: true },
        { name: "channels", type: "sensor_msgs/ChannelFloat32", isComplex: true, isArray: true },
      ],
    },
  ],
  [
    "sensor_msgs/PointCloud2",
    {
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "uint32", isArray: false, name: "height", isComplex: false },
        { type: "uint32", isArray: false, name: "width", isComplex: false },
        { type: "sensor_msgs/PointField", isArray: true, name: "fields", isComplex: true },
        { type: "bool", isArray: false, name: "is_bigendian", isComplex: false },
        { type: "uint32", isArray: false, name: "point_step", isComplex: false },
        { type: "uint32", isArray: false, name: "row_step", isComplex: false },
        { type: "uint8", isArray: true, name: "data", isComplex: false },
        { type: "bool", isArray: false, name: "is_dense", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/PointField",
    {
      name: "sensor_msgs/PointField",
      definitions: [
        { type: "uint8", name: "INT8", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "UINT8", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", name: "INT16", isConstant: true, value: 3, valueText: "3" },
        { type: "uint8", name: "UINT16", isConstant: true, value: 4, valueText: "4" },
        { type: "uint8", name: "INT32", isConstant: true, value: 5, valueText: "5" },
        { type: "uint8", name: "UINT32", isConstant: true, value: 6, valueText: "6" },
        { type: "uint8", name: "FLOAT32", isConstant: true, value: 7, valueText: "7" },
        { type: "uint8", name: "FLOAT64", isConstant: true, value: 8, valueText: "8" },
        { type: "string", isArray: false, name: "name", isComplex: false },
        { type: "uint32", isArray: false, name: "offset", isComplex: false },
        { type: "uint8", isArray: false, name: "datatype", isComplex: false },
        { type: "uint32", isArray: false, name: "count", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/Range",
    {
      name: "sensor_msgs/Range",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "uint8", name: "ULTRASOUND", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "INFRARED", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", isArray: false, name: "radiation_type", isComplex: false },
        { type: "float32", isArray: false, name: "field_of_view", isComplex: false },
        { type: "float32", isArray: false, name: "min_range", isComplex: false },
        { type: "float32", isArray: false, name: "max_range", isComplex: false },
        { type: "float32", isArray: false, name: "range", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/RelativeHumidity",
    {
      name: "sensor_msgs/RelativeHumidity",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "float64", isArray: false, name: "relative_humidity", isComplex: false },
        { type: "float64", isArray: false, name: "variance", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/Temperature",
    {
      name: "sensor_msgs/Temperature",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "float64", isArray: false, name: "temperature", isComplex: false },
        { type: "float64", isArray: false, name: "variance", isComplex: false },
      ],
    },
  ],
  [
    "sensor_msgs/TimeReference",
    {
      name: "sensor_msgs/TimeReference",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "time", isArray: false, name: "time_ref", isComplex: false },
        { type: "string", isArray: false, name: "source", isComplex: false },
      ],
    },
  ],
  [
    "shape_msgs/Mesh",
    {
      name: "shape_msgs/Mesh",
      definitions: [
        { type: "shape_msgs/MeshTriangle", isArray: true, name: "triangles", isComplex: true },
        { type: "geometry_msgs/Point", isArray: true, name: "vertices", isComplex: true },
      ],
    },
  ],
  [
    "shape_msgs/MeshTriangle",
    {
      name: "shape_msgs/MeshTriangle",
      definitions: [
        { type: "uint32", isArray: true, arrayLength: 3, name: "vertex_indices", isComplex: false },
      ],
    },
  ],
  [
    "shape_msgs/Plane",
    {
      name: "shape_msgs/Plane",
      definitions: [
        { type: "float64", isArray: true, arrayLength: 4, name: "coef", isComplex: false },
      ],
    },
  ],
  [
    "shape_msgs/SolidPrimitive",
    {
      name: "shape_msgs/SolidPrimitive",
      definitions: [
        { type: "uint8", name: "BOX", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "SPHERE", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", name: "CYLINDER", isConstant: true, value: 3, valueText: "3" },
        { type: "uint8", name: "CONE", isConstant: true, value: 4, valueText: "4" },
        { type: "uint8", isArray: false, name: "type", isComplex: false },
        { type: "float64", isArray: true, name: "dimensions", isComplex: false },
        { type: "uint8", name: "BOX_X", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "BOX_Y", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "BOX_Z", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", name: "SPHERE_RADIUS", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "CYLINDER_HEIGHT", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "CYLINDER_RADIUS", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "CONE_HEIGHT", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "CONE_RADIUS", isConstant: true, value: 1, valueText: "1" },
      ],
    },
  ],
  [
    "statistics_msgs/MetricsMessage",
    {
      name: "statistics_msgs/MetricsMessage",
      definitions: [
        { name: "measurement_source_name", type: "string", isComplex: false, isArray: false },
        { name: "metrics_source", type: "string", isComplex: false, isArray: false },
        { name: "unit", type: "string", isComplex: false, isArray: false },
        { name: "window_start", type: "time", isComplex: false, isArray: false },
        { name: "window_stop", type: "time", isComplex: false, isArray: false },
        {
          name: "statistics",
          type: "statistics_msgs/StatisticDataPoint",
          isComplex: true,
          isArray: true,
        },
      ],
    },
  ],
  [
    "statistics_msgs/StatisticDataPoint",
    {
      name: "statistics_msgs/StatisticDataPoint",
      definitions: [
        { name: "data_type", type: "uint8", isComplex: false, isArray: false },
        { name: "data", type: "float64", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "statistics_msgs/StatisticDataType",
    {
      name: "statistics_msgs/StatisticDataType",
      definitions: [
        {
          name: "STATISTICS_DATA_TYPE_UNINITIALIZED",
          type: "uint8",
          isConstant: true,
          value: 0,
          valueText: "0",
        },
        {
          name: "STATISTICS_DATA_TYPE_AVERAGE",
          type: "uint8",
          isConstant: true,
          value: 1,
          valueText: "1",
        },
        {
          name: "STATISTICS_DATA_TYPE_MINIMUM",
          type: "uint8",
          isConstant: true,
          value: 2,
          valueText: "2",
        },
        {
          name: "STATISTICS_DATA_TYPE_MAXIMUM",
          type: "uint8",
          isConstant: true,
          value: 3,
          valueText: "3",
        },
        {
          name: "STATISTICS_DATA_TYPE_STDDEV",
          type: "uint8",
          isConstant: true,
          value: 4,
          valueText: "4",
        },
        {
          name: "STATISTICS_DATA_TYPE_SAMPLE_COUNT",
          type: "uint8",
          isConstant: true,
          value: 5,
          valueText: "5",
        },
      ],
    },
  ],
  [
    "std_msgs/Bool",
    {
      name: "std_msgs/Bool",
      definitions: [{ type: "bool", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/Byte",
    {
      name: "std_msgs/Byte",
      definitions: [{ type: "int8", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/ByteMultiArray",
    {
      name: "std_msgs/ByteMultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "int8", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/MultiArrayLayout",
    {
      name: "std_msgs/MultiArrayLayout",
      definitions: [
        { type: "std_msgs/MultiArrayDimension", isArray: true, name: "dim", isComplex: true },
        { type: "uint32", isArray: false, name: "data_offset", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/MultiArrayDimension",
    {
      name: "std_msgs/MultiArrayDimension",
      definitions: [
        { type: "string", isArray: false, name: "label", isComplex: false },
        { type: "uint32", isArray: false, name: "size", isComplex: false },
        { type: "uint32", isArray: false, name: "stride", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/Char",
    {
      name: "std_msgs/Char",
      definitions: [{ type: "uint8", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/ColorRGBA",
    {
      name: "std_msgs/ColorRGBA",
      definitions: [
        { type: "float32", isArray: false, name: "r", isComplex: false },
        { type: "float32", isArray: false, name: "g", isComplex: false },
        { type: "float32", isArray: false, name: "b", isComplex: false },
        { type: "float32", isArray: false, name: "a", isComplex: false },
      ],
    },
  ],
  ["std_msgs/Empty", { name: "std_msgs/Empty", definitions: [] }],
  [
    "std_msgs/Float32",
    {
      name: "std_msgs/Float32",
      definitions: [{ type: "float32", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/Float32MultiArray",
    {
      name: "std_msgs/Float32MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "float32", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/Float64",
    {
      name: "std_msgs/Float64",
      definitions: [{ type: "float64", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/Float64MultiArray",
    {
      name: "std_msgs/Float64MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "float64", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/Int16",
    {
      name: "std_msgs/Int16",
      definitions: [{ type: "int16", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/Int16MultiArray",
    {
      name: "std_msgs/Int16MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "int16", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/Int32",
    {
      name: "std_msgs/Int32",
      definitions: [{ type: "int32", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/Int32MultiArray",
    {
      name: "std_msgs/Int32MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "int32", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/Int64",
    {
      name: "std_msgs/Int64",
      definitions: [{ type: "int64", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/Int64MultiArray",
    {
      name: "std_msgs/Int64MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "int64", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/Int8",
    {
      name: "std_msgs/Int8",
      definitions: [{ type: "int8", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/Int8MultiArray",
    {
      name: "std_msgs/Int8MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "int8", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/String",
    {
      name: "std_msgs/String",
      definitions: [{ type: "string", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/UInt16",
    {
      name: "std_msgs/UInt16",
      definitions: [{ type: "uint16", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/UInt16MultiArray",
    {
      name: "std_msgs/UInt16MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "uint16", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/UInt32",
    {
      name: "std_msgs/UInt32",
      definitions: [{ type: "uint32", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/UInt32MultiArray",
    {
      name: "std_msgs/UInt32MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "uint32", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/UInt64",
    {
      name: "std_msgs/UInt64",
      definitions: [{ type: "uint64", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/UInt64MultiArray",
    {
      name: "std_msgs/UInt64MultiArray",
      definitions: [
        { type: "std_msgs/MultiArrayLayout", isArray: false, name: "layout", isComplex: true },
        { type: "uint64", isArray: true, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/UInt8",
    {
      name: "std_msgs/UInt8",
      definitions: [{ type: "uint8", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/UInt8MultiArray",
    {
      name: "std_msgs/UInt8MultiArray",
      definitions: [
        { name: "layout", type: "std_msgs/MultiArrayLayout", isComplex: true, isArray: false },
        { name: "data", type: "uint8", isComplex: false, isArray: true },
      ],
    },
  ],
  [
    "stereo_msgs/DisparityImage",
    {
      name: "stereo_msgs/DisparityImage",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "sensor_msgs/Image", isArray: false, name: "image", isComplex: true },
        { type: "float32", isArray: false, name: "f", isComplex: false },
        { type: "float32", isArray: false, name: "T", isComplex: false },
        {
          type: "sensor_msgs/RegionOfInterest",
          isArray: false,
          name: "valid_window",
          isComplex: true,
        },
        { type: "float32", isArray: false, name: "min_disparity", isComplex: false },
        { type: "float32", isArray: false, name: "max_disparity", isComplex: false },
        { type: "float32", isArray: false, name: "delta_d", isComplex: false },
      ],
    },
  ],
  [
    "test_msgs/Builtins",
    {
      name: "test_msgs/Builtins",
      definitions: [
        { name: "duration_value", type: "duration", isComplex: false, isArray: false },
        { name: "time_value", type: "time", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "tf2_msgs/TF2Error",
    {
      name: "tf2_msgs/TF2Error",
      definitions: [
        { name: "NO_ERROR", type: "uint8", isConstant: true, value: 0, valueText: "0" },
        { name: "LOOKUP_ERROR", type: "uint8", isConstant: true, value: 1, valueText: "1" },
        { name: "CONNECTIVITY_ERROR", type: "uint8", isConstant: true, value: 2, valueText: "2" },
        { name: "EXTRAPOLATION_ERROR", type: "uint8", isConstant: true, value: 3, valueText: "3" },
        {
          name: "INVALID_ARGUMENT_ERROR",
          type: "uint8",
          isConstant: true,
          value: 4,
          valueText: "4",
        },
        { name: "TIMEOUT_ERROR", type: "uint8", isConstant: true, value: 5, valueText: "5" },
        { name: "TRANSFORM_ERROR", type: "uint8", isConstant: true, value: 6, valueText: "6" },
        { name: "error", type: "uint8", isComplex: false, isArray: false },
        { name: "error_string", type: "string", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "tf2_msgs/TFMessage",
    {
      definitions: [
        {
          type: "geometry_msgs/TransformStamped",
          isArray: true,
          name: "transforms",
          isComplex: true,
        },
      ],
    },
  ],
  [
    "trajectory_msgs/JointTrajectory",
    {
      name: "trajectory_msgs/JointTrajectory",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: true, name: "joint_names", isComplex: false },
        {
          type: "trajectory_msgs/JointTrajectoryPoint",
          isArray: true,
          name: "points",
          isComplex: true,
        },
      ],
    },
  ],
  [
    "trajectory_msgs/JointTrajectoryPoint",
    {
      name: "trajectory_msgs/JointTrajectoryPoint",
      definitions: [
        { type: "float64", isArray: true, name: "positions", isComplex: false },
        { type: "float64", isArray: true, name: "velocities", isComplex: false },
        { type: "float64", isArray: true, name: "accelerations", isComplex: false },
        { type: "float64", isArray: true, name: "effort", isComplex: false },
        { type: "duration", isArray: false, name: "time_from_start", isComplex: false },
      ],
    },
  ],
  [
    "trajectory_msgs/MultiDOFJointTrajectory",
    {
      name: "trajectory_msgs/MultiDOFJointTrajectory",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: true, name: "joint_names", isComplex: false },
        {
          type: "trajectory_msgs/MultiDOFJointTrajectoryPoint",
          isArray: true,
          name: "points",
          isComplex: true,
        },
      ],
    },
  ],
  [
    "trajectory_msgs/MultiDOFJointTrajectoryPoint",
    {
      name: "trajectory_msgs/MultiDOFJointTrajectoryPoint",
      definitions: [
        { type: "geometry_msgs/Transform", isArray: true, name: "transforms", isComplex: true },
        { type: "geometry_msgs/Twist", isArray: true, name: "velocities", isComplex: true },
        { type: "geometry_msgs/Twist", isArray: true, name: "accelerations", isComplex: true },
        { type: "duration", isArray: false, name: "time_from_start", isComplex: false },
      ],
    },
  ],
  [
    "visualization_msgs/ImageMarker",
    {
      name: "visualization_msgs/ImageMarker",
      definitions: [
        { type: "uint8", name: "CIRCLE", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "LINE_STRIP", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "LINE_LIST", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", name: "POLYGON", isConstant: true, value: 3, valueText: "3" },
        { type: "uint8", name: "POINTS", isConstant: true, value: 4, valueText: "4" },
        { type: "uint8", name: "ADD", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "REMOVE", isConstant: true, value: 1, valueText: "1" },
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: false, name: "ns", isComplex: false },
        { type: "int32", isArray: false, name: "id", isComplex: false },
        { type: "int32", isArray: false, name: "type", isComplex: false },
        { type: "int32", isArray: false, name: "action", isComplex: false },
        { type: "geometry_msgs/Point", isArray: false, name: "position", isComplex: true },
        { type: "float32", isArray: false, name: "scale", isComplex: false },
        { type: "std_msgs/ColorRGBA", isArray: false, name: "outline_color", isComplex: true },
        { type: "uint8", isArray: false, name: "filled", isComplex: false },
        { type: "std_msgs/ColorRGBA", isArray: false, name: "fill_color", isComplex: true },
        { type: "duration", isArray: false, name: "lifetime", isComplex: false },
        { type: "geometry_msgs/Point", isArray: true, name: "points", isComplex: true },
        { type: "std_msgs/ColorRGBA", isArray: true, name: "outline_colors", isComplex: true },
      ],
    },
  ],
  [
    "visualization_msgs/InteractiveMarker",
    {
      name: "visualization_msgs/InteractiveMarker",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "geometry_msgs/Pose", isArray: false, name: "pose", isComplex: true },
        { type: "string", isArray: false, name: "name", isComplex: false },
        { type: "string", isArray: false, name: "description", isComplex: false },
        { type: "float32", isArray: false, name: "scale", isComplex: false },
        {
          type: "visualization_msgs/MenuEntry",
          isArray: true,
          name: "menu_entries",
          isComplex: true,
        },
        {
          type: "visualization_msgs/InteractiveMarkerControl",
          isArray: true,
          name: "controls",
          isComplex: true,
        },
      ],
    },
  ],
  [
    "visualization_msgs/MenuEntry",
    {
      name: "visualization_msgs/MenuEntry",
      definitions: [
        { type: "uint32", isArray: false, name: "id", isComplex: false },
        { type: "uint32", isArray: false, name: "parent_id", isComplex: false },
        { type: "string", isArray: false, name: "title", isComplex: false },
        { type: "string", isArray: false, name: "command", isComplex: false },
        { type: "uint8", name: "FEEDBACK", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "ROSRUN", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "ROSLAUNCH", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", isArray: false, name: "command_type", isComplex: false },
      ],
    },
  ],
  [
    "visualization_msgs/InteractiveMarkerControl",
    {
      name: "visualization_msgs/InteractiveMarkerControl",
      definitions: [
        { type: "string", isArray: false, name: "name", isComplex: false },
        { type: "geometry_msgs/Quaternion", isArray: false, name: "orientation", isComplex: true },
        { type: "uint8", name: "INHERIT", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "FIXED", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "VIEW_FACING", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", isArray: false, name: "orientation_mode", isComplex: false },
        { type: "uint8", name: "NONE", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "MENU", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "BUTTON", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", name: "MOVE_AXIS", isConstant: true, value: 3, valueText: "3" },
        { type: "uint8", name: "MOVE_PLANE", isConstant: true, value: 4, valueText: "4" },
        { type: "uint8", name: "ROTATE_AXIS", isConstant: true, value: 5, valueText: "5" },
        { type: "uint8", name: "MOVE_ROTATE", isConstant: true, value: 6, valueText: "6" },
        { type: "uint8", name: "MOVE_3D", isConstant: true, value: 7, valueText: "7" },
        { type: "uint8", name: "ROTATE_3D", isConstant: true, value: 8, valueText: "8" },
        { type: "uint8", name: "MOVE_ROTATE_3D", isConstant: true, value: 9, valueText: "9" },
        { type: "uint8", isArray: false, name: "interaction_mode", isComplex: false },
        { type: "bool", isArray: false, name: "always_visible", isComplex: false },
        { type: "visualization_msgs/Marker", isArray: true, name: "markers", isComplex: true },
        { type: "bool", isArray: false, name: "independent_marker_orientation", isComplex: false },
        { type: "string", isArray: false, name: "description", isComplex: false },
      ],
    },
  ],
  [
    "visualization_msgs/Marker",
    {
      name: "visualization_msgs/Marker",
      definitions: [
        { type: "uint8", name: "ARROW", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "CUBE", isConstant: true, value: 1, valueText: "1" },
        { type: "uint8", name: "SPHERE", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", name: "CYLINDER", isConstant: true, value: 3, valueText: "3" },
        { type: "uint8", name: "LINE_STRIP", isConstant: true, value: 4, valueText: "4" },
        { type: "uint8", name: "LINE_LIST", isConstant: true, value: 5, valueText: "5" },
        { type: "uint8", name: "CUBE_LIST", isConstant: true, value: 6, valueText: "6" },
        { type: "uint8", name: "SPHERE_LIST", isConstant: true, value: 7, valueText: "7" },
        { type: "uint8", name: "POINTS", isConstant: true, value: 8, valueText: "8" },
        { type: "uint8", name: "TEXT_VIEW_FACING", isConstant: true, value: 9, valueText: "9" },
        { type: "uint8", name: "MESH_RESOURCE", isConstant: true, value: 10, valueText: "10" },
        { type: "uint8", name: "TRIANGLE_LIST", isConstant: true, value: 11, valueText: "11" },
        { type: "uint8", name: "ADD", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "MODIFY", isConstant: true, value: 0, valueText: "0" },
        { type: "uint8", name: "DELETE", isConstant: true, value: 2, valueText: "2" },
        { type: "uint8", name: "DELETEALL", isConstant: true, value: 3, valueText: "3" },
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "string", isArray: false, name: "ns", isComplex: false },
        { type: "int32", isArray: false, name: "id", isComplex: false },
        { type: "int32", isArray: false, name: "type", isComplex: false },
        { type: "int32", isArray: false, name: "action", isComplex: false },
        { type: "geometry_msgs/Pose", isArray: false, name: "pose", isComplex: true },
        { type: "geometry_msgs/Vector3", isArray: false, name: "scale", isComplex: true },
        { type: "std_msgs/ColorRGBA", isArray: false, name: "color", isComplex: true },
        { type: "duration", isArray: false, name: "lifetime", isComplex: false },
        { type: "bool", isArray: false, name: "frame_locked", isComplex: false },
        { type: "geometry_msgs/Point", isArray: true, name: "points", isComplex: true },
        { type: "std_msgs/ColorRGBA", isArray: true, name: "colors", isComplex: true },
        { type: "string", isArray: false, name: "text", isComplex: false },
        { type: "string", isArray: false, name: "mesh_resource", isComplex: false },
        { type: "bool", isArray: false, name: "mesh_use_embedded_materials", isComplex: false },
      ],
    },
  ],
  [
    "visualization_msgs/InteractiveMarkerFeedback",
    {
      name: "visualization_msgs/InteractiveMarkerFeedback",
      definitions: [
        { name: "header", type: "std_msgs/Header", isComplex: true, isArray: false },
        { name: "client_id", type: "string", isComplex: false, isArray: false },
        { name: "marker_name", type: "string", isComplex: false, isArray: false },
        { name: "control_name", type: "string", isComplex: false, isArray: false },
        { name: "KEEP_ALIVE", type: "uint8", isConstant: true, value: 0, valueText: "0" },
        { name: "POSE_UPDATE", type: "uint8", isConstant: true, value: 1, valueText: "1" },
        { name: "MENU_SELECT", type: "uint8", isConstant: true, value: 2, valueText: "2" },
        { name: "BUTTON_CLICK", type: "uint8", isConstant: true, value: 3, valueText: "3" },
        { name: "MOUSE_DOWN", type: "uint8", isConstant: true, value: 4, valueText: "4" },
        { name: "MOUSE_UP", type: "uint8", isConstant: true, value: 5, valueText: "5" },
        { name: "event_type", type: "uint8", isComplex: false, isArray: false },
        { name: "pose", type: "geometry_msgs/Pose", isComplex: true, isArray: false },
        { name: "menu_entry_id", type: "uint32", isComplex: false, isArray: false },
        { name: "mouse_point", type: "geometry_msgs/Point", isComplex: true, isArray: false },
        { name: "mouse_point_valid", type: "bool", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "visualization_msgs/InteractiveMarkerInit",
    {
      name: "visualization_msgs/InteractiveMarkerInit",
      definitions: [
        { name: "server_id", type: "string", isComplex: false, isArray: false },
        { name: "seq_num", type: "uint64", isComplex: false, isArray: false },
        {
          name: "markers",
          type: "visualization_msgs/InteractiveMarker",
          isComplex: true,
          isArray: true,
        },
      ],
    },
  ],
  [
    "visualization_msgs/InteractiveMarkerPose",
    {
      name: "visualization_msgs/InteractiveMarkerPose",
      definitions: [
        { name: "header", type: "std_msgs/Header", isComplex: true, isArray: false },
        { name: "pose", type: "geometry_msgs/Pose", isComplex: true, isArray: false },
        { name: "name", type: "string", isComplex: false, isArray: false },
      ],
    },
  ],
  [
    "visualization_msgs/InteractiveMarkerUpdate",
    {
      name: "visualization_msgs/InteractiveMarkerUpdate",
      definitions: [
        { name: "server_id", type: "string", isComplex: false, isArray: false },
        { name: "seq_num", type: "uint64", isComplex: false, isArray: false },
        { name: "KEEP_ALIVE", type: "uint8", isConstant: true, value: 0, valueText: "0" },
        { name: "UPDATE", type: "uint8", isConstant: true, value: 1, valueText: "1" },
        { name: "type", type: "uint8", isComplex: false, isArray: false },
        {
          name: "markers",
          type: "visualization_msgs/InteractiveMarker",
          isComplex: true,
          isArray: true,
        },
        {
          name: "poses",
          type: "visualization_msgs/InteractiveMarkerPose",
          isComplex: true,
          isArray: true,
        },
        { name: "erases", type: "string", isComplex: false, isArray: true },
      ],
    },
  ],
  [
    "visualization_msgs/MarkerArray",
    {
      definitions: [
        { type: "visualization_msgs/Marker", isArray: true, name: "markers", isComplex: true },
      ],
    },
  ],
  [
    "rosgraph_msgs/Log",
    {
      name: "rosgraph_msgs/Log",
      definitions: [
        { type: "int8", name: "DEBUG", isConstant: true, value: 1, valueText: "1" },
        { type: "int8", name: "INFO", isConstant: true, value: 2, valueText: "2" },
        { type: "int8", name: "WARN", isConstant: true, value: 4, valueText: "4" },
        { type: "int8", name: "ERROR", isConstant: true, value: 8, valueText: "8" },
        { type: "int8", name: "FATAL", isConstant: true, value: 16, valueText: "16" },
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "int8", isArray: false, name: "level", isComplex: false },
        { type: "string", isArray: false, name: "name", isComplex: false },
        { type: "string", isArray: false, name: "msg", isComplex: false },
        { type: "string", isArray: false, name: "file", isComplex: false },
        { type: "string", isArray: false, name: "function", isComplex: false },
        { type: "uint32", isArray: false, name: "line", isComplex: false },
        { type: "string", isArray: true, name: "topics", isComplex: false },
      ],
    },
  ],
  [
    "rosgraph_msgs/TopicStatistics",
    {
      name: "rosgraph_msgs/TopicStatistics",
      definitions: [
        { type: "string", isArray: false, name: "topic", isComplex: false },
        { type: "string", isArray: false, name: "node_pub", isComplex: false },
        { type: "string", isArray: false, name: "node_sub", isComplex: false },
        { type: "time", isArray: false, name: "window_start", isComplex: false },
        { type: "time", isArray: false, name: "window_stop", isComplex: false },
        { type: "int32", isArray: false, name: "delivered_msgs", isComplex: false },
        { type: "int32", isArray: false, name: "dropped_msgs", isComplex: false },
        { type: "int32", isArray: false, name: "traffic", isComplex: false },
        { type: "duration", isArray: false, name: "period_mean", isComplex: false },
        { type: "duration", isArray: false, name: "period_stddev", isComplex: false },
        { type: "duration", isArray: false, name: "period_max", isComplex: false },
        { type: "duration", isArray: false, name: "stamp_age_mean", isComplex: false },
        { type: "duration", isArray: false, name: "stamp_age_stddev", isComplex: false },
        { type: "duration", isArray: false, name: "stamp_age_max", isComplex: false },
      ],
    },
  ],
  [
    "std_msgs/Duration",
    {
      name: "std_msgs/Duration",
      definitions: [{ type: "duration", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "std_msgs/Time",
    {
      name: "std_msgs/Time",
      definitions: [{ type: "time", isArray: false, name: "data", isComplex: false }],
    },
  ],
  [
    "velodyne_msgs/VelodynePacket",
    {
      name: "velodyne_msgs/VelodynePacket",
      definitions: [
        { type: "time", isArray: false, name: "stamp", isComplex: false },
        { type: "uint8", isArray: true, arrayLength: 1206, name: "data", isComplex: false },
      ],
    },
  ],
  [
    "velodyne_msgs/VelodyneScan",
    {
      name: "velodyne_msgs/VelodyneScan",
      definitions: [
        { type: "std_msgs/Header", isArray: false, name: "header", isComplex: true },
        { type: "velodyne_msgs/VelodynePacket", isArray: true, name: "packets", isComplex: true },
      ],
    },
  ],
  [
    "foxglove_msgs/ArrowPrimitive",
    {
      name: "foxglove_msgs/ArrowPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Position of the arrow's tail and orientation of the arrow. Identity orientation means the arrow points in the +x direction.",
        },
        {
          name: "shaft_length",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Length of the arrow shaft",
        },
        {
          name: "shaft_diameter",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Diameter of the arrow shaft",
        },
        {
          name: "head_length",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Length of the arrow head",
        },
        {
          name: "head_diameter",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Diameter of the arrow head",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the arrow",
        },
      ],
    },
  ],
  [
    "foxglove.ArrowPrimitive",
    {
      name: "foxglove.ArrowPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Position of the arrow's tail and orientation of the arrow. Identity orientation means the arrow points in the +x direction.",
        },
        {
          name: "shaft_length",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Length of the arrow shaft",
        },
        {
          name: "shaft_diameter",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Diameter of the arrow shaft",
        },
        {
          name: "head_length",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Length of the arrow head",
        },
        {
          name: "head_diameter",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Diameter of the arrow head",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the arrow",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/CameraCalibration",
    {
      name: "foxglove_msgs/CameraCalibration",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of calibration data",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Frame of reference for the camera. The origin of the frame is the optical center of the camera. +x points to the right in the image, +y points down, and +z points into the plane of the image.",
        },
        {
          name: "width",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Image width",
        },
        {
          name: "height",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Image height",
        },
        {
          name: "distortion_model",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Name of distortion model\n\nSupported values: `plumb_bob` and `rational_polynomial`",
        },
        {
          name: "D",
          type: "float64",
          isComplex: false,
          isArray: true,
          description: "Distortion parameters",
        },
        {
          name: "K",
          type: "float64",
          isComplex: false,
          isArray: true,
          arrayLength: 9,
          description:
            "Intrinsic camera matrix (3x3 row-major matrix)\n\nA 3x3 row-major matrix for the raw (distorted) image.\n\nProjects 3D points in the camera coordinate frame to 2D pixel coordinates using the focal lengths (fx, fy) and principal point (cx, cy).\n\n```\n    [fx  0 cx]\nK = [ 0 fy cy]\n    [ 0  0  1]\n```\n",
        },
        {
          name: "R",
          type: "float64",
          isComplex: false,
          isArray: true,
          arrayLength: 9,
          description:
            "Rectification matrix (stereo cameras only, 3x3 row-major matrix)\n\nA rotation matrix aligning the camera coordinate system to the ideal stereo image plane so that epipolar lines in both stereo images are parallel.",
        },
        {
          name: "P",
          type: "float64",
          isComplex: false,
          isArray: true,
          arrayLength: 12,
          description:
            "Projection/camera matrix (3x4 row-major matrix)\n\n```\n    [fx'  0  cx' Tx]\nP = [ 0  fy' cy' Ty]\n    [ 0   0   1   0]\n```\n\nBy convention, this matrix specifies the intrinsic (camera) matrix of the processed (rectified) image. That is, the left 3x3 portion is the normal camera intrinsic matrix for the rectified image.\n\nIt projects 3D points in the camera coordinate frame to 2D pixel coordinates using the focal lengths (fx', fy') and principal point (cx', cy') - these may differ from the values in K.\n\nFor monocular cameras, Tx = Ty = 0. Normally, monocular cameras will also have R = the identity and P[1:3,1:3] = K.\n\nFor a stereo pair, the fourth column [Tx Ty 0]' is related to the position of the optical center of the second camera in the first camera's frame. We assume Tz = 0 so both cameras are in the same stereo image plane. The first camera always has Tx = Ty = 0. For the right (second) camera of a horizontal stereo pair, Ty = 0 and Tx = -fx' * B, where B is the baseline between the cameras.\n\nGiven a 3D point [X Y Z]', the projection (x, y) of the point onto the rectified image is given by:\n\n```\n[u v w]' = P * [X Y Z 1]'\n       x = u / w\n       y = v / w\n```\n\nThis holds for both images of a stereo pair.\n",
        },
      ],
    },
  ],
  [
    "foxglove.CameraCalibration",
    {
      name: "foxglove.CameraCalibration",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of calibration data",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Frame of reference for the camera. The origin of the frame is the optical center of the camera. +x points to the right in the image, +y points down, and +z points into the plane of the image.",
        },
        {
          name: "width",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Image width",
        },
        {
          name: "height",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Image height",
        },
        {
          name: "distortion_model",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Name of distortion model\n\nSupported values: `plumb_bob` and `rational_polynomial`",
        },
        {
          name: "D",
          type: "float64",
          isComplex: false,
          isArray: true,
          description: "Distortion parameters",
        },
        {
          name: "K",
          type: "float64",
          isComplex: false,
          isArray: true,
          arrayLength: 9,
          description:
            "Intrinsic camera matrix (3x3 row-major matrix)\n\nA 3x3 row-major matrix for the raw (distorted) image.\n\nProjects 3D points in the camera coordinate frame to 2D pixel coordinates using the focal lengths (fx, fy) and principal point (cx, cy).\n\n```\n    [fx  0 cx]\nK = [ 0 fy cy]\n    [ 0  0  1]\n```\n",
        },
        {
          name: "R",
          type: "float64",
          isComplex: false,
          isArray: true,
          arrayLength: 9,
          description:
            "Rectification matrix (stereo cameras only, 3x3 row-major matrix)\n\nA rotation matrix aligning the camera coordinate system to the ideal stereo image plane so that epipolar lines in both stereo images are parallel.",
        },
        {
          name: "P",
          type: "float64",
          isComplex: false,
          isArray: true,
          arrayLength: 12,
          description:
            "Projection/camera matrix (3x4 row-major matrix)\n\n```\n    [fx'  0  cx' Tx]\nP = [ 0  fy' cy' Ty]\n    [ 0   0   1   0]\n```\n\nBy convention, this matrix specifies the intrinsic (camera) matrix of the processed (rectified) image. That is, the left 3x3 portion is the normal camera intrinsic matrix for the rectified image.\n\nIt projects 3D points in the camera coordinate frame to 2D pixel coordinates using the focal lengths (fx', fy') and principal point (cx', cy') - these may differ from the values in K.\n\nFor monocular cameras, Tx = Ty = 0. Normally, monocular cameras will also have R = the identity and P[1:3,1:3] = K.\n\nFor a stereo pair, the fourth column [Tx Ty 0]' is related to the position of the optical center of the second camera in the first camera's frame. We assume Tz = 0 so both cameras are in the same stereo image plane. The first camera always has Tx = Ty = 0. For the right (second) camera of a horizontal stereo pair, Ty = 0 and Tx = -fx' * B, where B is the baseline between the cameras.\n\nGiven a 3D point [X Y Z]', the projection (x, y) of the point onto the rectified image is given by:\n\n```\n[u v w]' = P * [X Y Z 1]'\n       x = u / w\n       y = v / w\n```\n\nThis holds for both images of a stereo pair.\n",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/CircleAnnotation",
    {
      name: "foxglove_msgs/CircleAnnotation",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of circle",
        },
        {
          name: "position",
          type: "foxglove_msgs/Point2",
          isComplex: true,
          isArray: false,
          description: "Center of the circle in 2D image coordinates (pixels)",
        },
        {
          name: "diameter",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Circle diameter in pixels",
        },
        {
          name: "thickness",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Line thickness in pixels",
        },
        {
          name: "fill_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Fill color",
        },
        {
          name: "outline_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Outline color",
        },
      ],
    },
  ],
  [
    "foxglove.CircleAnnotation",
    {
      name: "foxglove.CircleAnnotation",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of circle",
        },
        {
          name: "position",
          type: "foxglove_msgs/Point2",
          isComplex: true,
          isArray: false,
          description: "Center of the circle in 2D image coordinates (pixels)",
        },
        {
          name: "diameter",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Circle diameter in pixels",
        },
        {
          name: "thickness",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Line thickness in pixels",
        },
        {
          name: "fill_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Fill color",
        },
        {
          name: "outline_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Outline color",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Color",
    {
      name: "foxglove_msgs/Color",
      definitions: [
        {
          name: "r",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Red value between 0 and 1",
        },
        {
          name: "g",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Green value between 0 and 1",
        },
        {
          name: "b",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Blue value between 0 and 1",
        },
        {
          name: "a",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Alpha value between 0 and 1",
        },
      ],
    },
  ],
  [
    "foxglove.Color",
    {
      name: "foxglove.Color",
      definitions: [
        {
          name: "r",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Red value between 0 and 1",
        },
        {
          name: "g",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Green value between 0 and 1",
        },
        {
          name: "b",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Blue value between 0 and 1",
        },
        {
          name: "a",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Alpha value between 0 and 1",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/CompressedImage",
    {
      name: "foxglove_msgs/CompressedImage",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of image",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Frame of reference for the image. The origin of the frame is the optical center of the camera. +x points to the right in the image, +y points down, and +z points into the plane of the image.",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description: "Compressed image data",
        },
        {
          name: "format",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Image format\n\nSupported values: `webp`, `jpeg`, `png`",
        },
      ],
    },
  ],
  [
    "foxglove.CompressedImage",
    {
      name: "foxglove.CompressedImage",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of image",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Frame of reference for the image. The origin of the frame is the optical center of the camera. +x points to the right in the image, +y points down, and +z points into the plane of the image.",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description: "Compressed image data",
        },
        {
          name: "format",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Image format\n\nSupported values: `webp`, `jpeg`, `png`",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/CylinderPrimitive",
    {
      name: "foxglove_msgs/CylinderPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Position of the center of the cylinder and orientation of the cylinder. The flat face(s) are perpendicular to the z-axis.",
        },
        {
          name: "size",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Size of the cylinder's bounding box",
        },
        {
          name: "bottom_scale",
          type: "float64",
          isComplex: false,
          isArray: false,
          description:
            "0-1, ratio of the diameter of the cylinder's bottom face (min z) to the bottom of the bounding box",
        },
        {
          name: "top_scale",
          type: "float64",
          isComplex: false,
          isArray: false,
          description:
            "0-1, ratio of the diameter of the cylinder's top face (max z) to the top of the bounding box",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the cylinder",
        },
      ],
    },
  ],
  [
    "foxglove.CylinderPrimitive",
    {
      name: "foxglove.CylinderPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Position of the center of the cylinder and orientation of the cylinder. The flat face(s) are perpendicular to the z-axis.",
        },
        {
          name: "size",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Size of the cylinder's bounding box",
        },
        {
          name: "bottom_scale",
          type: "float64",
          isComplex: false,
          isArray: false,
          description:
            "0-1, ratio of the diameter of the cylinder's bottom face (min z) to the bottom of the bounding box",
        },
        {
          name: "top_scale",
          type: "float64",
          isComplex: false,
          isArray: false,
          description:
            "0-1, ratio of the diameter of the cylinder's top face (max z) to the top of the bounding box",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the cylinder",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/CubePrimitive",
    {
      name: "foxglove_msgs/CubePrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Position of the center of the cube and orientation of the cube",
        },
        {
          name: "size",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Size of the cube along each axis",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the cube",
        },
      ],
    },
  ],
  [
    "foxglove.CubePrimitive",
    {
      name: "foxglove.CubePrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Position of the center of the cube and orientation of the cube",
        },
        {
          name: "size",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Size of the cube along each axis",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the cube",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/FrameTransform",
    {
      name: "foxglove_msgs/FrameTransform",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of transform",
        },
        {
          name: "parent_frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Name of the parent frame",
        },
        {
          name: "child_frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Name of the child frame",
        },
        {
          name: "translation",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Translation component of the transform",
        },
        {
          name: "rotation",
          type: "geometry_msgs/Quaternion",
          isComplex: true,
          isArray: false,
          description: "Rotation component of the transform",
        },
      ],
    },
  ],
  [
    "foxglove.FrameTransform",
    {
      name: "foxglove.FrameTransform",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of transform",
        },
        {
          name: "parent_frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Name of the parent frame",
        },
        {
          name: "child_frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Name of the child frame",
        },
        {
          name: "translation",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Translation component of the transform",
        },
        {
          name: "rotation",
          type: "geometry_msgs/Quaternion",
          isComplex: true,
          isArray: false,
          description: "Rotation component of the transform",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/FrameTransforms",
    {
      name: "foxglove_msgs/FrameTransforms",
      definitions: [
        {
          name: "transforms",
          type: "foxglove_msgs/FrameTransform",
          isComplex: true,
          isArray: true,
          description: "Array of transforms",
        },
      ],
    },
  ],
  [
    "foxglove.FrameTransforms",
    {
      name: "foxglove.FrameTransforms",
      definitions: [
        {
          name: "transforms",
          type: "foxglove_msgs/FrameTransform",
          isComplex: true,
          isArray: true,
          description: "Array of transforms",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/GeoJSON",
    {
      name: "foxglove_msgs/GeoJSON",
      definitions: [
        {
          name: "geojson",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "GeoJSON data encoded as a UTF-8 string",
        },
      ],
    },
  ],
  [
    "foxglove.GeoJSON",
    {
      name: "foxglove.GeoJSON",
      definitions: [
        {
          name: "geojson",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "GeoJSON data encoded as a UTF-8 string",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Grid",
    {
      name: "foxglove_msgs/Grid",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of grid",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Origin of grid's corner relative to frame of reference; grid is positioned in the x-y plane relative to this origin",
        },
        {
          name: "column_count",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Number of grid columns",
        },
        {
          name: "cell_size",
          type: "foxglove_msgs/Vector2",
          isComplex: true,
          isArray: false,
          description: "Size of single grid cell along x and y axes, relative to `pose`",
        },
        {
          name: "row_stride",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Number of bytes between rows in `data`",
        },
        {
          name: "cell_stride",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Number of bytes between cells within a row in `data`",
        },
        {
          name: "fields",
          type: "foxglove_msgs/PackedElementField",
          isComplex: true,
          isArray: true,
          description:
            "Fields in `data`. `red`, `green`, `blue`, and `alpha` are optional for customizing the grid's color.",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description: "Grid cell data, interpreted using `fields`, in row-major (y-major) order",
        },
      ],
    },
  ],
  [
    "foxglove.Grid",
    {
      name: "foxglove.Grid",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of grid",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Origin of grid's corner relative to frame of reference; grid is positioned in the x-y plane relative to this origin",
        },
        {
          name: "column_count",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Number of grid columns",
        },
        {
          name: "cell_size",
          type: "foxglove_msgs/Vector2",
          isComplex: true,
          isArray: false,
          description: "Size of single grid cell along x and y axes, relative to `pose`",
        },
        {
          name: "row_stride",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Number of bytes between rows in `data`",
        },
        {
          name: "cell_stride",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Number of bytes between cells within a row in `data`",
        },
        {
          name: "fields",
          type: "foxglove_msgs/PackedElementField",
          isComplex: true,
          isArray: true,
          description:
            "Fields in `data`. `red`, `green`, `blue`, and `alpha` are optional for customizing the grid's color.",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description: "Grid cell data, interpreted using `fields`, in row-major (y-major) order",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/ImageAnnotations",
    {
      name: "foxglove_msgs/ImageAnnotations",
      definitions: [
        {
          name: "circles",
          type: "foxglove_msgs/CircleAnnotation",
          isComplex: true,
          isArray: true,
          description: "Circle annotations",
        },
        {
          name: "points",
          type: "foxglove_msgs/PointsAnnotation",
          isComplex: true,
          isArray: true,
          description: "Points annotations",
        },
        {
          name: "texts",
          type: "foxglove_msgs/TextAnnotation",
          isComplex: true,
          isArray: true,
          description: "Text annotations",
        },
      ],
    },
  ],
  [
    "foxglove.ImageAnnotations",
    {
      name: "foxglove.ImageAnnotations",
      definitions: [
        {
          name: "circles",
          type: "foxglove_msgs/CircleAnnotation",
          isComplex: true,
          isArray: true,
          description: "Circle annotations",
        },
        {
          name: "points",
          type: "foxglove_msgs/PointsAnnotation",
          isComplex: true,
          isArray: true,
          description: "Points annotations",
        },
        {
          name: "texts",
          type: "foxglove_msgs/TextAnnotation",
          isComplex: true,
          isArray: true,
          description: "Text annotations",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/KeyValuePair",
    {
      name: "foxglove_msgs/KeyValuePair",
      definitions: [
        { name: "key", type: "string", isComplex: false, isArray: false, description: "Key" },
        { name: "value", type: "string", isComplex: false, isArray: false, description: "Value" },
      ],
    },
  ],
  [
    "foxglove.KeyValuePair",
    {
      name: "foxglove.KeyValuePair",
      definitions: [
        { name: "key", type: "string", isComplex: false, isArray: false, description: "Key" },
        { name: "value", type: "string", isComplex: false, isArray: false, description: "Value" },
      ],
    },
  ],
  [
    "foxglove_msgs/LaserScan",
    {
      name: "foxglove_msgs/LaserScan",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of scan",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Origin of scan relative to frame of reference; points are positioned in the x-y plane relative to this origin; angles are interpreted as counterclockwise rotations around the z axis with 0 rad being in the +x direction",
        },
        {
          name: "start_angle",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Bearing of first point, in radians",
        },
        {
          name: "end_angle",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Bearing of last point, in radians",
        },
        {
          name: "ranges",
          type: "float64",
          isComplex: false,
          isArray: true,
          description:
            "Distance of detections from origin; assumed to be at equally-spaced angles between `start_angle` and `end_angle`",
        },
        {
          name: "intensities",
          type: "float64",
          isComplex: false,
          isArray: true,
          description: "Intensity of detections",
        },
      ],
    },
  ],
  [
    "foxglove.LaserScan",
    {
      name: "foxglove.LaserScan",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of scan",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Origin of scan relative to frame of reference; points are positioned in the x-y plane relative to this origin; angles are interpreted as counterclockwise rotations around the z axis with 0 rad being in the +x direction",
        },
        {
          name: "start_angle",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Bearing of first point, in radians",
        },
        {
          name: "end_angle",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Bearing of last point, in radians",
        },
        {
          name: "ranges",
          type: "float64",
          isComplex: false,
          isArray: true,
          description:
            "Distance of detections from origin; assumed to be at equally-spaced angles between `start_angle` and `end_angle`",
        },
        {
          name: "intensities",
          type: "float64",
          isComplex: false,
          isArray: true,
          description: "Intensity of detections",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/LinePrimitive",
    {
      name: "foxglove_msgs/LinePrimitive",
      definitions: [
        {
          name: "LINE_STRIP",
          value: 0,
          isConstant: true,
          valueText: "0",
          type: "uint8",
          description: "Connected line segments: 0-1, 1-2, ..., (n-1)-n",
        },
        {
          name: "LINE_LOOP",
          value: 1,
          isConstant: true,
          valueText: "1",
          type: "uint8",
          description: "Closed polygon: 0-1, 1-2, ..., (n-1)-n, n-0",
        },
        {
          name: "LINE_LIST",
          value: 2,
          isConstant: true,
          valueText: "2",
          type: "uint8",
          description: "Individual line segments: 0-1, 2-3, 4-5, ...",
        },
        {
          name: "type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description: "Drawing primitive to use for lines",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Origin of lines relative to reference frame",
        },
        {
          name: "thickness",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Line thickness",
        },
        {
          name: "scale_invariant",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Indicates whether `thickness` is a fixed size in screen pixels (true), or specified in world coordinates and scales with distance from the camera (false)",
        },
        {
          name: "points",
          type: "geometry_msgs/Point",
          isComplex: true,
          isArray: true,
          description: "Points along the line",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description:
            "Solid color to use for the whole line. One of `color` or `colors` must be provided.",
        },
        {
          name: "colors",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: true,
          description:
            "Per-point colors (if specified, must have the same length as `points`). One of `color` or `colors` must be provided.",
        },
        {
          name: "indices",
          type: "uint32",
          isComplex: false,
          isArray: true,
          description:
            "Indices into the `points` and `colors` attribute arrays, which can be used to avoid duplicating attribute data.\n\nIf omitted or empty, indexing will not be used. This default behavior is equivalent to specifying [0, 1, ..., N-1] for the indices (where N is the number of `points` provided).",
        },
      ],
    },
  ],
  [
    "foxglove.LinePrimitive",
    {
      name: "foxglove.LinePrimitive",
      definitions: [
        {
          name: "LINE_STRIP",
          value: 0,
          isConstant: true,
          valueText: "0",
          type: "uint8",
          description: "Connected line segments: 0-1, 1-2, ..., (n-1)-n",
        },
        {
          name: "LINE_LOOP",
          value: 1,
          isConstant: true,
          valueText: "1",
          type: "uint8",
          description: "Closed polygon: 0-1, 1-2, ..., (n-1)-n, n-0",
        },
        {
          name: "LINE_LIST",
          value: 2,
          isConstant: true,
          valueText: "2",
          type: "uint8",
          description: "Individual line segments: 0-1, 2-3, 4-5, ...",
        },
        {
          name: "type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description: "Drawing primitive to use for lines",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Origin of lines relative to reference frame",
        },
        {
          name: "thickness",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Line thickness",
        },
        {
          name: "scale_invariant",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Indicates whether `thickness` is a fixed size in screen pixels (true), or specified in world coordinates and scales with distance from the camera (false)",
        },
        {
          name: "points",
          type: "geometry_msgs/Point",
          isComplex: true,
          isArray: true,
          description: "Points along the line",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description:
            "Solid color to use for the whole line. One of `color` or `colors` must be provided.",
        },
        {
          name: "colors",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: true,
          description:
            "Per-point colors (if specified, must have the same length as `points`). One of `color` or `colors` must be provided.",
        },
        {
          name: "indices",
          type: "uint32",
          isComplex: false,
          isArray: true,
          description:
            "Indices into the `points` and `colors` attribute arrays, which can be used to avoid duplicating attribute data.\n\nIf omitted or empty, indexing will not be used. This default behavior is equivalent to specifying [0, 1, ..., N-1] for the indices (where N is the number of `points` provided).",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/LocationFix",
    {
      name: "foxglove_msgs/LocationFix",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of the message",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Frame for the sensor. Latitude and longitude readings are at the origin of the frame.",
        },
        {
          name: "latitude",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Latitude in degrees",
        },
        {
          name: "longitude",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Longitude in degrees",
        },
        {
          name: "altitude",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Altitude in meters",
        },
        {
          name: "position_covariance",
          type: "float64",
          isComplex: false,
          isArray: true,
          arrayLength: 9,
          description:
            "Position covariance (m^2) defined relative to a tangential plane through the reported position. The components are East, North, and Up (ENU), in row-major order.",
        },
        { name: "UNKNOWN", value: 0, isConstant: true, valueText: "0", type: "uint8" },
        { name: "APPROXIMATED", value: 1, isConstant: true, valueText: "1", type: "uint8" },
        { name: "DIAGONAL_KNOWN", value: 2, isConstant: true, valueText: "2", type: "uint8" },
        { name: "KNOWN", value: 3, isConstant: true, valueText: "3", type: "uint8" },
        {
          name: "position_covariance_type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description:
            "If `position_covariance` is available, `position_covariance_type` must be set to indicate the type of covariance.",
        },
      ],
    },
  ],
  [
    "foxglove.LocationFix",
    {
      name: "foxglove.LocationFix",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of the message",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Frame for the sensor. Latitude and longitude readings are at the origin of the frame.",
        },
        {
          name: "latitude",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Latitude in degrees",
        },
        {
          name: "longitude",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Longitude in degrees",
        },
        {
          name: "altitude",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Altitude in meters",
        },
        {
          name: "position_covariance",
          type: "float64",
          isComplex: false,
          isArray: true,
          arrayLength: 9,
          description:
            "Position covariance (m^2) defined relative to a tangential plane through the reported position. The components are East, North, and Up (ENU), in row-major order.",
        },
        { name: "UNKNOWN", value: 0, isConstant: true, valueText: "0", type: "uint8" },
        { name: "APPROXIMATED", value: 1, isConstant: true, valueText: "1", type: "uint8" },
        { name: "DIAGONAL_KNOWN", value: 2, isConstant: true, valueText: "2", type: "uint8" },
        { name: "KNOWN", value: 3, isConstant: true, valueText: "3", type: "uint8" },
        {
          name: "position_covariance_type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description:
            "If `position_covariance` is available, `position_covariance_type` must be set to indicate the type of covariance.",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Log",
    {
      name: "foxglove_msgs/Log",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of log message",
        },
        { name: "UNKNOWN", value: 0, isConstant: true, valueText: "0", type: "uint8" },
        { name: "DEBUG", value: 1, isConstant: true, valueText: "1", type: "uint8" },
        { name: "INFO", value: 2, isConstant: true, valueText: "2", type: "uint8" },
        { name: "WARNING", value: 3, isConstant: true, valueText: "3", type: "uint8" },
        { name: "ERROR", value: 4, isConstant: true, valueText: "4", type: "uint8" },
        { name: "FATAL", value: 5, isConstant: true, valueText: "5", type: "uint8" },
        {
          name: "level",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description: "Log level",
        },
        {
          name: "message",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Log message",
        },
        {
          name: "name",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Process or node name",
        },
        { name: "file", type: "string", isComplex: false, isArray: false, description: "Filename" },
        {
          name: "line",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Line number in the file",
        },
      ],
    },
  ],
  [
    "foxglove.Log",
    {
      name: "foxglove.Log",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of log message",
        },
        { name: "UNKNOWN", value: 0, isConstant: true, valueText: "0", type: "uint8" },
        { name: "DEBUG", value: 1, isConstant: true, valueText: "1", type: "uint8" },
        { name: "INFO", value: 2, isConstant: true, valueText: "2", type: "uint8" },
        { name: "WARNING", value: 3, isConstant: true, valueText: "3", type: "uint8" },
        { name: "ERROR", value: 4, isConstant: true, valueText: "4", type: "uint8" },
        { name: "FATAL", value: 5, isConstant: true, valueText: "5", type: "uint8" },
        {
          name: "level",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description: "Log level",
        },
        {
          name: "message",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Log message",
        },
        {
          name: "name",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Process or node name",
        },
        { name: "file", type: "string", isComplex: false, isArray: false, description: "Filename" },
        {
          name: "line",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Line number in the file",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/SceneEntityDeletion",
    {
      name: "foxglove_msgs/SceneEntityDeletion",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description:
            "Timestamp of the deletion. Only matching entities earlier than this timestamp will be deleted.",
        },
        {
          name: "MATCHING_ID",
          value: 0,
          isConstant: true,
          valueText: "0",
          type: "uint8",
          description: "Delete the existing entity on the same topic that has the provided `id`",
        },
        {
          name: "ALL",
          value: 1,
          isConstant: true,
          valueText: "1",
          type: "uint8",
          description: "Delete all existing entities on the same topic",
        },
        {
          name: "type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description: "Type of deletion action to perform",
        },
        {
          name: "id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Identifier which must match if `type` is `MATCHING_ID`.",
        },
      ],
    },
  ],
  [
    "foxglove.SceneEntityDeletion",
    {
      name: "foxglove.SceneEntityDeletion",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description:
            "Timestamp of the deletion. Only matching entities earlier than this timestamp will be deleted.",
        },
        {
          name: "MATCHING_ID",
          value: 0,
          isConstant: true,
          valueText: "0",
          type: "uint8",
          description: "Delete the existing entity on the same topic that has the provided `id`",
        },
        {
          name: "ALL",
          value: 1,
          isConstant: true,
          valueText: "1",
          type: "uint8",
          description: "Delete all existing entities on the same topic",
        },
        {
          name: "type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description: "Type of deletion action to perform",
        },
        {
          name: "id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Identifier which must match if `type` is `MATCHING_ID`.",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/SceneEntity",
    {
      name: "foxglove_msgs/SceneEntity",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of the entity",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference",
        },
        {
          name: "id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Identifier for the entity. A entity will replace any prior entity on the same topic with the same `id`.",
        },
        {
          name: "lifetime",
          type: "duration",
          isComplex: false,
          isArray: false,
          description:
            "Length of time (relative to `timestamp`) after which the entity should be automatically removed. Zero value indicates the entity should remain visible until it is replaced or deleted.",
        },
        {
          name: "frame_locked",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Whether the entity should keep its location in the fixed frame (false) or follow the frame specified in `frame_id` as it moves relative to the fixed frame (true)",
        },
        {
          name: "metadata",
          type: "foxglove_msgs/KeyValuePair",
          isComplex: true,
          isArray: true,
          description:
            "Additional user-provided metadata associated with the entity. Keys must be unique.",
        },
        {
          name: "arrows",
          type: "foxglove_msgs/ArrowPrimitive",
          isComplex: true,
          isArray: true,
          description: "Arrow primitives",
        },
        {
          name: "cubes",
          type: "foxglove_msgs/CubePrimitive",
          isComplex: true,
          isArray: true,
          description: "Cube primitives",
        },
        {
          name: "spheres",
          type: "foxglove_msgs/SpherePrimitive",
          isComplex: true,
          isArray: true,
          description: "Sphere primitives",
        },
        {
          name: "cylinders",
          type: "foxglove_msgs/CylinderPrimitive",
          isComplex: true,
          isArray: true,
          description: "Cylinder primitives",
        },
        {
          name: "lines",
          type: "foxglove_msgs/LinePrimitive",
          isComplex: true,
          isArray: true,
          description: "Line primitives",
        },
        {
          name: "triangles",
          type: "foxglove_msgs/TriangleListPrimitive",
          isComplex: true,
          isArray: true,
          description: "Triangle list primitives",
        },
        {
          name: "texts",
          type: "foxglove_msgs/TextPrimitive",
          isComplex: true,
          isArray: true,
          description: "Text primitives",
        },
        {
          name: "models",
          type: "foxglove_msgs/ModelPrimitive",
          isComplex: true,
          isArray: true,
          description: "Model primitives",
        },
      ],
    },
  ],
  [
    "foxglove.SceneEntity",
    {
      name: "foxglove.SceneEntity",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of the entity",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference",
        },
        {
          name: "id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Identifier for the entity. A entity will replace any prior entity on the same topic with the same `id`.",
        },
        {
          name: "lifetime",
          type: "duration",
          isComplex: false,
          isArray: false,
          description:
            "Length of time (relative to `timestamp`) after which the entity should be automatically removed. Zero value indicates the entity should remain visible until it is replaced or deleted.",
        },
        {
          name: "frame_locked",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Whether the entity should keep its location in the fixed frame (false) or follow the frame specified in `frame_id` as it moves relative to the fixed frame (true)",
        },
        {
          name: "metadata",
          type: "foxglove_msgs/KeyValuePair",
          isComplex: true,
          isArray: true,
          description:
            "Additional user-provided metadata associated with the entity. Keys must be unique.",
        },
        {
          name: "arrows",
          type: "foxglove_msgs/ArrowPrimitive",
          isComplex: true,
          isArray: true,
          description: "Arrow primitives",
        },
        {
          name: "cubes",
          type: "foxglove_msgs/CubePrimitive",
          isComplex: true,
          isArray: true,
          description: "Cube primitives",
        },
        {
          name: "spheres",
          type: "foxglove_msgs/SpherePrimitive",
          isComplex: true,
          isArray: true,
          description: "Sphere primitives",
        },
        {
          name: "cylinders",
          type: "foxglove_msgs/CylinderPrimitive",
          isComplex: true,
          isArray: true,
          description: "Cylinder primitives",
        },
        {
          name: "lines",
          type: "foxglove_msgs/LinePrimitive",
          isComplex: true,
          isArray: true,
          description: "Line primitives",
        },
        {
          name: "triangles",
          type: "foxglove_msgs/TriangleListPrimitive",
          isComplex: true,
          isArray: true,
          description: "Triangle list primitives",
        },
        {
          name: "texts",
          type: "foxglove_msgs/TextPrimitive",
          isComplex: true,
          isArray: true,
          description: "Text primitives",
        },
        {
          name: "models",
          type: "foxglove_msgs/ModelPrimitive",
          isComplex: true,
          isArray: true,
          description: "Model primitives",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/SceneUpdate",
    {
      name: "foxglove_msgs/SceneUpdate",
      definitions: [
        {
          name: "deletions",
          type: "foxglove_msgs/SceneEntityDeletion",
          isComplex: true,
          isArray: true,
          description: "Scene entities to delete",
        },
        {
          name: "entities",
          type: "foxglove_msgs/SceneEntity",
          isComplex: true,
          isArray: true,
          description: "Scene entities to add or replace",
        },
      ],
    },
  ],
  [
    "foxglove.SceneUpdate",
    {
      name: "foxglove.SceneUpdate",
      definitions: [
        {
          name: "deletions",
          type: "foxglove_msgs/SceneEntityDeletion",
          isComplex: true,
          isArray: true,
          description: "Scene entities to delete",
        },
        {
          name: "entities",
          type: "foxglove_msgs/SceneEntity",
          isComplex: true,
          isArray: true,
          description: "Scene entities to add or replace",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/ModelPrimitive",
    {
      name: "foxglove_msgs/ModelPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Origin of model relative to reference frame",
        },
        {
          name: "scale",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Scale factor to apply to the model along each axis",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Solid color to use for the whole model if `override_color` is true.",
        },
        {
          name: "override_color",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Whether to use the color specified in `color` instead of any materials embedded in the original model.",
        },
        {
          name: "url",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "URL pointing to model file. One of `url` or `data` should be provided.",
        },
        {
          name: "media_type",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "[Media type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of embedded model (e.g. `model/gltf-binary`). Required if `data` is provided instead of `url`. Overrides the inferred media type if `url` is provided.",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description:
            "Embedded model. One of `url` or `data` should be provided. If `data` is provided, `media_type` must be set to indicate the type of the data.",
        },
      ],
    },
  ],
  [
    "foxglove.ModelPrimitive",
    {
      name: "foxglove.ModelPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Origin of model relative to reference frame",
        },
        {
          name: "scale",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Scale factor to apply to the model along each axis",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Solid color to use for the whole model if `override_color` is true.",
        },
        {
          name: "override_color",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Whether to use the color specified in `color` instead of any materials embedded in the original model.",
        },
        {
          name: "url",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "URL pointing to model file. One of `url` or `data` should be provided.",
        },
        {
          name: "media_type",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "[Media type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of embedded model (e.g. `model/gltf-binary`). Required if `data` is provided instead of `url`. Overrides the inferred media type if `url` is provided.",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description:
            "Embedded model. One of `url` or `data` should be provided. If `data` is provided, `media_type` must be set to indicate the type of the data.",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/PackedElementField",
    {
      name: "foxglove_msgs/PackedElementField",
      definitions: [
        {
          name: "name",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Name of the field",
        },
        {
          name: "offset",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Byte offset from start of data buffer",
        },
        { name: "UNKNOWN", value: 0, isConstant: true, valueText: "0", type: "uint8" },
        { name: "UINT8", value: 1, isConstant: true, valueText: "1", type: "uint8" },
        { name: "INT8", value: 2, isConstant: true, valueText: "2", type: "uint8" },
        { name: "UINT16", value: 3, isConstant: true, valueText: "3", type: "uint8" },
        { name: "INT16", value: 4, isConstant: true, valueText: "4", type: "uint8" },
        { name: "UINT32", value: 5, isConstant: true, valueText: "5", type: "uint8" },
        { name: "INT32", value: 6, isConstant: true, valueText: "6", type: "uint8" },
        { name: "FLOAT32", value: 7, isConstant: true, valueText: "7", type: "uint8" },
        { name: "FLOAT64", value: 8, isConstant: true, valueText: "8", type: "uint8" },
        {
          name: "type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description:
            "Type of data in the field. Integers are stored using little-endian byte order.",
        },
      ],
    },
  ],
  [
    "foxglove.PackedElementField",
    {
      name: "foxglove.PackedElementField",
      definitions: [
        {
          name: "name",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Name of the field",
        },
        {
          name: "offset",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Byte offset from start of data buffer",
        },
        { name: "UNKNOWN", value: 0, isConstant: true, valueText: "0", type: "uint8" },
        { name: "UINT8", value: 1, isConstant: true, valueText: "1", type: "uint8" },
        { name: "INT8", value: 2, isConstant: true, valueText: "2", type: "uint8" },
        { name: "UINT16", value: 3, isConstant: true, valueText: "3", type: "uint8" },
        { name: "INT16", value: 4, isConstant: true, valueText: "4", type: "uint8" },
        { name: "UINT32", value: 5, isConstant: true, valueText: "5", type: "uint8" },
        { name: "INT32", value: 6, isConstant: true, valueText: "6", type: "uint8" },
        { name: "FLOAT32", value: 7, isConstant: true, valueText: "7", type: "uint8" },
        { name: "FLOAT64", value: 8, isConstant: true, valueText: "8", type: "uint8" },
        {
          name: "type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description:
            "Type of data in the field. Integers are stored using little-endian byte order.",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Point2",
    {
      name: "foxglove_msgs/Point2",
      definitions: [
        {
          name: "x",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "x coordinate position",
        },
        {
          name: "y",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "y coordinate position",
        },
      ],
    },
  ],
  [
    "foxglove.Point2",
    {
      name: "foxglove.Point2",
      definitions: [
        {
          name: "x",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "x coordinate position",
        },
        {
          name: "y",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "y coordinate position",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Point3",
    {
      name: "foxglove_msgs/Point3",
      definitions: [
        {
          name: "x",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "x coordinate position",
        },
        {
          name: "y",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "y coordinate position",
        },
        {
          name: "z",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "z coordinate position",
        },
      ],
    },
  ],
  [
    "foxglove.Point3",
    {
      name: "foxglove.Point3",
      definitions: [
        {
          name: "x",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "x coordinate position",
        },
        {
          name: "y",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "y coordinate position",
        },
        {
          name: "z",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "z coordinate position",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/PointCloud",
    {
      name: "foxglove_msgs/PointCloud",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of point cloud",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "The origin of the point cloud relative to the frame of reference",
        },
        {
          name: "point_stride",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Number of bytes between points in the `data`",
        },
        {
          name: "fields",
          type: "foxglove_msgs/PackedElementField",
          isComplex: true,
          isArray: true,
          description:
            "Fields in `data`. At least 2 coordinate fields from `x`, `y`, and `z` are required for each point's position; `red`, `green`, `blue`, and `alpha` are optional for customizing each point's color.",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description: "Point data, interpreted using `fields`",
        },
      ],
    },
  ],
  [
    "foxglove.PointCloud",
    {
      name: "foxglove.PointCloud",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of point cloud",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "The origin of the point cloud relative to the frame of reference",
        },
        {
          name: "point_stride",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Number of bytes between points in the `data`",
        },
        {
          name: "fields",
          type: "foxglove_msgs/PackedElementField",
          isComplex: true,
          isArray: true,
          description:
            "Fields in `data`. At least 2 coordinate fields from `x`, `y`, and `z` are required for each point's position; `red`, `green`, `blue`, and `alpha` are optional for customizing each point's color.",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description: "Point data, interpreted using `fields`",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/PointsAnnotation",
    {
      name: "foxglove_msgs/PointsAnnotation",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of annotation",
        },
        { name: "UNKNOWN", value: 0, isConstant: true, valueText: "0", type: "uint8" },
        {
          name: "POINTS",
          value: 1,
          isConstant: true,
          valueText: "1",
          type: "uint8",
          description: "Individual points: 0, 1, 2, ...",
        },
        {
          name: "LINE_LOOP",
          value: 2,
          isConstant: true,
          valueText: "2",
          type: "uint8",
          description: "Closed polygon: 0-1, 1-2, ..., (n-1)-n, n-0",
        },
        {
          name: "LINE_STRIP",
          value: 3,
          isConstant: true,
          valueText: "3",
          type: "uint8",
          description: "Connected line segments: 0-1, 1-2, ..., (n-1)-n",
        },
        {
          name: "LINE_LIST",
          value: 4,
          isConstant: true,
          valueText: "4",
          type: "uint8",
          description: "Individual line segments: 0-1, 2-3, 4-5, ...",
        },
        {
          name: "type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description: "Type of points annotation to draw",
        },
        {
          name: "points",
          type: "foxglove_msgs/Point2",
          isComplex: true,
          isArray: true,
          description: "Points in 2D image coordinates (pixels)",
        },
        {
          name: "outline_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Outline color",
        },
        {
          name: "outline_colors",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: true,
          description:
            "Per-point colors, if `type` is `POINTS`, or per-segment stroke colors, if `type` is `LINE_LIST`.",
        },
        {
          name: "fill_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Fill color",
        },
        {
          name: "thickness",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Stroke thickness in pixels",
        },
      ],
    },
  ],
  [
    "foxglove.PointsAnnotation",
    {
      name: "foxglove.PointsAnnotation",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of annotation",
        },
        { name: "UNKNOWN", value: 0, isConstant: true, valueText: "0", type: "uint8" },
        {
          name: "POINTS",
          value: 1,
          isConstant: true,
          valueText: "1",
          type: "uint8",
          description: "Individual points: 0, 1, 2, ...",
        },
        {
          name: "LINE_LOOP",
          value: 2,
          isConstant: true,
          valueText: "2",
          type: "uint8",
          description: "Closed polygon: 0-1, 1-2, ..., (n-1)-n, n-0",
        },
        {
          name: "LINE_STRIP",
          value: 3,
          isConstant: true,
          valueText: "3",
          type: "uint8",
          description: "Connected line segments: 0-1, 1-2, ..., (n-1)-n",
        },
        {
          name: "LINE_LIST",
          value: 4,
          isConstant: true,
          valueText: "4",
          type: "uint8",
          description: "Individual line segments: 0-1, 2-3, 4-5, ...",
        },
        {
          name: "type",
          type: "uint8",
          isComplex: false,
          isArray: false,
          description: "Type of points annotation to draw",
        },
        {
          name: "points",
          type: "foxglove_msgs/Point2",
          isComplex: true,
          isArray: true,
          description: "Points in 2D image coordinates (pixels)",
        },
        {
          name: "outline_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Outline color",
        },
        {
          name: "outline_colors",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: true,
          description:
            "Per-point colors, if `type` is `POINTS`, or per-segment stroke colors, if `type` is `LINE_LIST`.",
        },
        {
          name: "fill_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Fill color",
        },
        {
          name: "thickness",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Stroke thickness in pixels",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Pose",
    {
      name: "foxglove_msgs/Pose",
      definitions: [
        {
          name: "position",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Point denoting position in 3D space",
        },
        {
          name: "orientation",
          type: "geometry_msgs/Quaternion",
          isComplex: true,
          isArray: false,
          description: "Quaternion denoting orientation in 3D space",
        },
      ],
    },
  ],
  [
    "foxglove.Pose",
    {
      name: "foxglove.Pose",
      definitions: [
        {
          name: "position",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Point denoting position in 3D space",
        },
        {
          name: "orientation",
          type: "geometry_msgs/Quaternion",
          isComplex: true,
          isArray: false,
          description: "Quaternion denoting orientation in 3D space",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/PoseInFrame",
    {
      name: "foxglove_msgs/PoseInFrame",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of pose",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference for pose position and orientation",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Pose in 3D space",
        },
      ],
    },
  ],
  [
    "foxglove.PoseInFrame",
    {
      name: "foxglove.PoseInFrame",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of pose",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference for pose position and orientation",
        },
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Pose in 3D space",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/PosesInFrame",
    {
      name: "foxglove_msgs/PosesInFrame",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of pose",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference for pose position and orientation",
        },
        {
          name: "poses",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: true,
          description: "Poses in 3D space",
        },
      ],
    },
  ],
  [
    "foxglove.PosesInFrame",
    {
      name: "foxglove.PosesInFrame",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of pose",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Frame of reference for pose position and orientation",
        },
        {
          name: "poses",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: true,
          description: "Poses in 3D space",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Quaternion",
    {
      name: "foxglove_msgs/Quaternion",
      definitions: [
        { name: "x", type: "float64", isComplex: false, isArray: false, description: "x value" },
        { name: "y", type: "float64", isComplex: false, isArray: false, description: "y value" },
        { name: "z", type: "float64", isComplex: false, isArray: false, description: "z value" },
        { name: "w", type: "float64", isComplex: false, isArray: false, description: "w value" },
      ],
    },
  ],
  [
    "foxglove.Quaternion",
    {
      name: "foxglove.Quaternion",
      definitions: [
        { name: "x", type: "float64", isComplex: false, isArray: false, description: "x value" },
        { name: "y", type: "float64", isComplex: false, isArray: false, description: "y value" },
        { name: "z", type: "float64", isComplex: false, isArray: false, description: "z value" },
        { name: "w", type: "float64", isComplex: false, isArray: false, description: "w value" },
      ],
    },
  ],
  [
    "foxglove_msgs/RawImage",
    {
      name: "foxglove_msgs/RawImage",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of image",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Frame of reference for the image. The origin of the frame is the optical center of the camera. +x points to the right in the image, +y points down, and +z points into the plane of the image.",
        },
        {
          name: "width",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Image width",
        },
        {
          name: "height",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Image height",
        },
        {
          name: "encoding",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Encoding of the raw image data\n\nSupported values: `8UC1`, `8UC3`, `16UC1`, `32FC1`, `bayer_bggr8`, `bayer_gbrg8`, `bayer_grbg8`, `bayer_rggb8`, `bgr8`, `bgra8`, `mono8`, `mono16`, `rgb8`, `rgba8`, `uyvy` or `yuv422`, `yuyv` or `yuv422_yuy2`",
        },
        {
          name: "step",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Byte length of a single row",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description: "Raw image data",
        },
      ],
    },
  ],
  [
    "foxglove.RawImage",
    {
      name: "foxglove.RawImage",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of image",
        },
        {
          name: "frame_id",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Frame of reference for the image. The origin of the frame is the optical center of the camera. +x points to the right in the image, +y points down, and +z points into the plane of the image.",
        },
        {
          name: "width",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Image width",
        },
        {
          name: "height",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Image height",
        },
        {
          name: "encoding",
          type: "string",
          isComplex: false,
          isArray: false,
          description:
            "Encoding of the raw image data\n\nSupported values: `8UC1`, `8UC3`, `16UC1`, `32FC1`, `bayer_bggr8`, `bayer_gbrg8`, `bayer_grbg8`, `bayer_rggb8`, `bgr8`, `bgra8`, `mono8`, `mono16`, `rgb8`, `rgba8`, `uyvy` or `yuv422`, `yuyv` or `yuv422_yuy2`",
        },
        {
          name: "step",
          type: "uint32",
          isComplex: false,
          isArray: false,
          description: "Byte length of a single row",
        },
        {
          name: "data",
          type: "uint8",
          isComplex: false,
          isArray: true,
          description: "Raw image data",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/SpherePrimitive",
    {
      name: "foxglove_msgs/SpherePrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Position of the center of the sphere and orientation of the sphere",
        },
        {
          name: "size",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Size (diameter) of the sphere along each axis",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the sphere",
        },
      ],
    },
  ],
  [
    "foxglove.SpherePrimitive",
    {
      name: "foxglove.SpherePrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Position of the center of the sphere and orientation of the sphere",
        },
        {
          name: "size",
          type: "geometry_msgs/Vector3",
          isComplex: true,
          isArray: false,
          description: "Size (diameter) of the sphere along each axis",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the sphere",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/TextAnnotation",
    {
      name: "foxglove_msgs/TextAnnotation",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of annotation",
        },
        {
          name: "position",
          type: "foxglove_msgs/Point2",
          isComplex: true,
          isArray: false,
          description: "Bottom-left origin of the text label in 2D image coordinates (pixels)",
        },
        {
          name: "text",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Text to display",
        },
        {
          name: "font_size",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Font size in pixels",
        },
        {
          name: "text_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Text color",
        },
        {
          name: "background_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Background fill color",
        },
      ],
    },
  ],
  [
    "foxglove.TextAnnotation",
    {
      name: "foxglove.TextAnnotation",
      definitions: [
        {
          name: "timestamp",
          type: "time",
          isComplex: false,
          isArray: false,
          description: "Timestamp of annotation",
        },
        {
          name: "position",
          type: "foxglove_msgs/Point2",
          isComplex: true,
          isArray: false,
          description: "Bottom-left origin of the text label in 2D image coordinates (pixels)",
        },
        {
          name: "text",
          type: "string",
          isComplex: false,
          isArray: false,
          description: "Text to display",
        },
        {
          name: "font_size",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Font size in pixels",
        },
        {
          name: "text_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Text color",
        },
        {
          name: "background_color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Background fill color",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/TextPrimitive",
    {
      name: "foxglove_msgs/TextPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Position of the center of the text box and orientation of the text. Identity orientation means the text is oriented in the xy-plane and flows from -x to +x.",
        },
        {
          name: "billboard",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Whether the text should respect `pose.orientation` (false) or always face the camera (true)",
        },
        {
          name: "font_size",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Font size (height of one line of text)",
        },
        {
          name: "scale_invariant",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Indicates whether `font_size` is a fixed size in screen pixels (true), or specified in world coordinates and scales with distance from the camera (false)",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the text",
        },
        { name: "text", type: "string", isComplex: false, isArray: false, description: "Text" },
      ],
    },
  ],
  [
    "foxglove.TextPrimitive",
    {
      name: "foxglove.TextPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description:
            "Position of the center of the text box and orientation of the text. Identity orientation means the text is oriented in the xy-plane and flows from -x to +x.",
        },
        {
          name: "billboard",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Whether the text should respect `pose.orientation` (false) or always face the camera (true)",
        },
        {
          name: "font_size",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "Font size (height of one line of text)",
        },
        {
          name: "scale_invariant",
          type: "bool",
          isComplex: false,
          isArray: false,
          description:
            "Indicates whether `font_size` is a fixed size in screen pixels (true), or specified in world coordinates and scales with distance from the camera (false)",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description: "Color of the text",
        },
        { name: "text", type: "string", isComplex: false, isArray: false, description: "Text" },
      ],
    },
  ],
  [
    "foxglove_msgs/TriangleListPrimitive",
    {
      name: "foxglove_msgs/TriangleListPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Origin of triangles relative to reference frame",
        },
        {
          name: "points",
          type: "geometry_msgs/Point",
          isComplex: true,
          isArray: true,
          description:
            "Vertices to use for triangles, interpreted as a list of triples (0-1-2, 3-4-5, ...)",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description:
            "Solid color to use for the whole shape. One of `color` or `colors` must be provided.",
        },
        {
          name: "colors",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: true,
          description:
            "Per-vertex colors (if specified, must have the same length as `points`). One of `color` or `colors` must be provided.",
        },
        {
          name: "indices",
          type: "uint32",
          isComplex: false,
          isArray: true,
          description:
            "Indices into the `points` and `colors` attribute arrays, which can be used to avoid duplicating attribute data.\n\nIf omitted or empty, indexing will not be used. This default behavior is equivalent to specifying [0, 1, ..., N-1] for the indices (where N is the number of `points` provided).",
        },
      ],
    },
  ],
  [
    "foxglove.TriangleListPrimitive",
    {
      name: "foxglove.TriangleListPrimitive",
      definitions: [
        {
          name: "pose",
          type: "geometry_msgs/Pose",
          isComplex: true,
          isArray: false,
          description: "Origin of triangles relative to reference frame",
        },
        {
          name: "points",
          type: "geometry_msgs/Point",
          isComplex: true,
          isArray: true,
          description:
            "Vertices to use for triangles, interpreted as a list of triples (0-1-2, 3-4-5, ...)",
        },
        {
          name: "color",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: false,
          description:
            "Solid color to use for the whole shape. One of `color` or `colors` must be provided.",
        },
        {
          name: "colors",
          type: "foxglove_msgs/Color",
          isComplex: true,
          isArray: true,
          description:
            "Per-vertex colors (if specified, must have the same length as `points`). One of `color` or `colors` must be provided.",
        },
        {
          name: "indices",
          type: "uint32",
          isComplex: false,
          isArray: true,
          description:
            "Indices into the `points` and `colors` attribute arrays, which can be used to avoid duplicating attribute data.\n\nIf omitted or empty, indexing will not be used. This default behavior is equivalent to specifying [0, 1, ..., N-1] for the indices (where N is the number of `points` provided).",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Vector2",
    {
      name: "foxglove_msgs/Vector2",
      definitions: [
        {
          name: "x",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "x coordinate length",
        },
        {
          name: "y",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "y coordinate length",
        },
      ],
    },
  ],
  [
    "foxglove.Vector2",
    {
      name: "foxglove.Vector2",
      definitions: [
        {
          name: "x",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "x coordinate length",
        },
        {
          name: "y",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "y coordinate length",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/Vector3",
    {
      name: "foxglove_msgs/Vector3",
      definitions: [
        {
          name: "x",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "x coordinate length",
        },
        {
          name: "y",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "y coordinate length",
        },
        {
          name: "z",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "z coordinate length",
        },
      ],
    },
  ],
  [
    "foxglove.Vector3",
    {
      name: "foxglove.Vector3",
      definitions: [
        {
          name: "x",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "x coordinate length",
        },
        {
          name: "y",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "y coordinate length",
        },
        {
          name: "z",
          type: "float64",
          isComplex: false,
          isArray: false,
          description: "z coordinate length",
        },
      ],
    },
  ],
  [
    "foxglove_msgs/ImageMarkerArray",
    {
      definitions: [
        { type: "visualization_msgs/ImageMarker", isArray: true, name: "markers", isComplex: true },
      ],
    },
  ],
]);
