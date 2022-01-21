// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { IconButton, IButtonStyles, useTheme } from "@fluentui/react";
import { AccessTime as AccessTimeIcon, Check as CheckIcon } from "@mui/icons-material";
import { IconButton as MuiIconButton, Menu, MenuItem } from "@mui/material";
import { useCallback, useMemo } from "react";

import * as PanelAPI from "@foxglove/studio-base/PanelAPI";
import {
  messagePathStructures,
  traverseStructure,
  validTerminatingStructureItem,
} from "@foxglove/studio-base/components/MessagePathSyntax/messagePathsForDatatype";
import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { Topic } from "@foxglove/studio-base/players/types";
import { RosDatatypes } from "@foxglove/studio-base/types/RosDatatypes";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

// To show an input field with an autocomplete so the user can enter message paths, use:
//
//  <MessagePathInput path={this.state.path} onChange={path => this.setState({ path })} />
//
// To limit the autocomplete items to only certain types of values, you can use
//
//  <MessagePathInput types={["message", "array", "primitives"]} />
//
// Or use actual ROS primitive types:
//
//  <MessagePathInput types={["uint16", "float64"]} />
//
// If you don't use timestamps, you might want to hide the warning icon that we show when selecting
// a topic that has no header: `<MessagePathInput hideTimestampWarning>`.
//
// If you are rendering many input fields, you might want to use `<MessagePathInput index={5}>`,
// which gets passed down to `<MessagePathInput onChange>` as the second parameter, so you can
// avoid creating anonymous functions on every render (which will prevent the component from
// rendering unnecessarily).

function topicHasNoHeaderStamp(topic: Topic, datatypes: RosDatatypes): boolean {
  const structureTraversalResult = traverseStructure(
    messagePathStructures(datatypes)[topic.datatype],
    [
      { type: "name", name: "header" },
      { type: "name", name: "stamp" },
    ],
  );

  return (
    !structureTraversalResult.valid ||
    !validTerminatingStructureItem(structureTraversalResult.structureItem, ["time"])
  );
}

type Props = {
  path: string; // A path of the form `/topic.some_field[:]{id==42}.x`
  index?: number; // Optional index field which gets passed to `onChange` (so you don't have to create anonymous functions)
  timestampMethod?: TimestampMethod;
  onTimestampMethodChange?: (arg0: TimestampMethod, index?: number) => void;
};

export default function TimestampMethodDropdown(props: Props): JSX.Element {
  const [anchorEl, setAnchorEl] = React.useState<undefined | HTMLElement>(undefined);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const { path, timestampMethod } = props;
  const theme = useTheme();
  const dropdownStyles: Partial<IButtonStyles> = useMemo(
    () => ({
      root: {
        backgroundColor: "transparent",
        color: theme.semanticColors.disabledText,
        borderColor: "transparent",
        fontSize: 12,
        height: 24,
        padding: "0 2px 0 4px",
        cursor: "pointer",
      },
      rootHovered: {
        color: theme.semanticColors.buttonText,
        padding: "0 2px 0 4px",
        backgroundColor: theme.semanticColors.buttonBackgroundHovered,
      },
      rootPressed: { backgroundColor: theme.semanticColors.buttonBackgroundPressed },
      menuIcon: {
        fontSize: "1em",
        height: "1em",
        color: "inherit",
        marginLeft: 0,

        svg: {
          fill: "currentColor",
          height: "1em",
          width: "1em",
          display: "block",
        },
      },
    }),
    [theme],
  );
  const { datatypes, topics } = PanelAPI.useDataSourceInfo();
  const rosPath = useMemo(() => parseRosPath(path), [path]);

  const topic = useMemo(() => {
    if (!rosPath) {
      return undefined;
    }

    const { topicName } = rosPath;
    return topics.find(({ name }) => name === topicName);
  }, [rosPath, topics]);

  const noHeaderStamp = useMemo(() => {
    return topic ? topicHasNoHeaderStamp(topic, datatypes) : false;
  }, [datatypes, topic]);

  const onTimestampMethodChangeProp = props.onTimestampMethodChange;

  const onTimestampMethodChange = useCallback(
    (value: TimestampMethod) => {
      onTimestampMethodChangeProp?.(value, props.index);
    },
    [onTimestampMethodChangeProp, props.index],
  );

  const items = [
    { label: "Receive time", value: "recieveTime" },
    { label: "header.stamp", value: "headerStamp" },
  ] as { label: string; value: TimestampMethod }[];

  return (
    <>
      <MuiIconButton
        size="small"
        id="timestamp-method-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{ padding: 0.375, color: "text.secondary", "&:hover": { color: "text.primary" } }}
      >
        <AccessTimeIcon fontSize="inherit" />
      </MuiIconButton>
      <Menu
        id="timestamp-method-menu"
        disablePortal
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(undefined)}
        MenuListProps={{
          "aria-labelledby": "timestamp-method-button",
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.value}
            selected={timestampMethod === item.value}
            onClick={() => {
              onTimestampMethodChange(item.value);
              setAnchorEl(undefined);
            }}
          >
            {item.label}
            {timestampMethod === item.value && <CheckIcon fontSize="inherit" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
