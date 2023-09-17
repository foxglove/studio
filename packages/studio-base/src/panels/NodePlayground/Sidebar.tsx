// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import {
  AddSquare24Filled,
  Delete20Regular,
  Dismiss20Filled,
  DocumentOnePageSparkle24Regular,
  Script24Regular,
  Toolbox24Regular,
} from "@fluentui/react-icons";
import AddIcon from "@mui/icons-material/Add";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
  Paper,
  CardHeader,
  Divider,
  tabClasses,
  Badge,
  Button,
  tabsClasses,
} from "@mui/material";
import * as monacoApi from "monaco-editor/esm/vs/editor/editor.api";
import { ReactNode, SyntheticEvent, useCallback, useMemo, useState } from "react";
import tc from "tinycolor2";
import { makeStyles } from "tss-react/mui";

import Stack from "@foxglove/studio-base/components/Stack";
import { Script } from "@foxglove/studio-base/panels/NodePlayground/script";
import { getUserScriptProjectConfig } from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/projectConfig";
import templates from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/templates";
import { UserNodes } from "@foxglove/studio-base/types/panels";

const useStyles = makeStyles()((theme) => ({
  buttonRow: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1, 1.125),
  },
  tabs: {
    padding: theme.spacing(0.75),

    [`.${tabClasses.root}`]: {
      minWidth: "auto",
      minHeight: 44,
      padding: theme.spacing(1, 1.25),
    },
    [`.${tabsClasses.indicator}`]: {
      backgroundColor: tc(theme.palette.primary.main)
        .setAlpha(theme.palette.action.selectedOpacity)
        .toString(),
      right: 0,
      width: "100%",
      borderRadius: theme.shape.borderRadius,
      transition: "none",
      pointerEvents: "none",
    },
  },
  explorerWrapper: {
    backgroundColor: theme.palette.background.paper,
    width: 350,
    overflow: "auto",
  },
}));

export type TabOption = false | "addNode" | "nodes" | "utils" | "templates";

function NodeListItem({
  onClick,
  onDelete,
  title,
  selected,
}: {
  onClick: () => void;
  onDelete: () => void;
  title?: string;
  selected?: boolean;
}): JSX.Element {
  return (
    <ListItem
      disablePadding
      secondaryAction={
        <IconButton
          size="small"
          onClick={onDelete}
          edge="end"
          aria-title="delete"
          title="Delete"
          color="error"
        >
          <Delete20Regular />
        </IconButton>
      }
    >
      <ListItemButton selected={selected} onClick={onClick}>
        <ListItemText primary={title} primaryTypographyProps={{ variant: "body2" }} />
      </ListItemButton>
    </ListItem>
  );
}

type NodesListProps = {
  nodes: UserNodes;
  addNewNode: () => void;
  selectNode: (id: string) => void;
  deleteNode: (id: string) => void;
  collapse: () => void;
  selectedNodeId?: string;
};

const NodesList = ({
  nodes,
  addNewNode,
  selectNode,
  deleteNode,
  collapse,
  selectedNodeId,
}: NodesListProps): JSX.Element => {
  const { classes } = useStyles();

  return (
    <Stack flex="auto">
      <SidebarHeader title="Scripts" collapse={collapse} />
      <List>
        {Object.keys(nodes).map((nodeId) => {
          return (
            <NodeListItem
              key={nodeId}
              title={nodes[nodeId]?.name}
              selected={selectedNodeId === nodeId}
              onClick={() => {
                selectNode(nodeId);
              }}
              onDelete={() => {
                deleteNode(nodeId);
              }}
            />
          );
        })}
        <li className={classes.buttonRow}>
          <Button
            fullWidth
            startIcon={<AddIcon />}
            variant="contained"
            color="inherit"
            onClick={addNewNode}
          >
            New script
          </Button>
        </li>
      </List>
    </Stack>
  );
};

const { utilityFiles } = getUserScriptProjectConfig();

const SidebarHeader = ({
  title,
  subheader,
  collapse,
}: {
  title: string;
  subheader?: ReactNode;
  collapse: () => void;
}) => (
  <CardHeader
    title={title}
    titleTypographyProps={{
      variant: "subtitle1",
      fontWeight: "600",
    }}
    subheader={subheader}
    subheaderTypographyProps={{
      variant: "body2",
      color: "text.secondary",
    }}
    action={
      <IconButton size="small" onClick={collapse} title="Collapse">
        <Dismiss20Filled />
      </IconButton>
    }
  />
);

type SidebarProps = {
  addNewNode: (sourceCode?: string) => void;
  selectNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  setScriptOverride: (script: Script, maxDepth?: number) => void;
  userNodes: UserNodes;
  selectedNodeId?: string;
  script?: Script;
};

