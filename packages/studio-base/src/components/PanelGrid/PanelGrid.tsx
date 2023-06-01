// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// fil

import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { Container, IconButton, TextField } from "@mui/material";
import fuzzySort from "fuzzysort";
import { countBy } from "lodash";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import EmptyState from "@foxglove/studio-base/components/EmptyState";
import { PanelGridCard } from "@foxglove/studio-base/components/PanelGrid/PanelGridCard";
import Stack from "@foxglove/studio-base/components/Stack";
import {
  PanelInfo,
  usePanelCatalog,
  verifyPanels,
} from "@foxglove/studio-base/context/PanelCatalogContext";
import { PanelConfig } from "@foxglove/studio-base/types/panels";

const useStyles = makeStyles()((theme) => {
  return {
    fullHeight: {
      height: "100%",
    },
    grid: {
      display: "grid !important",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      gap: theme.spacing(2),
    },
    toolbar: {
      position: "sticky",
      top: -0.5, // yep that's a half pixel to avoid a gap between the appbar and panel top
      zIndex: 100,
      display: "flex",
      justifyContent: "stretch",
      padding: theme.spacing(2),
      backgroundImage: `linear-gradient(to top, transparent, ${
        theme.palette.background.paper
      } ${theme.spacing(1.5)}) !important`,
    },
  };
});

export type PanelSelection = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: { [panelId: string]: PanelConfig };
};

type Props = {
  onPanelSelect: (arg0: PanelSelection) => void;
};

function blurActiveElement() {
  // Clear focus from the panel menu button so that spacebar doesn't trigger
  // more panel additions.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export const PanelGrid = forwardRef<HTMLDivElement, Props>(function PanelGrid(props: Props, ref) {
  const { onPanelSelect } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const { classes } = useStyles();
  const { t } = useTranslation("addPanel");

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
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

  const noResults = allFilteredPanels.length === 0;

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent key down events from triggering the parent menu, if any.
    if (e.key !== "Escape") {
      e.stopPropagation();
    }
  }, []);

  const displayPanelListItem = useCallback(
    (panelInfo: PanelInfo) => {
      const { title, type, config, relatedConfigs } = panelInfo;
      return (
        <PanelGridCard
          key={`${type}-${title}`}
          panel={panelInfo}
          searchQuery={searchQuery}
          onClick={() => {
            onPanelSelect({ type, config, relatedConfigs });
            blurActiveElement();
          }}
        />
      );
    },
    [onPanelSelect, searchQuery],
  );

  return (
    <div className={classes.fullHeight} ref={ref}>
      <div className={classes.toolbar}>
        <TextField
          fullWidth
          placeholder={t("searchPanels")}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={onKeyDown}
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
      <Container className={classes.grid} maxWidth={false}>
        {allFilteredPanels.map(displayPanelListItem)}
      </Container>
      {noResults && (
        <Stack padding={2}>
          <EmptyState>{t("noPanelsMatchSearchCriteria")}</EmptyState>
        </Stack>
      )}
    </div>
  );
});
