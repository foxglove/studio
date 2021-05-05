// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ActionButton } from "@fluentui/react";

import { usePlayerSelection } from "@foxglove-studio/app/context/PlayerSelectionContext";

export default function ConnectionList(): JSX.Element {
  const { selectSource, availableSources } = usePlayerSelection();

  return (
    <>
      {availableSources.map((source) => {
        let iconName: RegisteredIconNames;
        switch (source.type) {
          case "file":
            iconName = "OpenFile";
            break;
          case "ros1-core":
            iconName = "studio.ROS";
            break;
          case "ws":
            iconName = "Flow";
            break;
          case "http":
            iconName = "FileASPX";
            break;
        }
        return (
          <div key={source.name}>
            <ActionButton iconProps={{ iconName }} onClick={() => selectSource(source)}>
              {source.name}
            </ActionButton>
          </div>
        );
      })}
    </>
  );
}
