// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AddSquare16Regular,
  ReOrderDotsVertical16Filled,
  SubtractSquare16Regular,
} from "@fluentui/react-icons";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
// import { Fzf, FzfResultItem } from "fzf";
import { uniqueId } from "lodash";
import {
  useCallback,
  useEffect,
  useMemo,
  // useMemo,
  useState,
} from "react";
import { NodeRendererProps, Tree, TreeApi } from "react-arborist";
import { useDrag } from "react-dnd";
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
import {
  MESSAGE_PATH_DRAG_TYPE,
  MessagePathDragObject,
} from "@foxglove/studio-base/components/TopicList";
import { PlayerPresence } from "@foxglove/studio-base/players/types";
// import { Topic } from "@foxglove/studio-base/src/players/types";
// import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

// type TopicWithStats = Topic & Partial<TopicStats>;

// const topicToFzfResult = (item: TopicWithStats) =>
//   ({
//     item,
//     score: 0,
//     positions: new Set<number>(),
//     start: 0,
//     end: 0,
//   } as FzfResultItem<TopicWithStats>);

const INDENT_STEP = 12;

const useStyles = makeStyles<void, "node" | "indentLines" | "dragHandle">()(
  (theme, _params, classes) => ({
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
    // aliasedTopicName: {
    //   color: theme.palette.primary.main,
    //   display: "block",
    //   textAlign: "start",
    // },
    // startAdornment: {
    //   display: "flex",
    // },
    row: {
      whiteSpace: "nowrap",
      cursor: "pointer",
      // borderBottom: `1px solid ${theme.palette.divider}`,

      ":hover": {
        [`.${classes.node}`]: {
          background: theme.palette.action.hover,
        },
      },
      [`:not(:hover) .${classes.dragHandle}`]: {
        visibility: "hidden",
      },
      ":focus": {
        outline: "none",

        [`.${classes.node}`]: {
          background: theme.palette.action.focus,

          "&.isSelected": {
            background: theme.palette.action.selected,
          },
        },
      },
    },
    icon: {
      alignItems: "center",
      justifyContent: "center",
      display: "flex",
    },
    node: {
      position: "relative",
      borderRadius: theme.shape.borderRadius,
      display: "flex",
      alignItems: "center",
      height: "100%",
      gap: theme.spacing(0.75),
      boxShadow: `inset 0 -1px 0 0 ${theme.palette.divider}`,

      "&.willReceiveDrop": {
        background: theme.palette.action.focus,
      },

      "&.isSelected": {
        background: theme.palette.action.selected,
        borderRadius: 0,
      },

      "&.isSelectedStart": {
        borderRadius: `${theme.shape.borderRadius} ${theme.shape.borderRadius} 0 0`,
      },

      "&.isSelectedEnd": {
        borderRadius: `0 0 ${theme.shape.borderRadius} ${theme.shape.borderRadius}`,
      },

      "&.isSelectedStart.isSelectedEnd": {
        borderRadius: theme.shape.borderRadius,
      },
    },
    indentLines: {
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: -1,
      display: "none",
      alignItems: "flex-start",
      height: "100%",

      "> div": {
        height: "100%",
        paddingLeft: theme.spacing(2),
      },
    },
    tree: {
      [`:hover .${classes.indentLines}`]: {
        display: "flex",
      },
    },
    dragHandle: {
      opacity: 0.5,
      marginRight: theme.spacing(1),
    },
    content: {
      display: "flex",
      overflow: "hidden",
      flex: "auto",
    },
  }),
);

const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
const selectSortedTopics = ({ sortedTopics }: MessagePipelineContext) => sortedTopics;
const selectDatatypes = ({ datatypes }: MessagePipelineContext) => datatypes;

