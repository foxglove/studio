// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { LatLngExpression } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";

import { useDataSourceInfo, useMessagesByTopic } from "@foxglove-studio/app/PanelAPI";
import Panel from "@foxglove-studio/app/components/Panel";
import Logger from "@foxglove/log";

import "leaflet/dist/leaflet.css";

const log = Logger.getLogger(__filename);

// https://docs.ros.org/en/api/sensor_msgs/html/msg/NavSatFix.html

type Point = {
  lat: number;
  lon: number;
};

type RecenterProps = {
  points: Point[];
};

function Recenter(props: RecenterProps) {
  const map = useMap();

  const { lat, lon } = props.points[0] ?? { lat: 51.505, lon: -0.09 };

  useEffect(() => {
    map.setView([lat, lon]);
  }, [lat, lon, map]);

  return <></>;
}

function MapPanel() {
  // fixme - why is this changing constantly!
  const dataSourceInfo = useDataSourceInfo();

  // fixme useShouldNotChangeOften to identify when data source changes too often
  // maybe within useDataSourceInfo
  useEffect(() => {
    console.log("data source info changed");
  }, [dataSourceInfo]);

  const eligibleTopics = useMemo(() => {
    return ["/fix", "/vehicle/gps/fix"];
  }, []);

  // we don't care about the order of the points
  // but we do care about avoiding caching the same point twice
  // Map<timestamp, Point>

  /*
  // eligible topics are those that match the message datatypes we support
  const eligibleTopics = useMemo(() => {
    return dataSourceInfo.topics
      .filter((topic) => {
        return topic.datatype === "sensor_msgs/NavSatFix";
      })
      .map((topic) => topic.name);
  }, [dataSourceInfo]);
  */

  useEffect(() => {
    log.info("Eligible Topics: ", eligibleTopics);
  }, [eligibleTopics]);

  // fixme - provide a way for the user to specify which topics to show/hide

  const [allMessages, setAllMessages] = useState<Point[]>([]);

  const navMessages = useMessagesByTopic({
    topics: eligibleTopics,
    historySize: 1,
  });

  useEffect(() => {
    const fixMessages = navMessages["/fix"];

    const points = fixMessages?.map((msg) => {
      return {
        status: msg.message.status,
        lat: msg.message.latitude,
        lon: msg.message.longitude,
      };
    });

    if (!points || points.length === 0) {
      return;
    }

    setAllMessages((old) => {
      return old.concat(points);
    });
  }, [navMessages]);

  //console.log(allMessages);

  // need a way to specify which topics to plot
  // get topics by datatype (all navsat message topics)

  // allow the user to show/hide any navsat message topic

  // use messages by topics (active topics)

  // as we get messages, add them to the message list

  // any messages after current time are dropped from display
  // supports scrubbing back and forward

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        preferCanvas
        style={{ width: "100%", height: "100%" }}
        center={[51.505, -0.09]}
        zoom={13}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter points={allMessages} />
        {allMessages.map((point, idx) => {
          return <Circle key={idx} center={[point.lat, point.lon]} radius={0.1} />;
        })}
      </MapContainer>
    </div>
  );
}

MapPanel.panelType = "map";
MapPanel.defaultConfig = {};

export default Panel(MapPanel);
