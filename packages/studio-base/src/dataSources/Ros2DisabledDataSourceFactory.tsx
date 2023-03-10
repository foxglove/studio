// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Link } from "@mui/material";

import { IDataSourceFactory } from "@foxglove/studio-base/context/PlayerSelectionContext";
import Ros2SocketDataSourceFactory from "@foxglove/studio-base/dataSources/Ros2SocketDataSourceFactory";

export default class Ros2DisabledDataSourceFactory extends Ros2SocketDataSourceFactory {
  public override initialize(): ReturnType<IDataSourceFactory["initialize"]> {
    return;
  }

  public disabledReason = (
    <>
      Native ROS 2 connections are deprecated and by default not enabled. You can explicitly enable
      support for it in the app settings, however, we recommend using the{" "}
      <Link
        href="https://foxglove.dev/docs/studio/connection/ros2#live-connection"
        target="_blank"
        rel="noreferrer"
      >
        Foxglove WebSocket
      </Link>{" "}
      connection instead.
    </>
  );
}
