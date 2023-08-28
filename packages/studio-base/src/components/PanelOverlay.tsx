// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  TabDesktopMultiple20Regular,
  TabDesktop20Regular,
  Delete20Regular,
  TableSimple20Regular,
} from "@fluentui/react-icons";
import { Backdrop, BackdropProps, Button, Chip, Paper, buttonClasses } from "@mui/material";
import tc from "tinycolor2";
import { makeStyles } from "tss-react/mui";

import { PANEL_ROOT_CLASS_NAME } from "@foxglove/studio-base/components/PanelRoot";
import { PANEL_TOOLBAR_MIN_HEIGHT } from "@foxglove/studio-base/components/PanelToolbar";

const useStyles = makeStyles<void, "buttonGroup" | "tabCount">()((theme, _params, classes) => {
  const hoverPaper = tc(theme.palette.background.default)
    .setAlpha(1 - theme.palette.action.disabledOpacity)
    .toRgbString();
  const hoverPrimary = tc(theme.palette.primary.main)
    .setAlpha(theme.palette.action.hoverOpacity)
    .toRgbString();

  return {
    backdrop: {
      position: "absolute",
      zIndex: theme.zIndex.modal - 1,
      padding: theme.spacing(2),
      container: "backdrop / size",
    },
    invalidTarget: {
      backgroundColor: hoverPaper,
    },
    validTarget: {
      alignItems: "flex-end",
      backgroundColor: hoverPrimary,
    },
    actionOverlay: {
      backgroundImage: `linear-gradient(to bottom, ${hoverPrimary}, ${hoverPrimary})`,
      backgroundColor: hoverPaper,
    },
    highlightActive: {
      [`.${PANEL_ROOT_CLASS_NAME}:not(:hover) &`]: {
        visibility: "hidden",
      },
    },
    highlightAll: {
      [`.${PANEL_ROOT_CLASS_NAME}:not(:hover) &`]: {
        [`.${classes.buttonGroup}`]: { visibility: "hidden" },
      },
    },
    buttonGroup: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: theme.spacing(1),

      "@container backdrop (min-width: 360px)": {
        flexDirection: "row",
      },
    },
    buttonPaper: {
      borderRadius: theme.shape.borderRadius * 4,
      flex: "0 0 50%",
      minWidth: "50%",
    },
    button: {
      borderRadius: theme.shape.borderRadius * 4,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      whiteSpace: "nowrap",
      textAlign: "left",

      [`.${buttonClasses.startIcon}`]: {
        position: "relative",
        margin: 0,

        svg: {
          height: "1em",
          width: "1em",
          fontSize: 32,
        },
        [`.${classes.tabCount}`]: {
          fontSize: theme.typography.subtitle2.fontSize,
          fontWeight: 600,
        },
        "@container backdrop (max-height: 120px)": {
          marginTop: PANEL_TOOLBAR_MIN_HEIGHT,
          display: "none",
        },
      },
    },
    tabCount: {
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      display: "flex",
      inset: 0,
      textAlign: "center",
      letterSpacing: "-1px",
      // Totally random numbers here to get the text to fit inside the icon
      paddingTop: 1,
      paddingLeft: 5,
      paddingRight: 11,
    },
    chip: {
      boxShadow: theme.shadows[2],
      paddingInline: theme.spacing(2),
    },
  };
});

function StyledBackdrop(props: Omit<BackdropProps, "open">): JSX.Element {
  const { classes, cx } = useStyles();
  return <Backdrop {...props} open className={cx(classes.backdrop, props.className)} />;
}

type Props = {
  dropMessage?: string;
  isDragging: boolean;
  isNotTabPanel: boolean;
  isOver: boolean;
  isSelected: boolean;
  isTopLevelPanel: boolean;
  isValidTarget: boolean;
  quickActionsKeyPressed: boolean;
  quickActionsOverlayRef: React.MutableRefObject<HTMLElement | ReactNull>;
  selectedPanelCount: number;
  connectOverlayDragSource: (el: HTMLElement | ReactNull) => void;
  createTabs: () => void;
  groupPanels: () => void;
  removePanel: () => void;
  splitPanel: () => void;
};

export function PanelOverlay(props: Props): JSX.Element | ReactNull {
  const {
    connectOverlayDragSource,
    dropMessage,
    isDragging,
    isNotTabPanel,
    isOver,
    isSelected,
    isTopLevelPanel,
    isValidTarget,
    quickActionsKeyPressed,
    quickActionsOverlayRef,
    createTabs,
    groupPanels,
    removePanel,
    selectedPanelCount,
    splitPanel,
  } = props;
  const { classes, cx } = useStyles();

  if (isDragging) {
    if (!isValidTarget) {
      return <StyledBackdrop className={classes.invalidTarget} />;
    }

    if (isOver) {
      return (
        <StyledBackdrop className={classes.validTarget}>
          {dropMessage && (
            <Chip size="small" color="primary" label={dropMessage} className={classes.chip} />
          )}
        </StyledBackdrop>
      );
    }
  }

  if (isSelected && selectedPanelCount > 1) {
    return (
      <StyledBackdrop className={cx(classes.actionOverlay, classes.highlightAll)}>
        <div className={classes.buttonGroup}>
          <Paper elevation={0} className={classes.buttonPaper}>
            <Button
              fullWidth
              variant="outlined"
              className={classes.button}
              onClick={groupPanels}
              startIcon={<TabDesktop20Regular />}
            >
              Group in tab
            </Button>
          </Paper>
          <Paper elevation={0} className={classes.buttonPaper}>
            <Button
              fullWidth
              variant="outlined"
              className={classes.button}
              onClick={createTabs}
              startIcon={
                <>
                  <span className={classes.tabCount}>
                    {selectedPanelCount <= 99 ? selectedPanelCount : ""}
                  </span>
                  <TabDesktopMultiple20Regular />
                </>
              }
            >
              Create tabs
            </Button>
          </Paper>
        </div>
      </StyledBackdrop>
    );
  }

  if (isNotTabPanel && quickActionsKeyPressed) {
    return (
      <StyledBackdrop className={cx(classes.actionOverlay, classes.highlightActive)}>
        <div
          className={classes.buttonGroup}
          ref={(el) => {
            quickActionsOverlayRef.current = el;
            // disallow dragging the root panel in a layout
            if (!isTopLevelPanel) {
              connectOverlayDragSource(el);
            }
          }}
        >
          <Paper elevation={0} className={classes.buttonPaper}>
            <Button
              fullWidth
              variant="outlined"
              className={classes.button}
              startIcon={<TableSimple20Regular />}
              onClick={splitPanel}
            >
              Split panel
            </Button>
          </Paper>
          <Paper elevation={0} className={classes.buttonPaper}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              className={classes.button}
              startIcon={<Delete20Regular />}
              onClick={(event) => {
                event.stopPropagation();
                removePanel();
              }}
            >
              Remove panel
            </Button>
          </Paper>
        </div>
      </StyledBackdrop>
    );
  }

  return ReactNull;
}
