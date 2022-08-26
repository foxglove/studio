// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { makeStyles } from "@mui/styles";
import { Immutable } from "immer";
import { useCallback } from "react";

import EmptyState from "@foxglove/studio-base/components/EmptyState";
import { useMessageDataItem } from "@foxglove/studio-base/components/MessagePathSyntax/useMessageDataItem";
import Panel from "@foxglove/studio-base/components/Panel";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";

import helpContent from "./index.help.md";
import { TimeDisplayPanelConfig } from "./types";

export const CUSTOM_METHOD = "custom";
export const PREV_MSG_METHOD = "previous message";

type Props = {
  config: Immutable<TimeDisplayPanelConfig>;
};

const useStyles = makeStyles({
  text: {
    float: "left",
    marginRight: "600px",
  },
  container: {
    fontSize: "17px",
    padding: "10px",
    margin: "5px",
    textA: "left",
  },
});

function TimeDisplay(props: Props) {
  const classes = useStyles();

  const { config } = props;

  const { topicPath, diffMethod, diffEnabled } = config;

  const matchedMessages = useMessageDataItem(topicPath, { historySize: 2 });

  const currTickObj = matchedMessages[matchedMessages.length - 1];
  const prevTickObj = matchedMessages[matchedMessages.length - 2];

  const inTimetickDiffMode = diffEnabled && diffMethod === PREV_MSG_METHOD;
  const baseItem = inTimetickDiffMode ? prevTickObj : currTickObj;

  //----for Real time-----//
  const currentRealDate = new Date();
  const realTimeString = `${`0${currentRealDate.getHours()}`.slice(
    -2,
  )}:${`0${currentRealDate.getMinutes()}`.slice(-2)}:${`0${currentRealDate.getSeconds()}`.slice(
    -2,
  )}`;

  const renderSingleTopicOrDiffOutput = useCallback(() => {
    if (!baseItem) {
      return <EmptyState>Waiting for next message</EmptyState>;
    }

    return (
      <div className={classes.container}>
        Real Time:<span>{realTimeString}</span>
      </div>
    );
  }, [realTimeString]);

  return (
    <div>
      <PanelToolbar helpContent={helpContent}>
        <p className={classes.text}>Time Display</p>
      </PanelToolbar>
      {renderSingleTopicOrDiffOutput()}
    </div>
  );
}

const defaultConfig: TimeDisplayPanelConfig = {
  diffEnabled: false,
  diffMethod: CUSTOM_METHOD,
  topicPath: "/clock",
};

export default Panel(
  Object.assign(TimeDisplay, {
    panelType: "TimeDisplay",
    defaultConfig,
  }),
);
