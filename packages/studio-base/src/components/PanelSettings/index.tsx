// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Link, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUnmount } from "react-use";
import { makeStyles } from "tss-react/mui";

import { SettingsTreeAction, SettingsTreeField } from "@foxglove/studio";
import { useConfigById } from "@foxglove/studio-base/PanelAPI";
import { ActionMenu } from "@foxglove/studio-base/components/PanelSettings/ActionMenu";
import SettingsTreeEditor from "@foxglove/studio-base/components/SettingsTreeEditor";
import { FieldEditor } from "@foxglove/studio-base/components/SettingsTreeEditor/FieldEditor";
import ShareJsonModal from "@foxglove/studio-base/components/ShareJsonModal";
import { SidebarContent } from "@foxglove/studio-base/components/SidebarContent";
import Stack from "@foxglove/studio-base/components/Stack";
import {
  LayoutState,
  useCurrentLayoutActions,
  useCurrentLayoutSelector,
  useSelectedPanels,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { usePanelCatalog } from "@foxglove/studio-base/context/PanelCatalogContext";
import {
  PanelStateStore,
  usePanelStateStore,
} from "@foxglove/studio-base/context/PanelStateContext";
import { useWorkspace } from "@foxglove/studio-base/context/WorkspaceContext";
import { PanelConfig } from "@foxglove/studio-base/types/panels";
import { TAB_PANEL_TYPE } from "@foxglove/studio-base/util/globalConstants";
import { getPanelTypeFromId, PANEL_TITLE_CONFIG_KEY } from "@foxglove/studio-base/util/layout";

const useStyles = makeStyles()((theme) => ({
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(20%, 20ch) auto",
    columnGap: theme.spacing(1),
  },
}));

const selectedLayoutIdSelector = (state: LayoutState) => state.selectedLayout?.id;

const singlePanelIdSelector = (state: LayoutState) =>
  typeof state.selectedLayout?.data?.layout === "string"
    ? state.selectedLayout.data.layout
    : undefined;

const selectIncrementSequenceNumber = (store: PanelStateStore) => store.incrementSequenceNumber;

