// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { ActionButton, IButton, IContextualMenuItemProps, IRenderFunction } from "@fluentui/react";
import { createSvgIcon } from "@fluentui/react-icons-mdl2";
import { ReactElement, useLayoutEffect, useRef } from "react";

import RosSvg from "@foxglove-studio/app/assets/ros.svg";
import { usePlayerSelection } from "@foxglove-studio/app/context/PlayerSelectionContext";

type TinyConnectionPickerProps = {
  defaultIsOpen?: boolean;
};

const RosIcon = createSvgIcon({
  displayName: "ROS",
  svg({ classes }) {
    return <RosSvg className={classes.svg} style={{ width: "auto" }} />;
  },
});

export default function TinyConnectionPicker({
  defaultIsOpen = false,
}: TinyConnectionPickerProps): ReactElement {
  const { selectSource, availableSources } = usePlayerSelection();

  const buttonRef = useRef<IButton>(ReactNull);
  useLayoutEffect(() => {
    if (defaultIsOpen) {
      buttonRef.current?.openMenu();
    }
  }, [defaultIsOpen]);

  return (
    <ActionButton
      componentRef={buttonRef}
      data-test="open-connection-picker"
      iconProps={{ iconName: "DataManagementSettings" }}
      menuProps={{
        items: availableSources.map((source) => {
          let iconName: string | undefined;
          let onRenderIcon: IRenderFunction<IContextualMenuItemProps> | undefined;
          switch (source.type) {
            case "file":
              iconName = "OpenFile";
              break;
            case "ros1-core":
              // eslint-disable-next-line react/display-name
              onRenderIcon = (props) => <RosIcon className={props?.classNames.icon} />;
              break;
            case "ws":
              iconName = "Flow";
              break;
            case "http":
              iconName = "FileASPX";
              break;
          }
          return {
            key: source.name,
            text: source.name,
            onClick: () => selectSource(source),
            iconProps: { iconName },
            onRenderIcon,
          };
        }),
      }}
    />
  );
}
