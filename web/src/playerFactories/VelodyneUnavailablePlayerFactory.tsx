// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Link } from "@fluentui/react";

import { IPlayerFactory } from "@foxglove/studio-base";

export default class VelodyneUnavailablePlayerFactory implements IPlayerFactory {
  id = "velodyne-device";
  displayName = "Velodyne LIDAR";
  iconName: IPlayerFactory["iconName"] = "GenericScan";

  disabledReason = (
    <>
      Velodyne connections connections are only available in our desktop app.&nbsp;
      <Link href="https://foxglove.dev/download" target="_blank" rel="noreferrer">
        Download it here.
      </Link>
    </>
  );

  initialize(): ReturnType<IPlayerFactory["initialize"]> {
    return;
  }
}