const Sidebar = ({
  userNodes,
  selectNode,
  deleteNode,
  selectedNodeId,
  setScriptOverride,
  script,
  addNewNode,
}: SidebarProps): React.ReactElement => {
  const { classes } = useStyles();

  const [activeTab, setActiveTab] = useState<TabOption>(false);

  const gotoUtils = useCallback(
    (filePath: string) => {
      const monacoFilePath = monacoApi.Uri.parse(`file://${filePath}`);
      const requestedModel = monacoApi.editor.getModel(monacoFilePath);
      if (!requestedModel) {
        return;
      }
      setScriptOverride(
        {
          filePath: requestedModel.uri.path,
          code: requestedModel.getValue(),
          readOnly: true,
          selection: undefined,
        },
        2,
      );
    },
    [setScriptOverride],
  );

  const handleClose = () => {
    setActiveTab(false);
  };

  const handleTabSelection = useCallback(
    (_event: SyntheticEvent, newValue: TabOption) => {
      if (activeTab === newValue) {
        setActiveTab(false);
        return;
      }
      if (newValue === "addNode") {
        setActiveTab("nodes");
        addNewNode();
        return;
      }
      setActiveTab(newValue);
    },
    [activeTab, addNewNode],
  );

  const tabPanels = useMemo(
    () => ({
      addNode: undefined,
      nodes: (
        <NodesList
          nodes={userNodes}
          selectNode={selectNode}
          deleteNode={deleteNode}
          addNewNode={addNewNode}
          collapse={handleClose}
          selectedNodeId={selectedNodeId}
        />
      ),
      utils: (
        <Stack flex="auto" position="relative">
          <SidebarHeader
            collapse={handleClose}
            title="Utilities"
            subheader={
              <>
                You can import any of these modules into your script using the following syntax:{" "}
                <pre>{`import { ... } from "./pointClouds.ts".`}</pre>
              </>
            }
          />
          <List dense>
            {utilityFiles.map(({ fileName, filePath }) => (
              <ListItem disablePadding key={filePath} onClick={gotoUtils.bind(undefined, filePath)}>
                <ListItemButton selected={script ? filePath === script.filePath : undefined}>
                  <ListItemText primary={fileName} primaryTypographyProps={{ variant: "body2" }} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem
              disablePadding
              onClick={gotoUtils.bind(undefined, "/studio_script/generatedTypes.ts")}
            >
              <ListItemButton
                selected={
                  script ? script.filePath === "/studio_script/generatedTypes.ts" : undefined
                }
              >
                <ListItemText primary="generatedTypes.ts" />
              </ListItemButton>
            </ListItem>
          </List>
        </Stack>
      ),
      templates: (
        <Stack flex="auto">
          <SidebarHeader
            title="Templates"
            subheader="Create scripts from these templates, click a template to create a new script."
            collapse={handleClose}
          />
          <List dense>
            {templates.map(({ name, description, template }) => (
              <ListItem
                disablePadding
                key={name}
                onClick={() => {
                  addNewNode(template);
                }}
              >
                <ListItemButton>
                  <ListItemText
                    primary={name}
                    secondary={description}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stack>
      ),
    }),
    [addNewNode, deleteNode, gotoUtils, script, selectNode, selectedNodeId, userNodes],
  );

  return (
    <Paper elevation={0}>
      <Stack direction="row" fullHeight>
        <Tabs
          className={classes.tabs}
          orientation="vertical"
          value={activeTab}
          onChange={handleTabSelection}
        >
          <Tab
            className="Mui-selected"
            disableRipple
            title="Add node"
            value="addNode"
            icon={<AddSquare24Filled />}
            data-testid="node-explorer"
          />
          <Tab
            disableRipple
            value="nodes"
            title={`Scripts (${Object.keys(userNodes).length})`}
            icon={
              <Badge
                badgeContent={Object.keys(userNodes).length}
                color="primary"
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
              >
                <Script24Regular />
              </Badge>
            }
            data-testid="node-explorer"
            onClick={activeTab === "nodes" ? handleClose : undefined}
          />
          <Tab
            disableRipple
            value="utils"
            title="Utilities"
            icon={<Toolbox24Regular />}
            data-testid="utils-explorer"
            onClick={activeTab === "utils" ? handleClose : undefined}
          />
          <Tab
            disableRipple
            value="templates"
            title="Templates"
            icon={<DocumentOnePageSparkle24Regular />}
            data-testid="templates-explorer"
            onClick={activeTab === "templates" ? handleClose : undefined}
          />
        </Tabs>
        {activeTab !== false && (
          <>
            <Divider flexItem orientation="vertical" />
            <div className={classes.explorerWrapper}>{tabPanels[activeTab]}</div>
          </>
        )}
        <Divider flexItem orientation="vertical" />
      </Stack>
    </Paper>
  );
};

export default Sidebar;
