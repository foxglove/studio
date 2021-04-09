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

import Cytoscape from "cytoscape";
import CytoscapeCola from "cytoscape-cola";
import { useCallback } from "react";
import CytoscapeComponent from "react-cytoscapejs";

import EmptyState from "@foxglove-studio/app/components/EmptyState";
import { useMessagePipeline } from "@foxglove-studio/app/components/MessagePipeline";
import Panel from "@foxglove-studio/app/components/Panel";
import PanelToolbar from "@foxglove-studio/app/components/PanelToolbar";

const STYLESHEET: Cytoscape.Stylesheet[] = [
  {
    selector: 'node[type="node"]',
    style: {
      content: "data(label)",
      shape: "rectangle",
      "background-color": "blue",
      "font-size": "16px",
      "text-valign": "center",
      "text-halign": "center",
      "text-outline-color": "#000",
      "text-outline-width": "2px",
      color: "#fff",
    },
  },
  {
    selector: 'node[type="topic"]',
    style: {
      content: "data(label)",
      shape: "diamond",
      "background-color": "green",
      "font-size": "16px",
      "text-outline-color": "#000",
      "text-outline-width": "2px",
      color: "#fff",
    },
  },
  {
    selector: 'node[type="service"]',
    style: {
      content: "data(label)",
      shape: "ellipse",
      "background-color": "red",
      "font-size": "16px",
      "text-valign": "center",
      "text-halign": "center",
      "text-outline-color": "#000",
      "text-outline-width": "2px",
      color: "#fff",
    },
  },
];

const LAYOUT = ({
  name: "cola",
  animate: true,
  refresh: 1,
  maxSimulationTime: 1000,
  nodeDimensionsIncludeLabels: true,
  avoidOverlap: true,
  handleDisconnected: true,
} as unknown) as Cytoscape.LayoutOptions;

Cytoscape.use(CytoscapeCola);

function unionInto<T>(dest: Set<T>, ...iterables: Set<T>[]): void {
  for (const iterable of iterables) {
    for (const item of iterable) {
      dest.add(item);
    }
  }
}

function TopicGraph() {
  const { publishedTopics, subscribedTopics, services } = useMessagePipeline(
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
  if (publishedTopics == undefined) {
    return (
      <>
        <PanelToolbar floating />
        <EmptyState>Waiting for player data...</EmptyState>
      </>
    );
  }

  const elements: cytoscape.ElementDefinition[] = [];

  const nodeIds = new Set<string>();
  const topicIds = new Set<string>();
  const serviceIds = new Set<string>();
  publishedTopics.forEach((curNodes, topic) => {
    unionInto(nodeIds, curNodes);
    topicIds.add(topic);
  });
  if (subscribedTopics != undefined) {
    subscribedTopics.forEach((curNodes, topic) => {
      unionInto(nodeIds, curNodes);
      topicIds.add(topic);
    });
  }
  if (services != undefined) {
    services.forEach((curNodes, topic) => {
      unionInto(nodeIds, curNodes);
      serviceIds.add(topic);
    });
  }

  for (const node of nodeIds) {
    elements.push({ data: { id: `n:${node}`, label: node, type: "node" } });
  }
  for (const topic of topicIds) {
    elements.push({ data: { id: `t:${topic}`, label: topic, type: "topic" } });
  }
  for (const service of serviceIds) {
    elements.push({ data: { id: `s:${service}`, label: service, type: "service" } });
  }

  for (const [topic, publishers] of publishedTopics.entries()) {
    for (const node of publishers) {
      elements.push({ data: { source: `n:${node}`, target: `t:${topic}` } });
    }
  }

  if (subscribedTopics != undefined) {
    for (const [topic, subscribers] of subscribedTopics.entries()) {
      for (const node of subscribers) {
        elements.push({ data: { source: `t:${topic}`, target: `n:${node}` } });
      }
    }
  }

  if (services != undefined) {
    for (const [service, providers] of services.entries()) {
      for (const node of providers) {
        elements.push({ data: { source: `n:${node}`, target: `s:${service}` } });
      }
    }
  }

  return (
    <CytoscapeComponent
      elements={elements}
      style={{ width: "100%", height: "100%" }}
      stylesheet={STYLESHEET}
      layout={LAYOUT}
    ></CytoscapeComponent>
  );
}

TopicGraph.panelType = "TopicGraph";
TopicGraph.defaultConfig = {};

export default Panel(TopicGraph);
