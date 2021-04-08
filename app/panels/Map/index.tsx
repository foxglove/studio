// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MapContainer, TileLayer, Circle } from "react-leaflet";

import Panel from "@foxglove-studio/app/components/Panel";

import "leaflet/dist/leaflet.css";

function MapPanel() {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        style={{ width: "100%", height: "100%" }}
        center={[51.505, -0.09]}
        zoom={13}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle center={[51.505, -0.09]} />
      </MapContainer>
    </div>
  );
}

MapPanel.panelType = "map";
MapPanel.defaultConfig = {};

export default Panel(MapPanel);
