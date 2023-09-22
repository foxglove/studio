import * as R from "ramda";

import parseRosPath from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";

import { fillInGlobalVariablesInPath } from "@foxglove/studio-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import { PlotViewport } from "@foxglove/studio-base/components/TimeBasedChart/types";
import { PlotParams, Messages, MetadataEnums, PlotDataItem, BasePlotPath } from "./internalTypes";
import { PlotData, EmptyPlotData, appendPlotData, buildPlotData, resolvePath } from "./plotData";
import { getParamTopics } from "./params";

type Cursors = Record<string, number>;
type Accumulated = {
  cursors: Cursors;
  data: PlotData;
};

function getNewMessages(
  cursors: Cursors,
  messages: Messages,
): [newCursors: Cursors, newMessages: Messages] {
  const newCursors: Cursors = {};
  const newMessages: Messages = {};

  for (const [topic, cursor] of Object.entries(cursors)) {
    newCursors[topic] = messages[topic]?.length ?? cursor;
    newMessages[topic] = messages[topic]?.slice(cursor) ?? [];
  }

  return [newCursors, newMessages];
}

function initAccumulated(topics: readonly string[]): Accumulated {
  const cursors: Cursors = {};
  for (const topic of topics) {
    cursors[topic] = 0;
  }

  return {
    cursors,
    data: EmptyPlotData,
  };
}

function getPathData(
  metadata: MetadataEnums,
  globalVariables: GlobalVariables,
  messages: Messages,
  path: BasePlotPath,
): PlotDataItem[] | undefined {
  const parsed = parseRosPath(path.value);
  if (parsed == undefined) {
    return [];
  }

  return resolvePath(
    metadata,
    messages[parsed.topicName] ?? [],
    fillInGlobalVariablesInPath(parsed, globalVariables),
  );
}

function buildPlot(
  metadata: MetadataEnums,
  globalVariables: GlobalVariables,
  params: PlotParams,
  messages: Messages,
): PlotData {
  const { paths, invertedTheme, startTime, xAxisPath, xAxisVal } = params;
  return buildPlotData({
    invertedTheme,
    paths: paths.map((path) => [path, getPathData(metadata, globalVariables, messages, path)]),
    startTime,
    xAxisPath,
    xAxisData:
      xAxisPath != undefined
        ? getPathData(metadata, globalVariables, messages, xAxisPath)
        : undefined,
    xAxisVal,
  });
}

function accumulate(
  metadata: MetadataEnums,
  globalVariables: GlobalVariables,
  previous: Accumulated,
  params: PlotParams,
  messages: Messages,
): Accumulated {
  const { cursors: oldCursors, data: oldData } = previous;
  const [newCursors, newMessages] = getNewMessages(oldCursors, messages);

  if (R.isEmpty(newMessages)) {
    return previous;
  }

  return {
    cursors: newCursors,
    data: appendPlotData(oldData, buildPlot(metadata, globalVariables, params, newMessages)),
  };
}

type Client = {
  id: string;
  params: PlotParams | undefined;
  topics: readonly string[];
  view: PlotViewport | undefined;
  blocks: Accumulated;
  current: Accumulated;
};

export type State = {
  isLive: boolean;
  clients: Client[];
  globalVariables: GlobalVariables;
  blocks: Messages;
  current: Messages;
  metadata: MetadataEnums;
};

enum SideEffectType {
  Rebuild = "rebuild",
}

type RebuildEffect = {
  type: SideEffectType.Rebuild;
  clientId: string;
};

const rebuildClient = (id: string): RebuildEffect => ({
  type: SideEffectType.Rebuild,
  clientId: id,
});

type SideEffect = RebuildEffect;

export type SideEffects = SideEffect[];

export type StateAndEffects = [State, SideEffects];

export function init(): State {
  return {
    isLive: false,
    clients: [],
    globalVariables: {},
    blocks: {},
    current: {},
    metadata: {
      topics: [],
      datatypes: new Map(),
      enumValues: {},
      structures: {},
    },
  };
}

function noEffects(state: State): StateAndEffects {
  return [state, []];
}

function evictCache(state: State): State {
  const { clients, blocks, current } = state;
  const topics = R.pipe(
    R.chain(({ topics: clientTopics }: Client) => clientTopics),
    R.uniq,
  )(clients);

  return {
    ...state,
    blocks: R.pick(topics, blocks),
    current: R.pick(topics, current),
  };
}

const findClient = (state: State, id: string) =>
  R.find((client) => client.id === id, state.clients);

const mutateClient = (state: State, id: string, newClient: Client): State => ({
  ...state,
  clients: state.clients.map((client) => (client.id === id ? newClient : client)),
});

const keepEffects =
  (mutator: (state: State) => State) =>
  ([state, effects]: StateAndEffects): StateAndEffects => {
    return [mutator(state), effects];
  };

function refreshClient(state: State, id: string): StateAndEffects {
  const { blocks, current, metadata, globalVariables } = state;
  const client = findClient(state, id);
  if (client == undefined) {
    return noEffects(state);
  }

  const { params } = client;
  if (params == undefined) {
    return noEffects(state);
  }

  const topics = getParamTopics(params);
  const initialState = initAccumulated(topics);
  return [
    mutateClient(state, id, {
      ...client,
      topics,
      blocks: accumulate(metadata, globalVariables, initialState, params, blocks),
      current: accumulate(metadata, globalVariables, initialState, params, current),
    }),
    [rebuildClient(id)],
  ];
}

function updateParams(state: State, id: string, params: PlotParams): StateAndEffects {
  const client = findClient(state, id);
  if (client == undefined) {
    return noEffects(state);
  }

  return R.pipe(
    (state) =>
      mutateClient(state, id, {
        ...client,
        params,
        topics: getParamTopics(params),
      }),
    (state) => refreshClient(state, id),
    keepEffects(evictCache),
  )(state);
}

export function register(
  state: State,
  id: string,
  params: PlotParams | undefined,
): StateAndEffects {
  const { clients } = state;
  const newState = {
    ...state,
    clients: [
      ...clients,
      {
        id,
        params,
        topics: [],
        view: undefined,
        blocks: initAccumulated([]),
        current: initAccumulated([]),
      },
    ],
  };

  if (params == undefined) {
    return [newState, []];
  }

  return updateParams(newState, id, params);
}
