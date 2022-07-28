// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LinkIcon from "@mui/icons-material/Link";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemButtonProps,
  ListItemText,
  Typography,
  Button,
  Tooltip,
  InputBase,
} from "@mui/material";
import { pick } from "lodash";
import { useMemo, useCallback, useState } from "react";
import { makeStyles } from "tss-react/mui";

import JsonInput from "@foxglove/studio-base/components/JsonInput";
import Stack from "@foxglove/studio-base/components/Stack";
import useGlobalVariables, {
  GlobalVariables,
} from "@foxglove/studio-base/hooks/useGlobalVariables";
import useLinkedGlobalVariables from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import clipboard from "@foxglove/studio-base/util/clipboard";

const useStyles = makeStyles<void, "copyButton">()((theme, _params, classes) => ({
  root: {
    "@media (pointer: fine)": {
      [`&:not(:hover) .${classes.copyButton}`]: {
        visibility: "hidden",
      },
    },
  },
  copyButton: {
    top: 0,
    right: 0,
    zIndex: theme.zIndex.mobileStepper,

    "&.MuiButton-root": {
      position: "absolute",
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
      margin: theme.spacing(0.75),
      minWidth: "auto",
    },
  },
  editorWrapper: {
    position: "relative",
    backgroundColor: theme.palette.grey[50],
  },
  listItemButton: {
    "&:focus-within": {
      backgroundColor: "transparent",
    },
    "&.Mui-selected": {
      color: theme.palette.primary.main,
      transition: `background-color 300ms ease-in-out`,
    },
  },
}));

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

export default function Variable({
  name,
  selected = false,
  linked = false,
  linkedIndex,
}: {
  name: string;
  selected?: ListItemButtonProps["selected"];
  linked?: boolean;
  linkedIndex: number;
}): JSX.Element {
  const { classes } = useStyles();
  const [open, setOpen] = useState<boolean>(true);
  const [anchorEl, setAnchorEl] = React.useState<undefined | HTMLElement>(undefined);
  const [copied, setCopied] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const { globalVariables, setGlobalVariables, overwriteGlobalVariables } = useGlobalVariables();
  const { linkedGlobalVariables, setLinkedGlobalVariables } = useLinkedGlobalVariables();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(undefined);
  };

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
      handleClose();
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

  const value = useMemo(() => globalVariables[name], [globalVariables, name]);

  const handleCopy = useCallback(() => {
    return void clipboard.copy(JSON.stringify(value, undefined, 2) ?? "").then(() => {
      setOpen(true);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);

  return (
    <Stack className={classes.root}>
      <ListItem
        dense
        disablePadding
        secondaryAction={
          <Stack direction="row" alignItems="center" gap={0.25} style={{ marginRight: -8 }}>
            {linkedTopicPaths.length > 0 && (
              <Tooltip
                arrow
                placement="top"
                title={
                  linkedTopicPaths.length > 0 && (
                    <Stack padding={0.25} gap={0.25}>
                      <Typography variant="overline" style={{ opacity: 0.8 }}>
                        {linkedTopicPaths.length} LINKED TOPIC
                        {linkedTopicPaths.length > 1 ? "S" : ""}
                      </Typography>
                      {linkedTopicPaths.map((path) => (
                        <Typography key={path} variant="inherit">
                          {path}
                        </Typography>
                      ))}
                    </Stack>
                  )
                }
              >
                <LinkIcon color={selected ? "primary" : "info"} style={{ opacity: 0.8 }} />
              </Tooltip>
            )}
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
                <ArrowDropDownIcon style={{ transform: !open ? "rotate(-90deg)" : undefined }} />
                {linked ? (
                  name
                ) : (
                  <InputBase
                    autoFocus={name === ""}
                    value={name}
                    placeholder="variable_name"
                    data-test={`global-variable-key-input-${name}`}
                    style={{ font: "inherit", flex: "auto", padding: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => name === "" && setOpen(true)}
                    onChange={(event) =>
                      changeGlobalKey(
                        event.target.value,
                        name,
                        globalVariables,
                        linkedIndex,
                        overwriteGlobalVariables,
                      )
                    }
                  />
                )}
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
      {open && (
        <div className={classes.editorWrapper}>
          <Divider />
          <Button
            className={classes.copyButton}
            size="small"
            onClick={handleCopy}
            color={copied ? "primary" : "inherit"}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <JsonInput
            value={value}
            readOnly={linked}
            onChange={(newVal) => setGlobalVariables({ [name]: newVal })}
          />
        </div>
      )}
      <Divider />
    </Stack>
  );
}
