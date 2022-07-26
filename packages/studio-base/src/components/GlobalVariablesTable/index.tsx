// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2020-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Collapse,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
  Button,
  ListItemButtonProps,
} from "@mui/material";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { partition, pick, union } from "lodash";
import { useMemo, useCallback, useRef, useState, ReactElement, useEffect } from "react";
import { makeStyles } from "tss-react/mui";

import helpContent from "@foxglove/studio-base/components/GlobalVariablesTable/index.help.md";
import { SidebarContent } from "@foxglove/studio-base/components/SidebarContent";
import Stack from "@foxglove/studio-base/components/Stack";
import useGlobalVariables, {
  GlobalVariables,
} from "@foxglove/studio-base/hooks/useGlobalVariables";
import useLinkedGlobalVariables from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import clipboard from "@foxglove/studio-base/util/clipboard";

export const ANIMATION_RESET_DELAY_MS = 3000;

const useStyles = makeStyles<void, "copyButton">()((theme, _params, classes) => ({
  copyButton: {
    position: "absolute",
    top: -1,
    right: 0,
    zIndex: theme.zIndex.mobileStepper,
    marginTop: theme.spacing(0.75),
    marginRight: theme.spacing(0.75),
  },
  editorWrapper: {
    position: "relative",

    [`&:not(:hover) .${classes.copyButton}`]: {
      visibility: "hidden",
    },
  },
  menuVisible: {
    visibility: "visible",
  },
  listItem: {
    "@media (pointer: fine)": {
      "&:not(:hover) .MuiListItemSecondaryAction-root": {
        visibility: "hidden",
      },
    },
  },
  listItemButton: {
    "&.Mui-selected": {
      color: theme.palette.primary.main,
      transition: `background-color 300ms ease-in-out`,
    },
  },
}));

