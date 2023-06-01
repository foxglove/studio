// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, List, TextField, Typography } from "@mui/material";
import fuzzySort from "fuzzysort";
import { countBy } from "lodash";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MosaicPath } from "react-mosaic-component";
import { makeStyles } from "tss-react/mui";

import { PanelListItem } from "@foxglove/studio-base/components/PanelList/PanelListItem";
import Stack from "@foxglove/studio-base/components/Stack";
import {
  useCurrentLayoutActions,
  usePanelMosaicId,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import {
  PanelInfo,
  usePanelCatalog,
  verifyPanels,
} from "@foxglove/studio-base/context/PanelCatalogContext";
import {
  PanelConfig,
  MosaicDropTargetPosition,
  SavedProps,
} from "@foxglove/studio-base/types/panels";

const useStyles = makeStyles()((theme) => {
  const { spacing, palette } = theme;

  return {
    fullHeight: {
      height: "100%",
    },
    toolbar: {
      position: "sticky",
      top: -0.5, // yep that's a half pixel to avoid a gap between the appbar and panel top
      zIndex: 100,
      display: "flex",
      padding: spacing(1.5),
      justifyContent: "stretch",
      backgroundImage: `linear-gradient(to top, transparent, ${palette.background.paper} ${spacing(
        1.5,
      )}) !important`,
    },
    toolbarMenu: {
      backgroundImage: `linear-gradient(to top, transparent, ${palette.background.menu} ${spacing(
        1.5,
      )}) !important`,
    },
  };
});

type DropDescription = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: SavedProps;
  position?: MosaicDropTargetPosition;
  path?: MosaicPath;
  tabId?: string;
};

function blurActiveElement() {
  // Clear focus from the panel menu button so that spacebar doesn't trigger
  // more panel additions.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export type PanelSelection = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: { [panelId: string]: PanelConfig };
};

type Props = {
  isMenu?: boolean;
  onPanelSelect: (arg0: PanelSelection) => void;
  onDragStart?: () => void;
  selectedPanelType?: string;
};

