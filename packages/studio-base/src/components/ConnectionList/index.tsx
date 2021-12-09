// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  ActionButton,
  DefaultButton,
  Icon,
  ITextStyles,
  makeStyles,
  Stack,
  Text,
  useTheme,
} from "@fluentui/react";
import { useCallback, useContext, useMemo } from "react";

import { AppSetting } from "@foxglove/studio-base/AppSetting";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import NotificationModal from "@foxglove/studio-base/components/NotificationModal";
import Timestamp from "@foxglove/studio-base/components/Timestamp";
import ModalContext from "@foxglove/studio-base/context/ModalContext";
import {
  IDataSourceFactory,
  usePlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks/useAppConfigurationValue";
import { useConfirm } from "@foxglove/studio-base/hooks/useConfirm";
import { subtractTimes } from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/time";
import { PlayerPresence, PlayerProblem } from "@foxglove/studio-base/players/types";
import { formatDuration } from "@foxglove/studio-base/util/formatTime";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

const selectPlayerPresence = ({ playerState }: MessagePipelineContext) => playerState.presence;
const selectPlayerProblems = (ctx: MessagePipelineContext) => ctx.playerState.problems;
const selectPlayerName = (ctx: MessagePipelineContext) => ctx.playerState.name;

const emptyArray: PlayerProblem[] = [];

const useStyles = makeStyles((theme) => ({
  badge: {
    textTransform: "uppercase",
    fontSize: theme.fonts.small.fontSize,
    fontWeight: 600,
    backgroundColor: theme.palette.themePrimary,
    color: theme.palette.neutralLighterAlt,
    padding: `1px 8px`,
    marginLeft: "10px",
    borderRadius: 100,
  },
  divider: {
    width: "100%",
    height: 1,
    border: 0,
    backgroundColor: theme.semanticColors.bodyDivider,
  },
}));

type Props = {
  onOpen?: () => void;
};

export default function ConnectionList(props: Props): JSX.Element {
  const { onOpen } = props;
  const [enableOpenDialog] = useAppConfigurationValue(AppSetting.OPEN_DIALOG);
  const { selectSource, availableSources } = usePlayerSelection();
  const confirm = useConfirm();
  const modalHost = useContext(ModalContext);
  const theme = useTheme();
  const classes = useStyles();

  const subheaderStyles = useMemo(
    () =>
      ({
        root: {
          fontVariant: "small-caps",
          textTransform: "lowercase",
          color: theme.palette.neutralSecondaryAlt,
          letterSpacing: "0.5px",
          position: "sticky",
          top: 0,
        },
      } as ITextStyles),
    [theme],
  );

  const playerProblems = useMessagePipeline(selectPlayerProblems) ?? emptyArray;
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const playerName = useMessagePipeline(selectPlayerName);
  const startTime = useMessagePipeline(
    useCallback((ctx) => ctx.playerState.activeData?.startTime, []),
  );
  const endTime = useMessagePipeline(useCallback((ctx) => ctx.playerState.activeData?.endTime, []));

  const onSourceClick = useCallback(
    (source: IDataSourceFactory) => {
      if (source.disabledReason != undefined) {
        void confirm({
          title: "Unsupported data source",
          prompt: source.disabledReason,
          variant: "primary",
          cancel: false,
        });
        return;
      }

      selectSource(source.id);
    },
    [confirm, selectSource],
  );

  const showProblemModal = useCallback(
    (problem: PlayerProblem) => {
      const remove = modalHost.addModalElement(
        <NotificationModal
          notification={{
            message: problem.message,
            subText: problem.tip,
            details: problem.error,
            severity: problem.severity,
          }}
          onRequestClose={() => remove()}
        />,
      );
    },
    [modalHost],
  );

  // When using the open dialog we don't display the available sources items and instead display
  // and open button to open the dialog.
  const sourcesListElements = useMemo(() => {
    if (enableOpenDialog === true) {
      return ReactNull;
    }

    return (
      <>
        <Text
          block
          styles={{
            root: { color: theme.palette.neutralTertiary, marginBottom: theme.spacing.l1 },
          }}
        >
          {playerPresence === PlayerPresence.NOT_PRESENT
            ? "Not connected. Choose a data source below to get started."
            : playerName}
        </Text>
        {availableSources.map((source) => {
          if (source.hidden === true) {
            return ReactNull;
          }

          const iconName: RegisteredIconNames = source.iconName as RegisteredIconNames;
          return (
            <div key={source.id}>
              <ActionButton
                styles={{
                  root: {
                    margin: 0,
                    padding: 0,
                    width: "100%",
                    textAlign: "left",
                    // sources with a disabled reason are clickable to show the reason
                    // a lower opacity makes the option look disabled to avoid drawing attention
                    opacity: source.disabledReason != undefined ? 0.5 : 1,
                  },
                }}
                iconProps={{
                  iconName,
                  styles: { root: { "& span": { verticalAlign: "baseline" } } },
                }}
                onClick={() => onSourceClick(source)}
              >
                {source.displayName}
                {source.badgeText && <span className={classes.badge}>{source.badgeText}</span>}
              </ActionButton>
            </div>
          );
        })}
      </>
    );
  }, [
    availableSources,
    classes.badge,
    enableOpenDialog,
    onSourceClick,
    playerName,
    playerPresence,
    theme.palette.neutralTertiary,
    theme.spacing.l1,
  ]);

  // When we are using the enable open dialog, we want to display the data source info
  const dataSourceInfo = useMemo(() => {
    if (enableOpenDialog !== true) {
      return;
    }

    // fixme - put in an internal component so we don't render parent as source changes
    return (
      <Stack tokens={{ childrenGap: theme.spacing.m }}>
        <DefaultButton onClick={onOpen}>Open new data source</DefaultButton>
        <Stack
          tokens={{
            childrenGap: theme.spacing.m,
          }}
          styles={{
            root: {
              whiteSpace: "nowrap",
              overflow: "hidden",
            },
          }}
        >
          <Stack horizontal verticalAlign="center">
            <Stack grow tokens={{ childrenGap: theme.spacing.s2 }}>
              <Text styles={subheaderStyles}>Current Connection</Text>
              <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>{playerName}</Text>
            </Stack>
          </Stack>

          <Stack tokens={{ childrenGap: theme.spacing.s2 }}>
            <Text styles={subheaderStyles}>Start time</Text>
            {startTime ? (
              <Timestamp time={startTime} />
            ) : (
              <Text variant="small">Waiting for data…</Text>
            )}
          </Stack>

          <Stack tokens={{ childrenGap: theme.spacing.s2 }}>
            <Text styles={subheaderStyles}>End time</Text>
            {endTime ? (
              <Timestamp time={endTime} />
            ) : (
              <Text variant="small">Waiting for data…</Text>
            )}
          </Stack>

          <Stack tokens={{ childrenGap: theme.spacing.s2 }}>
            <Text styles={subheaderStyles}>Duration</Text>
            <Text
              variant="small"
              styles={{
                root: {
                  fontFamily: fonts.MONOSPACE,
                  color: theme.palette.neutralSecondary,
                },
              }}
            >
              {startTime && endTime
                ? formatDuration(subtractTimes(endTime, startTime))
                : "Waiting for data…"}
            </Text>
          </Stack>
        </Stack>
      </Stack>
    );
  }, [
    enableOpenDialog,
    endTime,
    onOpen,
    playerName,
    startTime,
    subheaderStyles,
    theme.palette.neutralSecondary,
    theme.spacing.m,
    theme.spacing.s2,
  ]);

  return (
    <>
      {sourcesListElements}
      {dataSourceInfo}
      {playerProblems.length > 0 && <hr className={classes.divider} />}
      {playerProblems.map((problem, idx) => {
        const iconName = problem.severity === "error" ? "Error" : "Warning";
        const color =
          problem.severity === "error"
            ? theme.semanticColors.errorBackground
            : theme.semanticColors.warningBackground;
        return (
          <div
            key={idx}
            style={{ color, padding: theme.spacing.s1, cursor: "pointer" }}
            onClick={() => showProblemModal(problem)}
          >
            <Icon iconName={iconName} />
            &nbsp;
            {problem.message}
          </div>
        );
      })}
    </>
  );
}
