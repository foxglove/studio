// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ErrorCircle16Regular, Info16Regular, Warning16Regular } from "@fluentui/react-icons";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  Typography,
  accordionSummaryClasses,
  useTheme,
} from "@mui/material";
import { useMemo } from "react";
import { makeStyles } from "tss-react/mui";

import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import { NotificationSeverity } from "@foxglove/studio-base/util/sendNotification";
import { DetailsType } from "@foxglove/studio-base/util/sendNotification";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

const useStyles = makeStyles()((theme) => ({
  acccordion: {
    background: "none",
    boxShadow: "none",

    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
    "&.Mui-expanded": {
      margin: 0,
    },
  },
  accordionDetails: {
    display: "flex",
    flexDirection: "column",
    fontFamily: fonts.MONOSPACE,
    fontSize: theme.typography.caption.fontSize,
    padding: theme.spacing(1),
    gap: theme.spacing(1),
  },
  acccordionSummary: {
    height: 30,
    minHeight: "auto",
    padding: theme.spacing(0, 0.5, 0, 0.75),
    fontWeight: theme.typography.subtitle1.fontWeight,

    "&.Mui-expanded": {
      minHeight: "auto",
    },
    [`& .${accordionSummaryClasses.content}`]: {
      margin: 0,
    },
    [`& .${accordionSummaryClasses.expandIconWrapper}`]: {
      transform: "rotate(-90deg)",
    },
    [`& .${accordionSummaryClasses.expandIconWrapper}.Mui-expanded`]: {
      transform: "rotate(0deg)",
    },
  },
  detailsText: {
    color: theme.palette.text.primary,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    flex: 1,
  },
}));

const selectPlayerProblems = ({ playerState }: MessagePipelineContext) => playerState.problems;

function ProblemIcon({ severity }: { severity: NotificationSeverity }): JSX.Element {
  const { palette } = useTheme();

  switch (severity) {
    case "warn":
      return <Warning16Regular primaryFill={palette.warning.main} />;
    case "error":
      return <ErrorCircle16Regular primaryFill={palette.error.main} />;
    case "info":
      return <Info16Regular primaryFill={palette.info.main} />;
    default:
      return <></>;
  }
}

function ProblemDetails(props: { details: DetailsType; subText?: string }): JSX.Element {
  const { details, subText } = props;
  const { classes } = useStyles();

  const detailsElement = useMemo(() => {
    if (details instanceof Error) {
      return <div className={classes.detailsText}>{details.stack}</div>;
    } else if (details != undefined && details !== "") {
      return (
        <Typography style={{ whiteSpace: "pre-line" /* allow newlines in the details message */ }}>
          {details}
        </Typography>
      );
    } else if (subText) {
      return undefined;
    }

    return "No details provided";
  }, [classes, details, subText]);

  return (
    <AccordionDetails className={classes.accordionDetails}>
      {subText && <Typography variant="body2">{subText}</Typography>}
      {detailsElement}
    </AccordionDetails>
  );
}

export function ProblemsList(): JSX.Element {
  const { classes } = useStyles();
  const playerProblems = useMessagePipeline(selectPlayerProblems) ?? [];

  if (playerProblems.length === 0) {
    return (
      <Stack flex="auto" padding={2} fullHeight alignItems="center" justifyContent="center">
        <Typography align="center" color="text.secondary">
          No problems found
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack fullHeight flex="auto" overflow="auto">
      {playerProblems.map((problem, idx) => (
        <>
          <Accordion
            className={classes.acccordion}
            key={`${idx}.${problem.message}`}
            TransitionProps={{ unmountOnExit: true }}
          >
            <AccordionSummary
              className={classes.acccordionSummary}
              expandIcon={<ArrowDropDownIcon />}
            >
              <Stack direction="row" alignItems="center" gap={0.5}>
                <ProblemIcon severity={problem.severity} />
                {problem.message}
              </Stack>
            </AccordionSummary>
            <Divider />
            <ProblemDetails subText={problem.tip} details={problem.error} />
          </Accordion>
          <Divider />
        </>
      ))}
    </Stack>
  );
}
