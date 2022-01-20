// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.
import { makeStyles, useTheme } from "@fluentui/react";
import MagnifyIcon from "@mdi/svg/svg/magnify.svg";
import {
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import fuzzySort from "fuzzysort";
import { isEmpty } from "lodash";
import { useCallback, useEffect, useMemo } from "react";
import { useDrag } from "react-dnd";
import { MosaicDragType, MosaicPath } from "react-mosaic-component";

import Flex from "@foxglove/studio-base/components/Flex";
import Icon from "@foxglove/studio-base/components/Icon";
import { LegacyInput } from "@foxglove/studio-base/components/LegacyStyledComponents";
import TextHighlight from "@foxglove/studio-base/components/TextHighlight";
import { useTooltip } from "@foxglove/studio-base/components/Tooltip";
import {
  useCurrentLayoutActions,
  usePanelMosaicId,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { PanelInfo, usePanelCatalog } from "@foxglove/studio-base/context/PanelCatalogContext";
import {
  PanelConfig,
  MosaicDropTargetPosition,
  SavedProps,
  MosaicDropResult,
} from "@foxglove/studio-base/types/panels";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
  },
  container: {
    // Allow space for the background image (set below) to extend above/below the field
    paddingTop: theme.spacing.s1,
    paddingBottom: theme.spacing.s1,
    paddingLeft: theme.spacing.m,
    paddingRight: theme.spacing.m,
  },
  sticky: {
    color: colors.LIGHT,
    position: "sticky",
    top: 0, // space is added by container.paddingTop
    zIndex: 2,
  },
  searchInputContainer: {
    paddingLeft: 8,
    marginBottom: theme.spacing.s1,
    backgroundColor: theme.semanticColors.inputBackground,
    borderRadius: theme.effects.roundedCorner2,
    border: `1px solid ${theme.semanticColors.inputBorder}`,
  },
  searchInput: {
    backgroundColor: `${theme.semanticColors.inputBackground} !important`,
    padding: "8px !important",
    margin: "0 !important",
    width: "100%",
    minWidth: 0,

    ":hover, :focus": {
      backgroundColor: theme.semanticColors.inputBackground,
    },
  },
  grid: {
    paddingLeft: theme.spacing.m,
    paddingRight: theme.spacing.m,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, 140px)",
    gridGap: theme.spacing.m,
  },
  noResults: {
    padding: "8px 16px",
    opacity: 0.4,
  },
}));

type DropDescription = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: SavedProps;
  position?: MosaicDropTargetPosition;
  path?: MosaicPath;
  tabId?: string;
};

type PanelItemProps = {
  mode?: "grid" | "list";
  panel: {
    type: string;
    title: string;
    description?: string;
    config?: PanelConfig;
    relatedConfigs?: SavedProps;
    thumbnail?: string;
  };
  searchQuery: string;
  checked?: boolean;
  highlighted?: boolean;
  onClick: () => void;
  mosaicId: string;
  onDrop: (arg0: DropDescription) => void;
};

