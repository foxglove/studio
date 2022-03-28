// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import SearchIcon from "@mui/icons-material/Search";
import {
  AppBar,
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  styled as muiStyled,
  TextField,
  Typography,
  TypographyProps,
} from "@mui/material";
import { Fzf, FzfResultItem } from "fzf";
import { useMemo, useState } from "react";
import { useCopyToClipboard } from "react-use";

import { Topic } from "@foxglove/studio";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import { PlayerPresence } from "@foxglove/studio-base/players/types";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

const itemToFzfResult = (item: Topic) =>
  ({
    item,
    score: 0,
    positions: new Set<number>(),
    start: 0,
    end: 0,
  } as FzfResultItem<Topic>);

const HighlightChars = ({
  str,
  indices,
  color,
  offset = 0,
}: {
  str: string;
  indices: Set<number>;
  color?: TypographyProps["color"];
  offset?: number;
}) => {
  const chars = str.split("");

  const nodes = chars.map((char, i) => {
    if (indices.has(i + offset)) {
      return (
        <Typography component="b" key={i} variant="inherit" color={color ?? "info.main"}>
          {char}
        </Typography>
      );
    }
    return char;
  });

  return <>{nodes}</>;
};

const StyledAppBar = muiStyled(AppBar, { skipSx: true })(({ theme }) => ({
  top: -1,
  zIndex: theme.zIndex.appBar - 1,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "row",
  padding: theme.spacing(1),
  gap: theme.spacing(1),
  alignItems: "center",
}));

const StyledListItem = muiStyled(ListItem, { skipSx: true })(({ theme }) => ({
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
  "@media (pointer: fine)": {
    ".MuiListItemSecondaryAction-root": {
      visibility: "hidden",
    },
    "&:not(.loading):hover": {
      paddingRight: theme.spacing(6),

      ".MuiListItemSecondaryAction-root": {
        visibility: "visible",
      },
    },
  },
}));

const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;

function CopyButton({ text }: { text: string }): JSX.Element {
  const [clipboard, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);

  return (
    <IconButton
      size="small"
      title={copied ? "Copied!" : "Copy topic name"}
      color={copied ? "success" : "inherit"}
      onClick={() => {
        copyToClipboard(text);

        if (!clipboard.error) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }
      }}
    >
      {copied ? <CheckIcon fontSize="small" /> : <CopyAllIcon fontSize="small" />}
    </IconButton>
  );
}

export function TopicList(): JSX.Element {
  const [filterText, setFilterText] = useState<string>("");

  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const topics = useMessagePipeline((ctx) => ctx.playerState.activeData?.topics ?? []);

  const filteredTopics: FzfResultItem<Topic>[] = useMemo(
    () =>
      filterText
        ? new Fzf(topics, {
            fuzzy: filterText.length > 2 ? "v2" : false,
            sort: true,
            selector: (topic) => `${topic.name}|${topic.datatype}`,
          }).find(filterText)
        : topics.map((t) => itemToFzfResult(t)),
    [filterText, topics],
  );

  if (playerPresence === PlayerPresence.ERROR) {
    return (
      <Stack flex="auto" padding={2} fullHeight alignItems="center" justifyContent="center">
        <Typography align="center" color="text.secondary">
          An error occurred
        </Typography>
      </Stack>
    );
  }

  if (
    playerPresence === PlayerPresence.INITIALIZING ||
    playerPresence === PlayerPresence.RECONNECTING
  ) {
    return (
      <>
        <StyledAppBar position="sticky" color="default" elevation={0}>
          <TextField
            disabled
            variant="filled"
            fullWidth
            placeholder="Filter by topic or datatype"
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" />,
              endAdornment: (
                <Stack alignItems="center" justifyContent="center">
                  {/* Wrapper element to prevent animation wobble */}
                  <CircularProgress size={20} />
                </Stack>
              ),
            }}
          />
        </StyledAppBar>
        <List key="loading" dense disablePadding>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
            <StyledListItem className="loading" divider key={i}>
              <ListItemText
                primary={<Skeleton animation={false} width="20%" />}
                secondary={<Skeleton animation="wave" width="55%" />}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </StyledListItem>
          ))}
        </List>
      </>
    );
  }

  return (
    <>
      <StyledAppBar position="sticky" color="default" elevation={0}>
        <Box flex="auto">
          <TextField
            disabled={playerPresence !== PlayerPresence.PRESENT}
            onChange={(event) => setFilterText(event.target.value)}
            value={filterText}
            variant="filled"
            fullWidth
            placeholder="Filter by topic or datatype"
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" />,
              endAdornment: filterText && (
                <IconButton
                  size="small"
                  title="Clear search"
                  onClick={() => setFilterText("")}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            }}
          />
        </Box>
      </StyledAppBar>

      {filteredTopics.length > 0 ? (
        <List key="topics" dense disablePadding>
          {filteredTopics.map(({ item, positions }) => (
            <StyledListItem
              divider
              key={item.name}
              secondaryAction={
                <Stack direction="row" gap={0.5} alignItems="center">
                  <CopyButton text={item.name} />
                </Stack>
              }
            >
              <ListItemText
                primary={<HighlightChars str={item.name} indices={positions} />}
                primaryTypographyProps={{ noWrap: true, title: item.name }}
                secondary={
                  <HighlightChars
                    str={item.datatype}
                    indices={positions}
                    offset={item.name.length + 1}
                  />
                }
                secondaryTypographyProps={{
                  variant: "caption",
                  fontFamily: fonts.MONOSPACE,
                  noWrap: true,
                  title: item.datatype,
                }}
              />
            </StyledListItem>
          ))}
        </List>
      ) : (
        <Stack flex="auto" padding={2} fullHeight alignItems="center" justifyContent="center">
          <Typography align="center" color="text.secondary">
            No topics or datatypes matching
            <br />
            {`“${filterText}”`}
          </Typography>
        </Stack>
      )}
    </>
  );
}
