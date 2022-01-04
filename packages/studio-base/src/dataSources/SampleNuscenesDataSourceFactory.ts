// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  IDataSourceFactory,
  DataSourceFactoryInitializeArgs,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import RandomAccessPlayer from "@foxglove/studio-base/players/RandomAccessPlayer";
import Ros1MemoryCacheDataProvider from "@foxglove/studio-base/randomAccessDataProviders/Ros1MemoryCacheDataProvider";
import WorkerBagDataProvider from "@foxglove/studio-base/randomAccessDataProviders/WorkerBagDataProvider";
import { getSeekToTime } from "@foxglove/studio-base/util/time";

class SampleNuscenesDataSourceFactory implements IDataSourceFactory {
  id = "sample-nuscenes";
  type: IDataSourceFactory["type"] = "sample";
  displayName = "Sample: Nuscenes";
  iconName: IDataSourceFactory["iconName"] = "FileASPX";
  hidden = true;

  sampleLayout: IDataSourceFactory["sampleLayout"] = {
    configById: {
      "ImageViewPanel!1r5tdvh": {
        cameraTopic: "/CAM_FRONT_LEFT/image_rect_compressed",
        enabledMarkerTopics: [
          "/CAM_FRONT_LEFT/image_markers_annotations",
          "/CAM_FRONT_LEFT/image_markers_lidar",
        ],
        customMarkerTopicOptions: [],
        transformMarkers: false,
        synchronize: false,
        mode: "fit",
        zoom: 1.467091317737759,
        pan: {
          x: -18.766339672385854,
          y: 3.9962119425323834,
        },
      },
      "ImageViewPanel!15kmj7r": {
        cameraTopic: "/CAM_FRONT/image_rect_compressed",
        enabledMarkerTopics: [
          "/CAM_FRONT/image_markers_annotations",
          "/CAM_FRONT/image_markers_lidar",
        ],
        customMarkerTopicOptions: [],
        transformMarkers: false,
        synchronize: false,
        mode: "fit",
        zoom: 1.1281780995019715,
        pan: {
          x: 9.510604159161662,
          y: -4.4608086865532295,
        },
      },
      "ImageViewPanel!1jn49st": {
        cameraTopic: "/CAM_FRONT_RIGHT/image_rect_compressed",
        enabledMarkerTopics: [
          "/CAM_FRONT_RIGHT/image_markers_annotations",
          "/CAM_FRONT_RIGHT/image_markers_lidar",
        ],
        customMarkerTopicOptions: [],
        transformMarkers: false,
        synchronize: false,
        mode: "fit",
        zoom: 1.397125784786731,
        pan: {
          x: 33.01238310720072,
          y: -0.04121223476559699,
        },
      },
      "ImageViewPanel!1aws3fn": {
        cameraTopic: "/CAM_BACK_RIGHT/image_rect_compressed",
        enabledMarkerTopics: [
          "/CAM_BACK_RIGHT/image_markers_annotations",
          "/CAM_BACK_RIGHT/image_markers_lidar",
        ],
        customMarkerTopicOptions: [],
        transformMarkers: false,
        synchronize: false,
        mode: "fit",
        zoom: 1.5682162885365147,
        pan: {
          x: -66.28845425754514,
          y: -3.3957787232336063,
        },
      },
      "ImageViewPanel!41uf7ue": {
        cameraTopic: "/CAM_BACK/image_rect_compressed",
        enabledMarkerTopics: [
          "/CAM_BACK/image_markers_annotations",
          "/CAM_BACK/image_markers_lidar",
        ],
        customMarkerTopicOptions: [],
        transformMarkers: false,
        synchronize: false,
        mode: "fit",
        zoom: 1.105727355321881,
        pan: {
          x: -0.3391766147215005,
          y: 2.5374565277251424,
        },
      },
      "ImageViewPanel!12q54st": {
        cameraTopic: "/CAM_BACK_LEFT/image_rect_compressed",
        enabledMarkerTopics: [
          "/CAM_BACK_LEFT/image_markers_annotations",
          "/CAM_BACK_LEFT/image_markers_lidar",
        ],
        customMarkerTopicOptions: [],
        transformMarkers: false,
        synchronize: false,
        mode: "fit",
        zoom: 1.4090960094122935,
        pan: {
          x: 62.15906795764468,
          y: 5.818192018824586,
        },
      },
      "3D Panel!3bempa7": {
        checkedKeys: [
          "name:Topics",
          "t:/tf",
          "ns:/tf:CAM_FRONT",
          "ns:/tf:CAM_BACK",
          "t:/map",
          "t:/LIDAR_TOP",
          "t:/markers/annotations",
        ],
        expandedKeys: ["name:Topics", "t:/tf"],
        followMode: "follow",
        cameraState: {
          distance: 6.607395635353808,
          perspective: true,
          phi: 1.3081824565300704,
          targetOffset: [7.754356358745841, -0.14215463076571247, 0],
          thetaOffset: 1.5943902835924675,
          fovy: 0.7853981633974483,
          near: 0.01,
          far: 5000,
        },
        modifiedNamespaceTopics: ["/tf"],
        pinTopics: false,
        settingsByKey: {},
        autoSyncCameraState: false,
        autoTextBackgroundColor: true,
        diffModeEnabled: true,
        useThemeBackgroundColor: true,
        customBackgroundColor: "#000000",
      },
      "map!2vkib4e": {
        disabledTopics: [],
        zoomLevel: 17,
      },
      "3D Panel!4ey2b8s": {
        checkedKeys: [
          "name:Topics",
          "t:/tf",
          "t:/markers/annotations",
          "t:/pose",
          "ns:/tf:base_link",
          "t:/map",
          "t:/semantic_map",
          "t:/drivable_area",
          "t:/LIDAR_TOP",
          "t:/RADAR_FRONT",
          "t:/RADAR_FRONT_LEFT",
          "t:/RADAR_FRONT_RIGHT",
          "t:/RADAR_BACK_LEFT",
          "t:/RADAR_BACK_RIGHT",
        ],
        expandedKeys: ["name:Topics", "t:/tf"],
        followTf: "base_link",
        followOrientation: false,
        cameraState: {
          distance: 111.93497850814407,
          perspective: false,
          phi: 0.03891070297656745,
          targetOffset: [1.9192625259993057, -0.5920387880285412, 0],
          thetaOffset: -4.486440525404362,
          fovy: 0.7853981633974483,
          near: 0.01,
          far: 5000,
        },
        modifiedNamespaceTopics: ["/tf"],
        pinTopics: false,
        settingsByKey: {},
        autoSyncCameraState: false,
        autoTextBackgroundColor: true,
        diffModeEnabled: true,
        useThemeBackgroundColor: true,
        customBackgroundColor: "#000000",
        followMode: "follow",
      },
      "Plot!2pb7zl7": {
        paths: [
          {
            value: "/imu.linear_acceleration.x",
            enabled: true,
            timestampMethod: "receiveTime",
          },
          {
            value: '/diagnostics.status[:].values[:]{key=="throttle_sensor"}.value',
            enabled: true,
            timestampMethod: "receiveTime",
          },
        ],
        minYValue: "",
        maxYValue: "",
        showLegend: true,
        isSynced: true,
        xAxisVal: "timestamp",
      },
      "Plot!4792hqu": {
        paths: [
          {
            value: '/diagnostics.status[:].values[:]{key=="FL_wheel_speed"}.value',
            enabled: true,
            timestampMethod: "receiveTime",
          },
          {
            value: '/diagnostics.status[:].values[:]{key=="FR_wheel_speed"}.value',
            enabled: true,
            timestampMethod: "receiveTime",
          },
          {
            value: '/diagnostics.status[:].values[:]{key=="RL_wheel_speed"}.value',
            enabled: true,
            timestampMethod: "receiveTime",
          },
          {
            value: '/diagnostics.status[:].values[:]{key=="RR_wheel_speed"}.value',
            enabled: true,
            timestampMethod: "receiveTime",
          },
        ],
        minYValue: "",
        maxYValue: "",
        showLegend: true,
        isSynced: true,
        xAxisVal: "timestamp",
      },
      "StateTransitions!3i4dk1l": {
        paths: [
          {
            value: '/diagnostics.status[:].values[:]{key=="brake_switch"}.value',
            timestampMethod: "receiveTime",
          },
        ],
      },
      "DiagnosticSummary!3equ26v": {
        minLevel: 0,
        pinnedIds: [],
        hardwareIdFilter: "",
        topicToRender: "/diagnostics",
        sortByLevel: true,
      },
      "DiagnosticStatusPanel!4bdyip2": {
        topicToRender: "/diagnostics",
        collapsedSections: [],
        selectedHardwareId: "",
        splitFraction: 0.49345370528837923,
      },
      "SourceInfo!7dc2bd": {},
      "RawMessages!21ab95j": {
        topicPath: "/markers/annotations.markers[:]{id==28114}",
        diffTopicPath: "",
        diffMethod: "custom",
        diffEnabled: false,
        showFullMessageForDiff: false,
      },
      "Tab!1xyw5ix": {
        activeTabIdx: 0,
        tabs: [
          {
            title: "Perception",
            layout: {
              first: {
                first: {
                  first: "ImageViewPanel!1r5tdvh",
                  second: {
                    first: "ImageViewPanel!15kmj7r",
                    second: "ImageViewPanel!1jn49st",
                    direction: "row",
                    splitPercentage: 58.02861685214624,
                  },
                  direction: "row",
                  splitPercentage: 28.95164136957289,
                },
                second: {
                  first: "ImageViewPanel!1aws3fn",
                  second: {
                    first: "ImageViewPanel!41uf7ue",
                    second: "ImageViewPanel!12q54st",
                    direction: "row",
                    splitPercentage: 58.02861685214624,
                  },
                  direction: "row",
                  splitPercentage: 28.95164136957289,
                },
                direction: "column",
              },
              second: "3D Panel!3bempa7",
              direction: "column",
              splitPercentage: 69.84126984126983,
            },
          },
          {
            title: "Planning",
            layout: {
              first: "map!2vkib4e",
              second: "3D Panel!4ey2b8s",
              direction: "row",
              splitPercentage: 30.4403832219628,
            },
          },
          {
            title: "Controls",
            layout: {
              first: "Plot!2pb7zl7",
              second: "Plot!4792hqu",
              direction: "column",
              splitPercentage: 50.3257328990228,
            },
          },
          {
            title: "Diagnostics",
            layout: {
              first: {
                first: {
                  first: "StateTransitions!3i4dk1l",
                  second: "DiagnosticSummary!3equ26v",
                  direction: "column",
                  splitPercentage: 44.927536231884055,
                },
                second: "DiagnosticStatusPanel!4bdyip2",
                direction: "column",
                splitPercentage: 40.828402366863905,
              },
              second: {
                first: "SourceInfo!7dc2bd",
                second: "RawMessages!21ab95j",
                direction: "column",
                splitPercentage: 59.81479888764657,
              },
              direction: "row",
              splitPercentage: 48.80750465900287,
            },
          },
        ],
      },
    },
    globalVariables: {},
    userNodes: {},
    linkedGlobalVariables: [],
    playbackConfig: {
      speed: 1,
      messageOrder: "receiveTime",
    },
    layout: "Tab!1xyw5ix",
  };

  initialize(args: DataSourceFactoryInitializeArgs): ReturnType<IDataSourceFactory["initialize"]> {
    const bagUrl =
      "https://storage.googleapis.com/foxglove-public-assets/nuScenes-v1.0-mini-scene-0061.bag";
    const bagWorkerDataProvider = new WorkerBagDataProvider({ type: "remote", url: bagUrl });
    const messageCacheProvider = new Ros1MemoryCacheDataProvider(bagWorkerDataProvider, {
      unlimitedCache: args.unlimitedMemoryCache,
    });

    return new RandomAccessPlayer(messageCacheProvider, {
      metricsCollector: args.metricsCollector,
      seekToTime: getSeekToTime(),
      name: "Sample: Nuscenes",
      // Use blank url params so the data source is set in the url
      urlParams: {},
    });
  }
}

export default SampleNuscenesDataSourceFactory;
