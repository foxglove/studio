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

import { useCallback } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import styled from "styled-components";

import EmptyState from "@foxglove-studio/app/components/EmptyState";
import { useMessagePipeline } from "@foxglove-studio/app/components/MessagePipeline";
import Panel from "@foxglove-studio/app/components/Panel";
import PanelToolbar from "@foxglove-studio/app/components/PanelToolbar";
import SelectableTimestamp from "@foxglove-studio/app/components/SelectableTimestamp";
import clipboard from "@foxglove-studio/app/util/clipboard";
import { formatDuration } from "@foxglove-studio/app/util/formatTime";
import { subtractTimes, toSec } from "@foxglove-studio/app/util/time";

const STableContainer = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
`;

const STable = styled.div`
  max-width: 100%;
  min-width: 400px;
  overflow: auto;
`;

const SRow = styled.div`
  &:nth-child(even) {
    background: #333;
  }
`;

const SCell = styled.div`
  border: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.6;
  width: 33%;
  display: inline-block;
  padding: 2px 8px;
  white-space: nowrap;
`;

const SHeader = styled.div`
  font-size: 14px;
  border-bottom: #333 solid 2px;
`;

const STitle = styled.div`
  padding: 2px 8px;
`;

const SHeaderItem = styled.div`
  overflow: hidden;
  white-space: nowrap;
`;

function TopicGraph() {
  const { publishedTopics, subscribedTopics } = useMessagePipeline(
    useCallback(
      ({ playerState: { activeData } }) =>
        activeData
          ? {
              publishedTopics: activeData.publishedTopics,
              subscribedTopics: activeData.subscribedTopics,
              services: activeData.services,
            }
          : { publishedTopics: undefined, subscribedTopics: undefined, services: undefined },
      [],
    ),
  );
  if (publishedTopics == undefined || subscribedTopics == undefined) {
    return (
      <>
        <PanelToolbar floating />
        <EmptyState>Waiting for player data...</EmptyState>
      </>
    );
  }

  const elements = [
    { data: { id: "one", label: "Node 1" }, position: { x: 0, y: 0 } },
    { data: { id: "two", label: "Node 2" }, position: { x: 100, y: 0 } },
    { data: { source: "one", target: "two", label: "Edge from Node1 to Node2" } },
  ];

  return <CytoscapeComponent elements={elements}></CytoscapeComponent>;
}

TopicGraph.panelType = "TopicGraph";
TopicGraph.defaultConfig = {};

export default Panel(TopicGraph);
