// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  TabDesktopMultiple20Regular,
  TabDesktop20Regular,
  Delete20Regular,
  TableSimple20Regular,
} from "@fluentui/react-icons";
import {
  Backdrop,
  BackdropProps,
  Button,
  ButtonGroup,
  Chip,
  Typography,
  buttonClasses,
  buttonGroupClasses,
} from "@mui/material";
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
    },
    invalidTarget: {
      backgroundColor: hoverPaper,
    },
    validTarget: {
      alignItems: "flex-end",
      borderRadius: theme.shape.borderRadius,
      border: `2px solid ${theme.palette.primary.main}`,
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
      minWidth: 120,
      marginTop: PANEL_TOOLBAR_MIN_HEIGHT,
      backgroundColor: theme.palette.background.menu,
      borderRadius: theme.shape.borderRadius * 4,

      [`.${buttonClasses.root}`]: {
        borderRadius: theme.shape.borderRadius * 4,
        display: "flex",
        justifyContent: "flex-start",
        flex: "0 0 50%",
        minWidth: "50%",
        whiteSpace: "nowrap",
        textAlign: "left",
      },
      [`.${buttonClasses.startIcon}`]: {
        position: "relative",

        svg: {
          height: "1em",
          width: "1em",
          fontSize: 24,
        },
        [`.${classes.tabCount}`]: {
          fontSize: 8,
        },
      },
    },
    tabCount: {
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      display: "flex",
      inset: 0,
      paddingLeft: "6px",
      paddingRight: "11px",
      textAlign: "center",
      letterSpacing: "-0.125em",
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
  isFullscreen: boolean;
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
    isFullscreen,
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
  const { classes, cx, theme } = useStyles();

  if (isDragging) {
    if (!isValidTarget) {
      return <StyledBackdrop className={classes.invalidTarget} />;
    }

    if (isOver) {
      return (
        <StyledBackdrop className={cx(classes.backdrop, classes.validTarget)}>
          {dropMessage && (
            <Chip size="small" color="primary" label={dropMessage} className={classes.chip} />
          )}
        </StyledBackdrop>
      );
    }
  }

  if (isSelected && !isFullscreen && selectedPanelCount > 1) {
    return (
      <StyledBackdrop className={cx(classes.actionOverlay, classes.highlightAll)}>
        <ButtonGroup orientation="vertical" className={classes.buttonGroup} variant="contained">
          <Button startIcon={<TabDesktop20Regular />} onClick={groupPanels}>
            Group in tab
          </Button>
          <Button
            startIcon={
              <>
                <span className={classes.tabCount}>{selectedPanelCount}</span>
                <TabDesktopMultiple20Regular />
              </>
            }
            onClick={createTabs}
          >
            Create {selectedPanelCount} tabs
          </Button>
        </ButtonGroup>
      </StyledBackdrop>
    );
  }

  if (isNotTabPanel && quickActionsKeyPressed && !isFullscreen) {
    return (
      <StyledBackdrop className={cx(classes.actionOverlay, classes.highlightActive)}>
        <ButtonGroup
          orientation="vertical"
          className={classes.buttonGroup}
          variant="contained"
          color="inherit"
          ref={(el) => {
            quickActionsOverlayRef.current = el;
            // disallow dragging the root panel in a layout
            if (!isTopLevelPanel) {
              connectOverlayDragSource(el);
            }
          }}
        >
          <Button startIcon={<TableSimple20Regular />} onClick={splitPanel}>
            Split panel
          </Button>
          <Button
            startIcon={<Delete20Regular primaryFill={theme.palette.error.main} />}
            onClick={(event) => {
              event.stopPropagation();
              removePanel();
            }}
          >
            <Typography variant="inherit" color="error">
              Remove
            </Typography>
          </Button>
        </ButtonGroup>
      </StyledBackdrop>
    );
  }

  return ReactNull;
}
