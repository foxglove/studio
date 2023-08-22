// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, List, ListItem, ListItemText, Skeleton, TextField } from "@mui/material";
import { uniqueId } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tree, TreeApi } from "react-arborist";
import { useResizeDetector } from "react-resize-detector";
import { makeStyles } from "tss-react/mui";

import { filterMap } from "@foxglove/den/collection";
import EmptyState from "@foxglove/studio-base/components/EmptyState";
// import { HighlightChars } from "@foxglove/studio-base/components/HighlightChars";
import {
  quoteFieldNameIfNeeded,
  quoteTopicNameIfNeeded,
} from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import { useTreeStyles } from "@foxglove/studio-base/components/TopicList/useTreeStyles";
import { PlayerPresence } from "@foxglove/studio-base/players/types";

import { TopicTreeItem } from "./TopicTreeItem";

const useStyles = makeStyles()((theme) => ({
  appBar: {
    top: 0,
    zIndex: theme.zIndex.appBar,
    padding: theme.spacing(0.5),
    position: "sticky",
    backgroundColor: theme.palette.background.paper,
  },
  listItem: {
    paddingRight: theme.spacing(1),

    "&.MuiListItem-dense": {
      ".MuiListItemText-root": {
        marginTop: theme.spacing(0.5),
        marginBottom: theme.spacing(0.5),
      },
    },
    ".MuiListItemSecondaryAction-root": {
      marginRight: theme.spacing(-1),
    },
  },
  textField: {
    ".MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
}));

const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
const selectSortedTopics = ({ sortedTopics }: MessagePipelineContext) => sortedTopics;
const selectDatatypes = ({ datatypes }: MessagePipelineContext) => datatypes;

export type TreeData = {
  id: string;
  name: string;
  aliasedFromName?: string;
  schemaName?: string;
  isComplex?: boolean;
  isArray?: boolean;
  isConstant?: boolean;
  children?: TreeData[];
  messagePath: string;
};

// const MemoTopicListItem = React.memo(TopicListItem);

export function TopicList(): JSX.Element {
  const { classes, cx } = useStyles();
  const { classes: treeClasses } = useTreeStyles();
  const [filterText, setFilterText] = useState<string>("");
  const [tree, setTree] = useState<TreeApi<TreeData> | undefined>(undefined);
  const [active, setActive] = useState<TreeData | undefined>(undefined);
  const [_focused, setFocused] = useState<TreeData | undefined>(undefined);
  const [_count, setCount] = useState(0);
  const [_selectedCount, setSelectedCount] = useState(0);

  const { width, height, ref } = useResizeDetector<HTMLDivElement>({
    refreshRate: 0,
    refreshMode: "debounce",
  });

  useEffect(() => {
    setCount(tree?.visibleNodes.length ?? 0);
  }, [tree, filterText]);

  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const topics = useMessagePipeline(selectSortedTopics);
  const datatypes = useMessagePipeline(selectDatatypes);

  const generateChildren = useCallback(
    (
      schemaName: string,
      parentMessagePath: string,
      // eslint-disable-next-line @foxglove/no-boolean-parameters
      parentIsArray: boolean,
    ): TreeData[] | undefined => {
      const definition = datatypes.get(schemaName);
      if (!definition) {
        return undefined;
      }
      return filterMap(definition.definitions, (field): TreeData | undefined => {
        if (field.isConstant === true) {
          return undefined;
        }
        const messagePath = `${parentMessagePath}${
          parentIsArray ? "[:]" : ""
        }.${quoteFieldNameIfNeeded(field.name)}`;
        return {
          id: uniqueId(`${schemaName}-${field.name}-`),
          name: field.name,
          schemaName: field.type,
          isComplex: field.isComplex,
          isConstant: field.isConstant,
          isArray: field.isArray,
          messagePath,
          children:
            field.isComplex === true
              ? generateChildren(field.type, messagePath, field.isArray ?? false)
              : undefined,
        };
      });
    },
    [datatypes],
  );

  const topicTree: TreeData[] = useMemo(() => {
    const items = topics.map((topic) => {
      const messagePath = quoteTopicNameIfNeeded(topic.name);
      return {
        id: uniqueId("topic-"),
        name: topic.name,
        schemaName: topic.schemaName,
        aliasedFromName: topic.aliasedFromName,
        children: generateChildren(topic.schemaName ?? "", messagePath, false),
        messagePath,
      };
    });

    return items;
  }, [generateChildren, topics]);

  if (playerPresence === PlayerPresence.NOT_PRESENT) {
    return <EmptyState>No data source selected</EmptyState>;
  }

  if (playerPresence === PlayerPresence.ERROR) {
    return <EmptyState>An error occurred</EmptyState>;
  }

  if (playerPresence === PlayerPresence.INITIALIZING) {
    return (
      <>
        <header className={classes.appBar}>
          <TextField
            disabled
            className={classes.textField}
            fullWidth
            placeholder="Waiting for data..."
            InputProps={{
              size: "small",
              startAdornment: <SearchIcon fontSize="small" />,
            }}
          />
        </header>
        <List key="loading" dense disablePadding>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
            <ListItem className={cx(classes.listItem, "loading")} divider key={i}>
              <ListItemText
                primary={<Skeleton animation={false} width="20%" />}
                secondary={<Skeleton animation="wave" width="55%" />}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>
          ))}
        </List>
      </>
    );
  }

  return (
    <Stack fullHeight>
      <header className={classes.appBar}>
        <TextField
          id="topic-filter"
          variant="filled"
          disabled={playerPresence !== PlayerPresence.PRESENT}
          onChange={(event) => setFilterText(event.target.value)}
          value={filterText}
          className={classes.textField}
          fullWidth
          placeholder="Filter by topic or schema name…"
          InputProps={{
            size: "small",
            startAdornment: <SearchIcon fontSize="small" />,
            onKeyDown: (event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.stopPropagation();
              }
            },
            endAdornment: filterText && (
              <IconButton
                size="small"
                title="Clear filter"
                onClick={() => setFilterText("")}
                edge="end"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
      </header>

      {topics.length > 0 ? (
        <Stack flex="auto">
          <Stack ref={ref} fullHeight fullWidth flex={1} style={{ minHeight: 0, minWidth: 0 }}>
            <Tree
              height={height}
              width={width}
              initialData={topicTree}
              ref={(t) => setTree(t ?? undefined)}
              openByDefault={false}
              searchTerm={filterText}
              selection={active?.name}
              className={treeClasses.root}
              rowClassName={treeClasses.row}
              padding={0}
              rowHeight={28}
              variableRowHeight={(node) => (node.level === 0 ? 50 : 28)}
              indent={8}
              overscanCount={8}
              disableDrag // we implement our own drag & drop on certain nodes only
              disableDrop
              disableEdit
              onSelect={(selected) => setSelectedCount(selected.length)}
              onActivate={(node) => setActive(node.data)}
              onFocus={(node) => setFocused(node.data)}
              onToggle={() => {
                setTimeout(() => {
                  setCount(tree?.visibleNodes.length ?? 0);
                }, 0);
              }}
            >
              {TopicTreeItem}
            </Tree>
          </Stack>
        </Stack>
      ) : (
        <EmptyState>
          {playerPresence === PlayerPresence.PRESENT && filterText
            ? `No topics or datatypes matching \n “${filterText}”`
            : "No topics available. "}
          {playerPresence === PlayerPresence.RECONNECTING && "Waiting for connection"}
        </EmptyState>
      )}
      {/* <DirectTopicStatsUpdater interval={6} /> */}
    </Stack>
  );
}