function DraggablePanelItem({
  mode = "list",
  searchQuery,
  panel,
  onClick,
  onDrop,
  checked = false,
  highlighted = false,
  mosaicId,
}: PanelItemProps) {
  const scrollRef = React.useRef<HTMLElement>(ReactNull);
  const [, connectDragSource] = useDrag<unknown, MosaicDropResult, never>({
    type: MosaicDragType.WINDOW,
    // mosaicId is needed for react-mosaic to accept the drop
    item: () => ({ mosaicId }),
    options: { dropEffect: "copy" },
    end: (_item, monitor) => {
      const dropResult = monitor.getDropResult() ?? {};
      const { position, path, tabId } = dropResult;
      // dropping outside mosaic does nothing. If we have a tabId, but no
      // position or path, we're dragging into an empty tab.
      if ((position == undefined || path == undefined) && tabId == undefined) {
        // when dragging a panel into an empty layout treat it link clicking the panel
        // mosaic doesn't give us a position or path to invoke onDrop
        onClick();
        return;
      }
      const { type, config, relatedConfigs } = panel;
      onDrop({ type, config, relatedConfigs, position, path, tabId });
    },
  });

  React.useEffect(() => {
    if (highlighted && scrollRef.current) {
      const highlightedItem = scrollRef.current.getBoundingClientRect();
      const scrollContainer = scrollRef.current.parentElement?.parentElement?.parentElement;
      if (scrollContainer) {
        const scrollContainerToTop = scrollContainer.getBoundingClientRect().top;

        const isInView =
          highlightedItem.top >= 0 &&
          highlightedItem.top >= scrollContainerToTop &&
          highlightedItem.top + 50 <= window.innerHeight;

        if (!isInView) {
          scrollRef.current?.scrollIntoView();
        }
      }
    }
  }, [highlighted]);

  const { ref: tooltipRef, tooltip } = useTooltip({
    contents: panel.description,
    delay: 200,
  });
  const mergedRef = useCallback(
    (el: HTMLElement | ReactNull) => {
      connectDragSource(el);
      tooltipRef(el);
      scrollRef.current = el;
    },
    [connectDragSource, tooltipRef, scrollRef],
  );
  const { isInverted } = useTheme();
  switch (mode) {
    case "grid":
      return (
        <Card
          ref={mergedRef}
          onClick={onClick}
          sx={{ cursor: "grab" }}
          square={false}
          elevation={4}
        >
          {tooltip}
          {panel.thumbnail && (
            <CardMedia component="img" image={panel.thumbnail} alt={panel.title} />
          )}
          <CardContent>
            <TextHighlight targetStr={panel.title} searchText={searchQuery} />
          </CardContent>
        </Card>
      );

    case "list":
      return (
        <ListItem disableGutters disablePadding>
          <ListItemButton
            disabled={checked}
            ref={mergedRef}
            onClick={onClick}
            sx={{
              cursor: "grab",
              backgroundColor: highlighted ? (theme) => theme.palette.action.focus : undefined,
              paddingY: 0.5,
            }}
          >
            <ListItemIcon sx={{ width: 64, paddingRight: 1 }}>
              {panel.thumbnail ? (
                <Paper
                  variant="outlined"
                  component="img"
                  src={panel.thumbnail}
                  alt={panel.title}
                  sx={{
                    borderRadius: 1,
                    maxWidth: "100%",
                    // show border only in dark mode to avoid thumbnails blending into the background
                    border: isInverted ? undefined : "none",
                  }}
                />
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 1, height: 42, width: "100%" }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={<TextHighlight targetStr={panel.title} searchText={searchQuery} />}
              primaryTypographyProps={{ fontWeight: checked ? "bold" : undefined }}
              secondary={panel.description}
              secondaryTypographyProps={{
                variant: "caption",
                marginTop: "0 !important", // overrides CssBaseline
                lineHeight: 1.2,
              }}
            />
          </ListItemButton>
        </ListItem>
      );
  }
}

export type PanelSelection = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: {
    [panelId: string]: PanelConfig;
  };
};
type Props = {
  mode?: "grid" | "list";
  onPanelSelect: (arg0: PanelSelection) => void;
  selectedPanelTitle?: string;
  backgroundColor?: string;
};

// sanity checks to help panel authors debug issues
function verifyPanels(panels: readonly PanelInfo[]) {
  const panelTypes: Map<string, PanelInfo> = new Map();
  for (const panel of panels) {
    const { title, type, config } = panel;
    const dispName = title ?? type ?? "<unnamed>";
    if (type.length === 0) {
      throw new Error(`Panel component ${title} must declare a unique \`static panelType\``);
    }
    const existingPanel = panelTypes.get(type);
    if (existingPanel) {
      const bothHaveEmptyConfigs = isEmpty(existingPanel.config) && isEmpty(config);
      if (bothHaveEmptyConfigs) {
        const otherDisplayName = existingPanel.title ?? existingPanel.type ?? "<unnamed>";
        throw new Error(
          `Two components have the same panelType ('${type}') and no preset configs: ${otherDisplayName} and ${dispName}`,
        );
      }
    }
    panelTypes.set(type, panel);
  }
}