// function TopicListItem({
//   topic,
//   positions,
// }: {
//   topic: Topic;
//   positions: Set<number>;
// }): JSX.Element {
//   const { classes } = useStyles();
//   return (
//     <ListItem
//       className={classes.listItem}
//       divider
//       key={topic.name}
//       secondaryAction={
//         <Stack style={{ textAlign: "right" }}>
//           <Typography
//             variant="caption"
//             color="text.secondary"
//             data-topic={topic.name}
//             data-topic-stat="count"
//           >
//             &mdash;
//           </Typography>
//           <Typography
//             variant="caption"
//             color="text.secondary"
//             data-topic={topic.name}
//             data-topic-stat="frequency"
//           >
//             &mdash;
//           </Typography>
//         </Stack>
//       }
//     >
//       <ListItemText
//         primary={
//           <>
//             <HighlightChars str={topic.name} indices={positions} />
//             {topic.aliasedFromName && (
//               <Typography variant="caption" className={classes.aliasedTopicName}>
//                 from {topic.aliasedFromName}
//               </Typography>
//             )}
//           </>
//         }
//         primaryTypographyProps={{ noWrap: true, title: topic.name }}
//         secondary={
//           topic.schemaName == undefined ? (
//             "—"
//           ) : (
//             <HighlightChars
//               str={topic.schemaName}
//               indices={positions}
//               offset={topic.name.length + 1}
//             />
//           )
//         }
//         secondaryTypographyProps={{
//           variant: "caption",
//           fontFamily: fonts.MONOSPACE,
//           noWrap: true,
//           title: topic.schemaName,
//         }}
//         style={{ marginRight: "48px" }}
//       />
//     </ListItem>
//   );
// }

type TreeData = {
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
            // startAdornment: (
            //   <label className={classes.startAdornment} htmlFor="topic-filter">
            //     <SearchIcon fontSize="small" />
            //   </label>
            // ),
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
            className={classes.tree}
            rowClassName={classes.row}
            padding={0}
            rowHeight={44}
            variableRowHeight={(node) => (node.level === 0 ? 44 : 24)}
            indent={INDENT_STEP}
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
            {Node}
          </Tree>
        </Stack>
      </Stack>

      {/* {filteredTopics.length > 0 ? (
        <List key="topics" dense disablePadding>
          {filteredTopics.map(({ item: topic, positions }) => {
            return <MemoTopicListItem key={topic.name} topic={topic} positions={positions} />;
          })}
        </List>
      ) : (
        <EmptyState>
          {playerPresence === PlayerPresence.PRESENT && filterText
            ? `No topics or datatypes matching \n “${filterText}”`
            : "No topics available. "}
          {playerPresence === PlayerPresence.RECONNECTING && "Waiting for connection"}
        </EmptyState>
      )} */}
      {/* <DirectTopicStatsUpdater interval={6} /> */}
    </Stack>
  );
}

function Node({ node, style }: NodeRendererProps<TreeData>) {
  const { cx, classes } = useStyles();
  const indentSize = Number.parseFloat(`${style.paddingLeft ?? 0}`);

  const isTopLevel = node.level === 0;

  const Icon = node.isInternal ? (
    node.isOpen ? (
      <SubtractSquare16Regular />
    ) : (
      <AddSquare16Regular />
    )
  ) : (
    <SvgIcon />
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

  return (
    <div
      style={style}
      ref={connectDragSource}
      className={cx(classes.node, node.state, { topLevel: isTopLevel })}
      // className={clsx(styles.node, node.state)}
      onClick={() => node.isInternal && node.toggle()}
    >
      <div className={classes.indentLines}>
        {new Array(indentSize / INDENT_STEP).fill(0).map((_, index) => {
          return <div key={index}></div>;
        })}
      </div>
      {!isTopLevel && <span className={classes.icon}>{Icon}</span>}
      <Stack
        direction={isTopLevel ? "column" : "row"}
        gap={isTopLevel ? 0 : 1}
        className={classes.content}
        paddingLeft={isTopLevel ? 1.5 : 0}
      >
        <Typography variant="body2">{node.data.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {node.data.schemaName}
          {node.data.isArray === true && "[]"}
        </Typography>
      </Stack>
      {!isTopLevel && <ReOrderDotsVertical16Filled className={classes.dragHandle} />}
    </div>
  );
}