export function isActiveElementEditable(): boolean {
  const activeEl = document.activeElement;
  return (
    activeEl != undefined &&
    ((activeEl as HTMLElement).isContentEditable ||
      activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA")
  );
}

const changeGlobalKey = (
  newKey: string,
  oldKey: string,
  globalVariables: GlobalVariables,
  idx: number,
  overwriteGlobalVariables: (_: GlobalVariables) => void,
) => {
  const keys = Object.keys(globalVariables);
  overwriteGlobalVariables({
    ...pick(globalVariables, keys.slice(0, idx)),
    [newKey]: globalVariables[oldKey],
    ...pick(globalVariables, keys.slice(idx + 1)),
  });
};

function LinkedGlobalVariableRow({
  name,
  selected,
  linked,
}: {
  name: string;
  selected: ListItemButtonProps["selected"];
  linked?: boolean;
}): JSX.Element {
  const { classes, cx } = useStyles();
  const [open, setOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState<undefined | HTMLElement>(undefined);
  const [copied, setCopied] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const { globalVariables, setGlobalVariables } = useGlobalVariables();
  const { linkedGlobalVariables, setLinkedGlobalVariables } = useLinkedGlobalVariables();

  const linkedTopicPaths = useMemo(
    () =>
      linkedGlobalVariables
        .filter((variable) => variable.name === name)
        .map(({ topic, markerKeyPath }) => [topic, ...markerKeyPath].join(".")),
    [linkedGlobalVariables, name],
  );

  const unlink = useCallback(
    (path: string) => {
      setLinkedGlobalVariables(
        linkedGlobalVariables.filter(
          ({ name: varName, topic, markerKeyPath }) =>
            !(varName === name && [topic, ...markerKeyPath].join(".") === path),
        ),
      );
    },
    [linkedGlobalVariables, name, setLinkedGlobalVariables],
  );

  const unlinkAndDelete = useCallback(() => {
    const newLinkedGlobalVariables = linkedGlobalVariables.filter(
      ({ name: varName }) => varName !== name,
    );
    setLinkedGlobalVariables(newLinkedGlobalVariables);
    setGlobalVariables({ [name]: undefined });
  }, [linkedGlobalVariables, name, setGlobalVariables, setLinkedGlobalVariables]);

  const moreButton = useRef<HTMLElement>(ReactNull);

  const value = useMemo(() => globalVariables[name], [globalVariables, name]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const handleCopy = useCallback(() => {
    void clipboard.copy(JSON.stringify(value)).then(() => {
      setOpen(true);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);

  return (
    <Stack>
      <ListItem
        className={classes.listItem}
        dense
        disablePadding
        classes={{ secondaryAction: cx({ [classes.menuVisible]: menuOpen }) }}
        secondaryAction={
          <Stack direction="row" alignItems="center" gap={0.125} style={{ marginRight: -8 }}>
            <IconButton
              size="small"
              id="variable-action-button"
              aria-controls={open ? "variable-action-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleClick}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              id="variable-action-menu"
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleClose}
              MenuListProps={{
                "aria-labelledby": "variable-action-button",
                dense: true,
              }}
            >
              {linkedTopicPaths.map((path) => (
                <MenuItem data-test="unlink-path" key={path} onClick={() => unlink(path)}>
                  Unlink&nbsp;
                  <Typography
                    fontWeight={600}
                    variant="inherit"
                    component="span"
                    color="text.secondary"
                  >
                    {path}
                  </Typography>
                </MenuItem>
              ))}
              {linkedTopicPaths.length > 0 && <Divider variant="middle" />}
              <MenuItem onClick={unlinkAndDelete}>
                <Typography color="error.main" variant="inherit">
                  Delete variable
                </Typography>
              </MenuItem>
            </Menu>
          </Stack>
        }
      >
        <ListItemButton
          className={classes.listItemButton}
          selected={selected}
          onClick={() => setOpen(!open)}
        >
          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" style={{ marginLeft: -12 }}>
                {open ? (
                  <ArrowDropDownIcon />
                ) : (
                  <ArrowDropDownIcon style={{ transform: "rotate(-90deg)" }} />
                )}
                {name}
              </Stack>
            }
            primaryTypographyProps={{
              component: "div",
              fontWeight: 600,
              variant: "body2",
            }}
          />
        </ListItemButton>
      </ListItem>
      <Collapse in={open}>
        <Divider />
        {open && (
          <div className={classes.editorWrapper}>
            <Button
              className={classes.copyButton}
              size="small"
              onClick={handleCopy}
              color={copied ? "primary" : "inherit"}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
            <CodeEditor value={JSON.stringify(value, undefined, 4)} language="json" padding={12} />
          </div>
        )}
      </Collapse>
      {/* <td>${name}</td>
      <td width="100%">
        <JSONInput
          value={JSON.stringify(globalVariables[name]) ?? ""}
          onChange={(newVal) => setGlobalVariables({ [name]: newVal })}
        />
      </td>
      <td>
        <Stack direction="row" flex="auto" alignItems="center" justifyContent="space-between">
          <Stack direction="row" flex="auto" marginRight={2}>
            {linkedTopicPaths.length > 1 && <span>({linkedTopicPaths.length})</span>}

            <Tooltip
              contents={
                linkedTopicPaths.length > 0 ? (
                  <>
                    <div style={{ fontWeight: "bold", opacity: 0.4 }}>
                      {linkedTopicPaths.length} LINKED TOPIC{linkedTopicPaths.length > 1 ? "S" : ""}
                    </div>
                    {linkedTopicPaths.map((path) => (
                      <div key={path} style={{ paddingTop: "5px" }}>
                        {path}
                      </div>
                    ))}
                  </>
                ) : undefined
              }
            >
              <SLinkedTopicsSpan>
                {linkedTopicPaths.length > 0 ? <bdi>{linkedTopicPaths.join(", ")}</bdi> : "--"}
              </SLinkedTopicsSpan>
            </Tooltip>
          </Stack>
          <IconButton
            elementRef={moreButton}
            iconProps={{ iconName: "MoreVertical" }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen && (
              // use Callout instead of a menu on the button for now so that we can style the menu text
              <Callout target={moreButton} isBeakVisible={false} onDismiss={() => setIsOpen(false)}>
                <Menu style={{ padding: "4px 0px" }}>
                  {linkedTopicPaths.map((path) => (
                    <Item dataTest="unlink-path" key={path} onClick={() => unlink(path)}>
                      <span>
                        Remove <span style={{ color: sharedColors.LIGHT, opacity: 1 }}>{path}</span>
                      </span>
                    </Item>
                  ))}
                  <Item onClick={unlinkAndDelete}>Delete variable</Item>
                </Menu>
              </Callout>
            )}
          </IconButton>
        </Stack>
      </td> */}
      <Divider />
    </Stack>
  );
}

function maybePlainObject(rawVal: unknown) {
  if (typeof rawVal === "object" && rawVal && "toJSON" in rawVal) {
    return (rawVal as { toJSON: () => unknown }).toJSON();
  }
  return rawVal;
}

function GlobalVariablesTable(): ReactElement {
  const theme = useTheme();
  const { globalVariables, setGlobalVariables, overwriteGlobalVariables } = useGlobalVariables();
  const { linkedGlobalVariablesByName } = useLinkedGlobalVariables();
  const globalVariableNames = useMemo(() => Object.keys(globalVariables), [globalVariables]);

  const [linked, unlinked] = useMemo(() => {
    return partition(globalVariableNames, (name) => !!linkedGlobalVariablesByName[name]);
  }, [globalVariableNames, linkedGlobalVariablesByName]);

  // Don't run the animation when the Table first renders
  const skipAnimation = useRef<boolean>(true);
  useEffect(() => {
    const timeoutId = setTimeout(() => (skipAnimation.current = false), ANIMATION_RESET_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  const previousGlobalVariablesRef = useRef<GlobalVariables | undefined>(globalVariables);

  const [changedVariables, setChangedVariables] = useState<string[]>([]);
  useEffect(() => {
    if (skipAnimation.current || isActiveElementEditable()) {
      previousGlobalVariablesRef.current = globalVariables;
      return;
    }
    const newChangedVariables = union(
      Object.keys(globalVariables),
      Object.keys(previousGlobalVariablesRef.current ?? {}),
    ).filter((name) => {
      const previousValue = previousGlobalVariablesRef.current?.[name];
      return previousValue !== globalVariables[name];
    });

    setChangedVariables(newChangedVariables);
    previousGlobalVariablesRef.current = globalVariables;
    const timerId = setTimeout(() => setChangedVariables([]), ANIMATION_RESET_DELAY_MS);
    return () => clearTimeout(timerId);
  }, [globalVariables, skipAnimation]);

  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", theme.palette.mode);
  }, [theme.palette.mode]);

  return (
    <SidebarContent
      trailingItems={[
        <IconButton
          key="add-global-variable"
          color="primary"
          disabled={globalVariables[""] != undefined}
          onClick={() => setGlobalVariables({ "": "" })}
        >
          <AddIcon />
        </IconButton>,
      ]}
      title="Variables"
      disablePadding
      helpContent={helpContent}
    >
      <Stack flex="auto">
        <Divider />
        {linked.map((name, idx) => (
          <LinkedGlobalVariableRow
            key={`${idx}.${name}`}
            name={name}
            selected={changedVariables.includes(name)}
            linked
          />
        ))}
        {unlinked.map((name, idx) => (
          <LinkedGlobalVariableRow
            key={`${idx}.${name}`}
            name={name}
            selected={changedVariables.includes(name)}
          />
        ))}
      </Stack>
      {/* <SGlobalVariablesTable>
        <LegacyTable>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Value</th>
              <th>Topic(s)</th>
            </tr>
          </thead>
          <tbody>
            {linked.map((name, idx) => (
              <SAnimatedRow
                key={`linked-${idx}`}
                skipAnimation={skipAnimation.current}
                animate={changedVariables.includes(name)}
              >
                <LinkedGlobalVariableRow name={name} />
              </SAnimatedRow>
            ))}
            {unlinked.map((name, idx) => (
              <SAnimatedRow
                key={`unlinked-${idx}`}
                skipAnimation={skipAnimation.current}
                animate={changedVariables.includes(name)}
              >
                <td data-test="global-variable-key">
                  <ValidatedResizingInput
                    value={name}
                    dataTest={`global-variable-key-input-${name}`}
                    onChange={(newKey) =>
                      changeGlobalKey(
                        newKey,
                        name,
                        globalVariables,
                        linked.length + idx,
                        overwriteGlobalVariables,
                      )
                    }
                    invalidInputs={without(globalVariableNames, name).concat("")}
                  />
                </td>
                <td width="100%">
                  <JSONInput
                    dataTest={`global-variable-value-input-${JSON.stringify(
                      globalVariables[name] ?? "",
                    )}`}
                    value={JSON.stringify(globalVariables[name]) ?? ""}
                    onChange={(newVal) => setGlobalVariables({ [name]: newVal })}
                  />
                </td>
                <td width="100%">
                  <Stack
                    direction="row"
                    flex="auto"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    --
                    <SIconWrapper onClick={() => setGlobalVariables({ [name]: undefined })}>
                      <Icon size="small">
                        <CloseIcon />
                      </Icon>
                    </SIconWrapper>
                  </Stack>
                </td>
              </SAnimatedRow>
            ))}
          </tbody>
        </LegacyTable>
        <Stack direction="row" flex="auto" marginTop={2.5}>
          <DefaultButton
            text="Add variable"
            disabled={globalVariables[""] != undefined}
            onClick={() => setGlobalVariables({ "": "" })}
          />
        </Stack>
      </SGlobalVariablesTable> */}
    </SidebarContent>
  );
}

export default GlobalVariablesTable;