export const PanelList = forwardRef<HTMLDivElement, Props>(function PanelList(props: Props, ref) {
  const { isMenu = false, onDragStart, onPanelSelect, selectedPanelType } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedPanelIdx, setHighlightedPanelIdx] = useState<number | undefined>();
  const { classes, cx } = useStyles();
  const { t } = useTranslation("addPanel");

  const { dropPanel } = useCurrentLayoutActions();
  const mosaicId = usePanelMosaicId();

  // Update panel layout when a panel menu item is dropped;
  // actual operations to change layout supplied by react-mosaic-component
  const onPanelMenuItemDrop = useCallback(
    ({ config, relatedConfigs, type, position, path, tabId }: DropDescription) => {
      dropPanel({
        newPanelType: type,
        destinationPath: path,
        position,
        tabId,
        config,
        relatedConfigs,
      });
      blurActiveElement();
    },
    [dropPanel],
  );

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    // When there is a search query, automatically highlight the first (0th) item.
    // When the user erases the query, remove the highlight.
    setHighlightedPanelIdx(query ? 0 : undefined);
  }, []);

  const panelCatalog = usePanelCatalog();

  const namespacedPanels = useMemo(() => {
    // Remove namespace if panel title is unique.
    const panels = panelCatalog.getPanels();
    const countByTitle = countBy(panels, (panel) => panel.title);
    return panels.map((panel) => {
      if ((countByTitle[panel.title] ?? 0) > 1) {
        return panel;
      } else {
        return { ...panel, namespace: undefined };
      }
    });
  }, [panelCatalog]);

  const { allRegularPanels, allPreconfiguredPanels } = useMemo(() => {
    const panels = namespacedPanels;
    const regular = panels.filter((panel) => !panel.config);
    const preconfigured = panels.filter((panel) => panel.config);
    const sortByTitle = (a: PanelInfo, b: PanelInfo) =>
      a.title.localeCompare(b.title, undefined, { ignorePunctuation: true, sensitivity: "base" });

    return {
      allRegularPanels: [...regular].sort(sortByTitle),
      allPreconfiguredPanels: [...preconfigured].sort(sortByTitle),
    };
  }, [namespacedPanels]);

  useEffect(() => {
    verifyPanels([...allRegularPanels, ...allPreconfiguredPanels]);
  }, [allRegularPanels, allPreconfiguredPanels]);

  const getFilteredPanels = useCallback(
    (panels: PanelInfo[]) => {
      return searchQuery.length > 0
        ? fuzzySort
            .go(searchQuery, panels, {
              keys: ["title", "description"],
              // Weigh title matches more heavily than description matches.
              scoreFn: (a) => Math.max(a[0] ? a[0].score : -1000, a[1] ? a[1].score - 100 : -1000),
              threshold: -900,
            })
            .map((searchResult) => searchResult.obj)
        : panels;
    },
    [searchQuery],
  );

  const { filteredRegularPanels, filteredPreconfiguredPanels } = useMemo(
    () => ({
      filteredRegularPanels: getFilteredPanels(allRegularPanels),
      filteredPreconfiguredPanels: getFilteredPanels(allPreconfiguredPanels),
    }),
    [getFilteredPanels, allRegularPanels, allPreconfiguredPanels],
  );

  const allFilteredPanels = useMemo(
    () => [...filteredPreconfiguredPanels, ...filteredRegularPanels],
    [filteredPreconfiguredPanels, filteredRegularPanels],
  );

  const highlightedPanel = useMemo(() => {
    return highlightedPanelIdx != undefined ? allFilteredPanels[highlightedPanelIdx] : undefined;
  }, [allFilteredPanels, highlightedPanelIdx]);

  const noResults = allFilteredPanels.length === 0;

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Prevent key down events from triggering the parent menu, if any.
      if (e.key !== "Escape") {
        e.stopPropagation();
      }
      if (e.key === "ArrowDown") {
        setHighlightedPanelIdx((existing) => {
          if (existing == undefined) {
            return 0;
          }
          return (existing + 1) % allFilteredPanels.length;
        });
      } else if (e.key === "ArrowUp") {
        setHighlightedPanelIdx((existing) => {
          // nothing to highlight if there are no entries
          if (allFilteredPanels.length <= 0) {
            return undefined;
          }

          if (existing == undefined) {
            return allFilteredPanels.length - 1;
          }
          return (existing - 1 + allFilteredPanels.length) % allFilteredPanels.length;
        });
      } else if (e.key === "Enter" && highlightedPanel) {
        onPanelSelect({
          type: highlightedPanel.type,
          config: highlightedPanel.config,
          relatedConfigs: highlightedPanel.relatedConfigs,
        });
      }
    },
    [allFilteredPanels.length, highlightedPanel, onPanelSelect],
  );

  const displayPanelListItem = useCallback(
    (panelInfo: PanelInfo) => {
      const { title, type, config, relatedConfigs } = panelInfo;
      return (
        <PanelListItem
          key={`${type}-${title}`}
          mosaicId={mosaicId}
          panel={panelInfo}
          onDragStart={onDragStart}
          onDrop={onPanelMenuItemDrop}
          onClick={() => {
            onPanelSelect({ type, config, relatedConfigs });
            blurActiveElement();
          }}
          checked={type === selectedPanelType}
          highlighted={highlightedPanel?.title === title}
          searchQuery={searchQuery}
        />
      );
    },
    [
      highlightedPanel?.title,
      mosaicId,
      onDragStart,
      onPanelMenuItemDrop,
      onPanelSelect,
      searchQuery,
      selectedPanelType,
    ],
  );

  return (
    <div className={classes.fullHeight} ref={ref}>
      <div className={cx(classes.toolbar, { [classes.toolbarMenu]: isMenu })}>
        <TextField
          fullWidth
          placeholder={t("searchPanels")}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={onKeyDown}
          onBlur={() => setHighlightedPanelIdx(undefined)}
          autoFocus
          data-testid="panel-list-textfield"
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" color="primary" />,
            endAdornment: searchQuery && (
              <IconButton size="small" edge="end" onClick={() => setSearchQuery("")}>
                <CloseIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
      </div>
      <List dense disablePadding>
        {allFilteredPanels.map(displayPanelListItem)}
      </List>
      {noResults && (
        <Stack alignItems="center" justifyContent="center" paddingX={1} paddingY={2}>
          <Typography variant="body2" color="text.secondary">
            {t("noPanelsMatchSearchCriteria")}
          </Typography>
        </Stack>
      )}
    </div>
  );
});
