// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useTheme } from "@mui/material";
import { assignWith, groupBy, intersection, isEmpty, pick, transform, union } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLatest } from "react-use";

import { useShallowMemo } from "@foxglove/hooks";
import { isLessThan, subtract } from "@foxglove/rostime";
import { Immutable, Subscription, Time } from "@foxglove/studio";
import { useMessageReducer } from "@foxglove/studio-base/PanelAPI";
import parseRosPath, {
  getTopicsFromPaths,
} from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import {
  useCachedGetMessagePathDataItems,
  useDecodeMessagePathsForMessagesByTopic,
} from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { ChartDefaultView } from "@foxglove/studio-base/components/TimeBasedChart";
import {
  BasePlotPath,
  DataSet,
  PlotDataByPath,
  PlotPath,
  PlotXAxisVal,
} from "@foxglove/studio-base/panels/Plot/internalTypes";
import * as PlotData from "@foxglove/studio-base/panels/Plot/plotData";
import { derivative } from "@foxglove/studio-base/panels/Plot/transformPlotRange";
import { MessageEvent } from "@foxglove/studio-base/players/types";
import { Bounds, makeInitialBounds, mergeBounds } from "@foxglove/studio-base/types/Bounds";
import { getTimestampForMessage } from "@foxglove/studio-base/util/time";

import { DataSets, getDatasets, mergeDatasets } from "./datasets";
import { useFlattenedBlocks } from "./useFlattenedBlocks";

const ZERO_TIME = { sec: 0, nsec: 0 };

const EmptyDatasets: Immutable<DataSets> = Object.freeze({
  datasets: {},
  bounds: makeInitialBounds(),
  pathsWithMismatchedDataLengths: [],
});

type Params = Immutable<{
  allPaths: string[];
  followingView: undefined | ChartDefaultView;
  showSingleCurrentMessage: boolean;
  startTime: undefined | Time;
  xAxisVal: PlotXAxisVal;
  xAxisPath?: BasePlotPath;
  yAxisPaths: PlotPath[];
}>;

const selectBlocks = (ctx: MessagePipelineContext) =>
  ctx.playerState.progress.messageCache?.blocks ?? [];

const selectSetSubscriotions = (ctx: MessagePipelineContext) => ctx.setSubscriptions;

type State = DataSets & {
  allFrames: Immutable<MessageEvent[]>;
  allPaths: readonly string[];
  bounds: Bounds;
  cursor: number;
  subscriptions: Subscription[];
  xAxisVal: PlotXAxisVal;
  xAxisPath: undefined | BasePlotPath;
};

function applyDerivativeToDatasets(
  pathsWithDerivatives: ReadonlySet<string>,
  datasets: Record<string, DataSet>,
): Record<string, DataSet> {
  if (pathsWithDerivatives.size === 0) {
    return datasets;
  }

  const datasetsWithDerivatives = transform(
    datasets,
    (acc, dataset, path) => {
      if (pathsWithDerivatives.has(path)) {
        acc[path] = { ...dataset, data: derivative(dataset.data) };
      } else {
        acc[path] = dataset;
      }
    },
    {} as Record<string, DataSet>,
  );

  return datasetsWithDerivatives;
}

function makeInitialState(): State {
  return {
    allFrames: [],
    allPaths: [],
    bounds: makeInitialBounds(),
    cursor: 0,
    datasets: {},
    subscriptions: [],
    pathsWithMismatchedDataLengths: [],
    xAxisVal: "timestamp",
    xAxisPath: undefined,
  };
}

/**
 * Collates and combines datasets from alLFrames and currentFrame messages.
 */