function PanelList(props: Props): JSX.Element {
  const theme = useTheme();
  const classes = useStyles();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedPanelIdx, setHighlightedPanelIdx] = React.useState<number | undefined>();
  const { mode, onPanelSelect, selectedPanelTitle } = props;

  const { dropPanel } = useCurrentLayoutActions();
  const mosaicId = usePanelMosaicId();

  // Update panel layout when a panel menu item is dropped;
  // actual operations to change layout supplied by react-mosaic-component
  const onPanelMenuItemDrop = React.useCallback(
    ({ config, relatedConfigs, type, position, path, tabId }: DropDescription) => {
      dropPanel({
        newPanelType: type,
        destinationPath: path,
        position,
        tabId,
        config,
        relatedConfigs,
      });
    },
    [dropPanel],
  );

  const handleSearchChange = React.useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    setSearchQuery(e.currentTarget.value);
    setHighlightedPanelIdx(0);
  }, []);

  const panelCatalog = usePanelCatalog();
  const { allRegularPanels, allPreconfiguredPanels } = useMemo(() => {
    const panels = panelCatalog.getPanels();
    const regular = panels.filter((panel) => !panel.config);
    const preconfigured = panels.filter((panel) => panel.config);
    const sortByTitle = (a: PanelInfo, b: PanelInfo) =>
      a.title.localeCompare(b.title, undefined, { ignorePunctuation: true, sensitivity: "base" });

    return {
      allRegularPanels: [...regular].sort(sortByTitle),
      allPreconfiguredPanels: [...preconfigured].sort(sortByTitle),
    };
  }, [panelCatalog]);

  useEffect(() => {
    verifyPanels([...allRegularPanels, ...allPreconfiguredPanels]);
  }, [allRegularPanels, allPreconfiguredPanels]);

  const getFilteredPanels = React.useCallback(
    (panels: PanelInfo[]) => {
      return searchQuery.length > 0
        ? fuzzySort
            .go(searchQuery, panels, { key: "title" })
            .map((searchResult) => searchResult.obj)
        : panels;
    },
    [searchQuery],
  );

  const { filteredRegularPanels, filteredPreconfiguredPanels } = React.useMemo(
    () => ({
      filteredRegularPanels: getFilteredPanels(allRegularPanels),
      filteredPreconfiguredPanels: getFilteredPanels(allPreconfiguredPanels),
    }),
    [getFilteredPanels, allRegularPanels, allPreconfiguredPanels],
  );

  const allFilteredPanels = React.useMemo(
    () => [...filteredPreconfiguredPanels, ...filteredRegularPanels],
    [filteredPreconfiguredPanels, filteredRegularPanels],
  );

  const highlightedPanel = React.useMemo(() => {
    return highlightedPanelIdx != undefined ? allFilteredPanels[highlightedPanelIdx] : undefined;
  }, [allFilteredPanels, highlightedPanelIdx]);

  const noResults = allFilteredPanels.length === 0;

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (mode === "grid") {
        return;
      }
      if (e.key === "ArrowDown" && highlightedPanelIdx != undefined) {
        setHighlightedPanelIdx((highlightedPanelIdx + 1) % allFilteredPanels.length);
      } else if (e.key === "ArrowUp" && highlightedPanelIdx != undefined) {
        const newIdx = (highlightedPanelIdx - 1) % (allFilteredPanels.length - 1);
        setHighlightedPanelIdx(newIdx >= 0 ? newIdx : allFilteredPanels.length + newIdx);
      } else if (e.key === "Enter" && highlightedPanel) {
        onPanelSelect({
          type: highlightedPanel.type,
          config: highlightedPanel.config,
          relatedConfigs: highlightedPanel.relatedConfigs,
        });
      }
    },
    [allFilteredPanels.length, highlightedPanel, highlightedPanelIdx, mode, onPanelSelect],
  );

  const displayPanelListItem = React.useCallback(
    (panelInfo: PanelInfo) => {
      const { title, type, config, relatedConfigs } = panelInfo;
      return (
        <DraggablePanelItem
          mode={mode}
          key={`${type}-${title}`}
          mosaicId={mosaicId}
          panel={panelInfo}
          onDrop={onPanelMenuItemDrop}
          onClick={() => onPanelSelect({ type, config, relatedConfigs })}
          checked={title === selectedPanelTitle}
          highlighted={highlightedPanel?.title === title}
          searchQuery={searchQuery}
        />
      );
    },
    [
      mode,
      highlightedPanel,
      mosaicId,
      onPanelMenuItemDrop,
      onPanelSelect,
      searchQuery,
      selectedPanelTitle,
    ],
  );

  return (
    <div className={classes.root}>
      <div className={classes.sticky}>
        <div
          className={classes.container}
          style={{
            backgroundImage: `linear-gradient(to top, transparent, ${
              props.backgroundColor ?? theme.semanticColors.bodyBackground
            } ${theme.spacing.s1})`,
          }}
        >
          <Flex center className={classes.searchInputContainer}>
            <Icon style={{ color: theme.semanticColors.inputIcon }}>
              <MagnifyIcon />
            </Icon>
            <LegacyInput
              className={classes.searchInput}
              placeholder="Search panels"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={onKeyDown}
              onBlur={() => setHighlightedPanelIdx(undefined)}
              onFocus={() => setHighlightedPanelIdx(0)}
              autoFocus
            />
          </Flex>
        </div>
      </div>
      {mode === "grid" ? (
        <div className={classes.grid}>{allFilteredPanels.map(displayPanelListItem)}</div>
      ) : (
        <List>{allFilteredPanels.map(displayPanelListItem)}</List>
      )}
      {noResults && <div className={classes.noResults}>No panels match search criteria.</div>}
    </div>
  );
}

export default PanelList;
