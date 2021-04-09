// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, useMapEvent } from "react-leaflet";

import {
  useBlocksByTopic,
  useDataSourceInfo,
  useMessagesByTopic,
} from "@foxglove-studio/app/PanelAPI";
import EmptyState from "@foxglove-studio/app/components/EmptyState";
import Panel from "@foxglove-studio/app/components/Panel";
import Logger from "@foxglove/log";

import "leaflet/dist/leaflet.css";

const log = Logger.getLogger(__filename);

// https://docs.ros.org/en/api/sensor_msgs/html/msg/NavSatFix.html

type Point = {
  lat: number;
  lon: number;
};

// stamp -> point
type PointCache = Map<number, Point>;

type TopicTimePoint = {
  stamp: number;
  topic: string;
  lat: number;
  lon: number;
};

// renders circle markers for all topic/points excluding points at the same pixel
function FilteredPointMarkers(props: { pointsByTopic: Map<string, PointCache> }) {
  // cache bust when zoom changes and we should re-filter
  const [zoomChange, setZoomChange] = useState(0);

  const map = useMapEvent("zoom", () => {
    setZoomChange((old) => old + 1);
  });

  const { pointsByTopic } = props;
  const filtered = useMemo<TopicTimePoint[]>(() => {
    // to make exhaustive-deps lint check happy
    // we need to bust our filter when zoom changes
    zoomChange;

    const arr: TopicTimePoint[] = [];

    const ptSet = new Set<string>();
    for (const [topic, cache] of pointsByTopic) {
      for (const [stamp, point] of cache) {
        const pt = {
          topic,
          stamp,
          lat: point.lat,
          lon: point.lon,
        };
        const pixelPoint = map.latLngToContainerPoint([pt.lat, pt.lon]);

        const x = Math.trunc(pixelPoint.x);
        const y = Math.trunc(pixelPoint.y);
        const key = `${x},${y}`;

        if (ptSet.has(key)) {
          continue;
        }

        ptSet.add(key);
        arr.push(pt);
      }
    }
    return arr;
  }, [map, pointsByTopic, zoomChange]);

  // fixme - need to re-filter when data changes (pointsByTopic is stable right now for caching)
  // throttle the re-filter

  return (
    <>
      {filtered.map((topicPoint) => {
        return (
          <Circle
            key={`${topicPoint.topic}+${topicPoint.stamp}`}
            center={[topicPoint.lat, topicPoint.lon]}
            radius={0.1}
          />
        );
      })}
    </>
  );
}

function MapPanel() {
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

  // fixme - provide a way for the user to specify which topics to show/hide

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

  if (!center.current) {
    return <EmptyState>Waiting for first gps point...</EmptyState>;
  }

  // fixme - hide leaflet zoom icons and use our own

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        preferCanvas
        style={{ width: "100%", height: "100%" }}
        center={[center.current.lat, center.current.lon]}
        zoom={13}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FilteredPointMarkers pointsByTopic={topicCaches.current} />
      </MapContainer>
    </div>
  );
}

MapPanel.panelType = "map";
MapPanel.defaultConfig = {};

// fixme save zoom level and center point

export default Panel(MapPanel);