export function usePlotPanelDatasets(params: Params): {
  bounds: Bounds;
  datasets: DataSet[];
  pathsWithMismatchedDataLengths: string[];
} {
  const {
    allPaths,
    followingView,
    showSingleCurrentMessage,
    startTime,
    xAxisPath,
    xAxisVal,
    yAxisPaths,
  } = params;

  const setSubscriptions = useMessagePipeline(selectSetSubscriotions);

  const theme = useTheme();

  // When iterating message events, we need a reverse lookup from topic to the
  // paths that requested the topic.
  const topicToPaths = useMemo(
    () => groupBy(allPaths, (path) => parseRosPath(path)?.topicName),
    [allPaths],
  );

  const subscribeTopics = useShallowMemo(getTopicsFromPaths(allPaths));

  const subscriptions: Subscription[] = useMemo(() => {
    return subscribeTopics.map((topic) => ({ topic, preload: true }));
  }, [subscribeTopics]);

  const [state, setState] = useState(makeInitialState);

  const blocks = useMessagePipeline(selectBlocks);

  const allFrames = useFlattenedBlocks({ blocks, topics: subscribeTopics });

  const decodeMessagePathsForMessagesByTopic = useDecodeMessagePathsForMessagesByTopic(allPaths);

  useEffect(() => {
    setSubscriptions("plot", subscriptions);
  }, [setSubscriptions, subscriptions]);

  const resetDatasets =
    allPaths !== state.allPaths || xAxisVal !== state.xAxisVal || xAxisPath !== state.xAxisPath;

  if (allFrames !== state.allFrames || resetDatasets) {
    // use setState directly instead of useEffect to skip an extra render.
    setState((oldState) => {
      const newState = resetDatasets ? makeInitialState() : oldState;
      const newFrames = allFrames.slice(newState.cursor);
      const newFramesByTopic = groupBy(newFrames, (msg) => msg.topic);
      const newBlockItems = PlotData.getBlockItemsByPath(
        decodeMessagePathsForMessagesByTopic,
        newFramesByTopic,
      );

      const newDatasets =
        newFrames.length > 0
          ? getDatasets({
              paths: yAxisPaths,
              itemsByPath: newBlockItems,
              startTime: startTime ?? ZERO_TIME,
              xAxisVal,
              xAxisPath,
              invertedTheme: theme.palette.mode === "dark",
            })
          : EmptyDatasets;

      const mergedDatasets: State["datasets"] = assignWith(
        { ...newState.datasets }, // spread because assignWith mutates
        newDatasets.datasets,
        mergeDatasets,
      );

      return {
        allFrames,
        allPaths,
        bounds: mergeBounds(newState.bounds, newDatasets.bounds),
        cursor: allFrames.length,
        datasets: mergedDatasets,
        pathsWithMismatchedDataLengths: union(
          newState.pathsWithMismatchedDataLengths,
          newDatasets.pathsWithMismatchedDataLengths,
        ),
        subscriptions,
        xAxisPath,
        xAxisVal,
      };
    });
  }

  const cachedGetMessagePathDataItems = useCachedGetMessagePathDataItems(allPaths);

  // When restoring, keep only the paths that are present in allPaths. Without this, the
  // reducer value will grow unbounded with new paths as users add/remove series.
  const restore = useCallback(
    (previous?: DataSets): DataSets => {
      if (previous) {
        return {
          datasets: pick(previous.datasets, allPaths),
          bounds: previous.bounds,
          pathsWithMismatchedDataLengths: intersection(
            previous.pathsWithMismatchedDataLengths,
            allPaths,
          ),
        };
      } else {
        return {
          datasets: {},
          bounds: makeInitialBounds(),
          pathsWithMismatchedDataLengths: [],
        };
      }
    },
    [allPaths],
  );

  const latestAllFramesDatasets = useLatest(state.datasets);

  const addMessages = useCallback(
    (accumulated: DataSets, msgEvents: Immutable<MessageEvent[]>) => {
      const lastEventTime = msgEvents.at(-1)?.receiveTime;
      const isFollowing = followingView?.type === "following";
      const newMessages: PlotDataByPath = {};

      for (const msgEvent of msgEvents) {
        const paths = topicToPaths[msgEvent.topic];
        if (!paths) {
          continue;
        }

        for (const path of paths) {
          // Skip datasets we're getting from allFrames.
          if ((latestAllFramesDatasets.current[path]?.data.length ?? 0) > 0) {
            continue;
          }

          const dataItem = cachedGetMessagePathDataItems(path, msgEvent);
          if (!dataItem) {
            continue;
          }

          const headerStamp = getTimestampForMessage(msgEvent.message);
          const plotDataItem = {
            queriedData: dataItem,
            receiveTime: msgEvent.receiveTime,
            headerStamp,
          };

          if (showSingleCurrentMessage) {
            newMessages[path] = [plotDataItem];
          } else {
            let plotDataPath = newMessages[path]?.slice() ?? [];
            const plotDataItems = plotDataPath;
            // If we are using the _following_ view mode, truncate away any
            // items older than the view window.
            if (lastEventTime && isFollowing) {
              const minStamp = subtract(lastEventTime, { sec: followingView.width, nsec: 0 });
              const newItems = plotDataItems.filter(
                (item) => !isLessThan(item.receiveTime, minStamp),
              );
              newItems.push(plotDataItem);
              plotDataPath = newItems;
            } else {
              plotDataPath = plotDataItems.concat(plotDataItem);
            }

            newMessages[path] = plotDataPath;
          }
        }
      }

      if (isEmpty(newMessages)) {
        return accumulated;
      }

      const newDatasets = getDatasets({
        paths: yAxisPaths,
        itemsByPath: newMessages,
        startTime: startTime ?? ZERO_TIME,
        xAxisVal,
        xAxisPath,
        invertedTheme: theme.palette.mode === "dark",
      });

      const mergedDatasets: DataSets = {
        bounds: mergeBounds(accumulated.bounds, newDatasets.bounds),
        datasets: assignWith({ ...accumulated.datasets }, newDatasets.datasets, mergeDatasets),
        pathsWithMismatchedDataLengths: union(
          accumulated.pathsWithMismatchedDataLengths,
          newDatasets.pathsWithMismatchedDataLengths,
        ),
      };

      return mergedDatasets;
    },
    [
      cachedGetMessagePathDataItems,
      followingView,
      latestAllFramesDatasets,
      showSingleCurrentMessage,
      startTime,
      theme.palette.mode,
      topicToPaths,
      xAxisPath,
      xAxisVal,
      yAxisPaths,
    ],
  );

  const currentFrameDatasets = useMessageReducer<DataSets>({
    topics: subscribeTopics,
    preloadType: "full",
    restore,
    addMessages,
  });

  const pathsWithDerivatives = useMemo(
    () => new Set(allPaths.filter((path) => path.endsWith(".@derivative"))),
    [allPaths],
  );

  const combinedDatasets = useMemo(() => {
    const stateWithDerivatives = applyDerivativeToDatasets(pathsWithDerivatives, state.datasets);
    const currentFrameWithDerivatives = applyDerivativeToDatasets(
      pathsWithDerivatives,
      currentFrameDatasets.datasets,
    );
    const allDatasets = Object.values(stateWithDerivatives).concat(
      Object.values(currentFrameWithDerivatives),
    );
    const bounds = mergeBounds(state.bounds, currentFrameDatasets.bounds);
    return {
      bounds,
      datasets: allDatasets,
      pathsWithMismatchedDataLengths: union(
        state.pathsWithMismatchedDataLengths,
        currentFrameDatasets.pathsWithMismatchedDataLengths,
      ),
    };
  }, [currentFrameDatasets, pathsWithDerivatives, state]);

  return combinedDatasets;
}
