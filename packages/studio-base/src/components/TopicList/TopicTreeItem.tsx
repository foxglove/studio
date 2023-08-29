// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  ChevronDown12Regular,
  ChevronRight12Regular,
  ReOrderDotsVertical16Regular,
} from "@fluentui/react-icons";
import { Typography } from "@mui/material";
import { NodeRendererProps } from "react-arborist";

import Stack from "@foxglove/studio-base/components/Stack";
import { TopicStatsChip } from "@foxglove/studio-base/components/TopicList/TopicStatsChip";
import { useTreeStyles } from "@foxglove/studio-base/components/TopicList/useTreeStyles";
import { useMessagePathDrag } from "@foxglove/studio-base/services/messagePathDragging";

import { TreeData } from "./types";

export function TopicTreeItem({ node }: NodeRendererProps<TreeData>): JSX.Element {
  const { cx, classes, theme } = useTreeStyles();

  const Icon = node.isInternal ? (
    node.isOpen ? (
      <ChevronDown12Regular />
    ) : (
      <ChevronRight12Regular />
    )
  ) : (
    <div style={{ width: 16, height: 16 }} />
  );

  const { connectDragSource, connectDragPreview, cursor } = useMessagePathDrag({
    path: node.data.messagePath,
    rootSchemaName: undefined,
  });
  return (
    <div
      onClick={() => node.isInternal && node.toggle()}
      ref={connectDragPreview}
      style={{
        paddingLeft: node.level > 1 ? theme.spacing(node.level - 1 * 1) : undefined,
      }}
      className={cx(classes.node, {
        ...node.state,
        isTopLevel: node.level === 0,
      })}
    >
      <span className={classes.icon}>{Icon}</span>
      {node.level === 0 ? (
        <Stack flex="auto" overflow="hidden">
          <Typography variant="body2" noWrap>
            {node.data.name}
            {node.data.aliasedFromName != undefined && (
              <Typography variant="caption" className={classes.aliasedTopicName}>
                from {node.data.aliasedFromName}
              </Typography>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {node.data.schemaName}
          </Typography>
        </Stack>
      ) : (
        <Stack flex="auto" direction="row" gap={2} overflow="hidden">
          <Typography variant="body2">{node.data.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {node.data.schemaName}
            {node.data.isArray === true && "[]"}
          </Typography>
        </Stack>
      )}
      {node.level === 0 && <TopicStatsChip topicName={node.data.name} />}
      <div data-testid="TopicListDragHandle" ref={connectDragSource} style={{ cursor }}>
        <ReOrderDotsVertical16Regular />
      </div>
    </div>
  );
}
