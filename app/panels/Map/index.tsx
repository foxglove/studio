// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Map as LeafMap } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

import {
  useBlocksByTopic,
  useDataSourceInfo,
  useMessagesByTopic,
} from "@foxglove-studio/app/PanelAPI";
import EmptyState from "@foxglove-studio/app/components/EmptyState";
import Panel from "@foxglove-studio/app/components/Panel";
import PanelToolbar from "@foxglove-studio/app/components/PanelToolbar";
import Logger from "@foxglove/log";

import FilteredPointMarkers from "./FilteredPointMarkers";
import { Point, PointCache } from "./types";

import "leaflet/dist/leaflet.css";

const log = Logger.getLogger(__filename);

// https://docs.ros.org/en/api/sensor_msgs/html/msg/NavSatFix.html

// persisted panel state
type Config = {
  zoomLevel?: number;
};

type Props = {
  config: Config;
  saveConfig: (config: Config) => void;
};

function MapPanel(props: Props) {
  const { saveConfig, config } = props;
  const topicCaches = useRef(new Map<string, PointCache>());
  const center = useRef<Point | undefined>();

  const { topics, playerId } = useDataSourceInfo();

  // clear cached points when the player changes
  useEffect(() => {
    center.current = undefined;
    topicCaches.current = new Map();
  }, [playerId]);

  // eligible topics are those that match the message datatypes we support
  const eligibleTopics = useMemo(() => {
    return topics
      .filter((topic) => {
        return topic.datatype === "sensor_msgs/NavSatFix";
      })
      .map((topic) => topic.name);
  }, [topics]);

  useEffect(() => {
    log.debug("Eligible Topics: ", eligibleTopics);
  }, [eligibleTopics]);

  const { blocks } = useBlocksByTopic(eligibleTopics);

  const navMessages = useMessagesByTopic({
    topics: eligibleTopics,
    historySize: 1,
  });

  useEffect(() => {
    for (const messageBlock of blocks) {
      for (const [topic, payloads] of Object.entries(messageBlock)) {
        let topicCache = topicCaches.current.get(topic);
        if (!topicCache) {
          topicCache = new Map();
          topicCaches.current.set(topic, topicCache);
        }

        for (const payload of payloads) {
          const stamp = payload.receiveTime.sec * 1e9 + payload.receiveTime.nsec;
          const lat = (payload.message as any).latitude();
          const lon = (payload.message as any).longitude();
          const point: Point = {
            lat,
            lon,
          };
          topicCache.set(stamp, point);
        }
      }
    }
  }, [blocks]);

  useEffect(() => {
    for (const [topic, payloads] of Object.entries(navMessages)) {
      let topicCache = topicCaches.current.get(topic);
      if (!topicCache) {
        topicCache = new Map();
        topicCaches.current.set(topic, topicCache);
      }

      for (const payload of payloads) {
        const stamp = payload.receiveTime.sec * 1e9 + payload.receiveTime.nsec;
        const point: Point = {
          lat: payload.message.latitude,
          lon: payload.message.longitude,
        };
        topicCache.set(stamp, point);

        if (!center.current) {
          center.current = point;
        }
      }
    }
  }, [navMessages]);

  const [currentMap, setCurrentMap] = useState<LeafMap | undefined>(undefined);

  // persist panel config on zoom changes
  useEffect(() => {
    if (!currentMap) {
      return;
    }

    const zoomChange = () => {
      saveConfig({
        zoomLevel: currentMap.getZoom(),
      });
    };

    currentMap.on("zoom", zoomChange);
    return () => {
      currentMap.off("zoom", zoomChange);
    };
  }, [currentMap, saveConfig]);

  if (!center.current) {
    return (
      <>
        <PanelToolbar floating />
        <EmptyState>Waiting for first gps point...</EmptyState>
      </>
    );
  }

  return (
    <>
      <PanelToolbar floating />
      <MapContainer
        whenCreated={setCurrentMap}
        preferCanvas
        style={{ width: "100%", height: "100%" }}
        center={[center.current.lat, center.current.lon]}
        zoom={config.zoomLevel ?? 15}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FilteredPointMarkers pointsByTopic={topicCaches} />
      </MapContainer>
    </>
  );
}

MapPanel.panelType = "map";
MapPanel.defaultConfig = {
  zoomLevel: 10,
} as Config;

export default Panel(MapPanel);
