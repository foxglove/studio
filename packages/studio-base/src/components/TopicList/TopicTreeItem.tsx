// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  ChevronDown12Regular,
  ChevronRight12Regular,
  ReOrderDotsVertical16Regular,
} from "@fluentui/react-icons";
import { Typography } from "@mui/material";
import { useMemo } from "react";
import { NodeRendererProps } from "react-arborist";
import { useDrag } from "react-dnd";

import Stack from "@foxglove/studio-base/components/Stack";
import {
  MESSAGE_PATH_DRAG_TYPE,
  MessagePathDragObject,
} from "@foxglove/studio-base/components/TopicList";
import { useTreeStyles } from "@foxglove/studio-base/components/TopicList/useTreeStyles";

import { TreeData } from "./TopicList";

export function TopicTreeItem(props: NodeRendererProps<TreeData>): JSX.Element {
  const { node, style } = props;
  const { cx, classes } = useTreeStyles();

  const Icon = node.isInternal ? (
    node.isOpen ? (
      <ChevronDown12Regular />
    ) : (
      <ChevronRight12Regular />
    )
  ) : (
    <div style={{ width: 12 }} />
  );

  const dragItem: MessagePathDragObject = useMemo(
    () => ({ path: node.data.messagePath }),
    [node.data],
  );
  const [, connectDragSource] = useDrag({
    type: MESSAGE_PATH_DRAG_TYPE,
    item: dragItem,
    options: { dropEffect: "copy" },
  });

  if (node.level === 0) {
    return (
      <div
        className={cx(classes.node, { ...node.state })}
        onClick={() => node.isInternal && node.toggle()}
      >
        <span className={classes.icon}>{Icon}</span>
        <Stack className={classes.content}>
          <Typography variant="body2">
            {node.data.name}
            {node.data.aliasedFromName != undefined && (
              <Typography variant="caption" className={classes.aliasedTopicName}>
                from {node.data.aliasedFromName}
              </Typography>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {node.data.schemaName}
            {node.data.isArray === true && "[]"}
          </Typography>
        </Stack>
      </div>
    );
  }

  return (
    <div
      style={style}
      ref={connectDragSource}
      className={cx(classes.node, { topLevel: node.level === 0, ...node.state })}
      onClick={() => node.isInternal && node.toggle()}
    >
      <span className={classes.icon}>{Icon}</span>
      <Stack direction="row" gap={1} className={classes.content}>
        <Typography variant="body2">{node.data.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {node.data.schemaName}
          {node.data.isArray === true && "[]"}
        </Typography>
      </Stack>
      {/* {node.level === 0 && (
        <Stack style={{ textAlign: "right" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            data-topic={data.name}
            data-topic-stat="count"
          >
            &mdash;
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            data-topic={data.name}
            data-topic-stat="frequency"
          >
            &mdash;
          </Typography>
        </Stack>
      )} */}
      {node.isLeaf && <ReOrderDotsVertical16Regular className={classes.dragHandle} />}
    </div>
  );
}