export default function PanelSettings({
  selectedPanelIdsForTests,
}: React.PropsWithChildren<{
  selectedPanelIdsForTests?: readonly string[];
}>): JSX.Element {
  const selectedLayoutId = useCurrentLayoutSelector(selectedLayoutIdSelector);
  const singlePanelId = useCurrentLayoutSelector(singlePanelIdSelector);
  const {
    selectedPanelIds: originalSelectedPanelIds,
    setSelectedPanelIds,
    selectAllPanels,
  } = useSelectedPanels();
  const selectedPanelIds = selectedPanelIdsForTests ?? originalSelectedPanelIds;

  // If no panel is selected and there is only one panel in the layout, select it
  useEffect(() => {
    if (selectedPanelIds.length === 0 && singlePanelId != undefined) {
      selectAllPanels();
    }
  }, [selectAllPanels, selectedPanelIds, singlePanelId]);

  const { openLayoutBrowser } = useWorkspace();
  const selectedPanelId = useMemo(
    () => (selectedPanelIds.length === 1 ? selectedPanelIds[0] : undefined),
    [selectedPanelIds],
  );

  // Automatically deselect the panel we were editing when the settings sidebar closes
  useUnmount(() => {
    if (selectedPanelId != undefined) {
      setSelectedPanelIds([]);
    }
  });

  const panelCatalog = usePanelCatalog();
  const { getCurrentLayoutState: getCurrentLayout, savePanelConfigs } = useCurrentLayoutActions();
  const panelType = useMemo(
    () => (selectedPanelId != undefined ? getPanelTypeFromId(selectedPanelId) : undefined),
    [selectedPanelId],
  );
  const panelInfo = useMemo(
    () => (panelType != undefined ? panelCatalog.getPanelByType(panelType) : undefined),
    [panelCatalog, panelType],
  );

  const incrementSequenceNumber = usePanelStateStore(selectIncrementSequenceNumber);

  const [showShareModal, setShowShareModal] = useState(false);
  const shareModal = useMemo(() => {
    const panelConfigById = getCurrentLayout().selectedLayout?.data?.configById;
    if (selectedPanelId == undefined || !showShareModal || !panelConfigById) {
      return ReactNull;
    }
    return (
      <ShareJsonModal
        onRequestClose={() => setShowShareModal(false)}
        initialValue={panelConfigById[selectedPanelId] ?? {}}
        onChange={(config) => {
          savePanelConfigs({
            configs: [{ id: selectedPanelId, config: config as PanelConfig, override: true }],
          });
          incrementSequenceNumber(selectedPanelId);
        }}
        title="Import/export settings"
        noun="panel settings"
      />
    );
  }, [
    getCurrentLayout,
    selectedPanelId,
    showShareModal,
    savePanelConfigs,
    incrementSequenceNumber,
  ]);

  const [config, saveConfig] = useConfigById(selectedPanelId);

  const settingsTree = usePanelStateStore((state) =>
    selectedPanelId ? state.settingsTrees[selectedPanelId] : undefined,
  );

  const resetToDefaults = useCallback(() => {
    if (selectedPanelId) {
      savePanelConfigs({
        configs: [{ id: selectedPanelId, config: {}, override: true }],
      });
      incrementSequenceNumber(selectedPanelId);
    }
  }, [incrementSequenceNumber, savePanelConfigs, selectedPanelId]);

  const defaultPanelTitle = usePanelStateStore((state) =>
    selectedPanelId ? state.defaultTitles[selectedPanelId] : undefined,
  );
  const { classes } = useStyles();
  const customPanelTitle =
    typeof config?.[PANEL_TITLE_CONFIG_KEY] === "string"
      ? config[PANEL_TITLE_CONFIG_KEY]
      : undefined;
  const panelNameField = useMemo<SettingsTreeField>(
    () => ({
      input: "string",
      label: "Title",
      placeholder: defaultPanelTitle ?? panelInfo?.title,
      value: customPanelTitle,
    }),
    [customPanelTitle, defaultPanelTitle, panelInfo?.title],
  );
  const handleTitleChange = useCallback(
    (action: SettingsTreeAction) => {
      if (action.action === "update" && action.payload.path[0] === PANEL_TITLE_CONFIG_KEY) {
        saveConfig({ [PANEL_TITLE_CONFIG_KEY]: action.payload.value });
      }
    },
    [saveConfig],
  );

  if (selectedLayoutId == undefined) {
    return (
      <SidebarContent title="Panel settings">
        <Typography color="text.secondary">
          <Link onClick={openLayoutBrowser}>Select a layout</Link> to get started!
        </Typography>
      </SidebarContent>
    );
  }

  if (selectedPanelId == undefined) {
    return (
      <SidebarContent title="Panel settings">
        <Typography color="text.secondary">Select a panel to edit its settings.</Typography>
      </SidebarContent>
    );
  }

  if (!panelInfo) {
    throw new Error(
      `Attempt to render settings but no panel component could be found for panel id ${selectedPanelId}`,
    );
  }

  if (!config) {
    return (
      <SidebarContent title="Panel settings">
        <Typography color="text.secondary">Loading panel settings...</Typography>
      </SidebarContent>
    );
  }

  const isSettingsTree = settingsTree != undefined;

  return (
    <SidebarContent
      disablePadding={isSettingsTree}
      title={`${panelInfo.title} panel settings`}
      trailingItems={[
        <ActionMenu
          key={1}
          allowShare={panelType !== TAB_PANEL_TYPE}
          onReset={resetToDefaults}
          onShare={() => setShowShareModal(true)}
        />,
      ]}
    >
      {shareModal}
      <Stack gap={2} justifyContent="flex-start">
        <div>
          <div className={classes.fieldGrid}>
            <FieldEditor
              field={panelNameField}
              path={[PANEL_TITLE_CONFIG_KEY]}
              actionHandler={handleTitleChange}
            />
          </div>
          {settingsTree && <SettingsTreeEditor key={selectedPanelId} settings={settingsTree} />}
          {!settingsTree && (
            <Typography color="text.secondary">No additional settings available.</Typography>
          )}
        </div>
      </Stack>
    </SidebarContent>
  );
}
