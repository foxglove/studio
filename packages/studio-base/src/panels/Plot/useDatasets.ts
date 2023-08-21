// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";
import * as R from "ramda";
import { useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import { useShallowMemo, useDeepMemo } from "@foxglove/hooks";
import { Immutable } from "@foxglove/studio";
import { useMessageReducer as useCurrent, useDataSourceInfo } from "@foxglove/studio-base/PanelAPI";
import { useBlocksByTopic as useBlocks } from "@foxglove/studio-base/PanelAPI/useBlocksByTopic";
import { getTopicsFromPaths } from "@foxglove/studio-base/components/MessagePathSyntax/parseRosPath";
import { TypedDataProvider } from "@foxglove/studio-base/components/TimeBasedChart/types";
import useGlobalVariables from "@foxglove/studio-base/hooks/useGlobalVariables";
import { MessageEvent } from "@foxglove/studio-base/players/types";
import {
  useMessagePipeline,
  MessagePipelineContext,
} from "@foxglove/studio-base/components/MessagePipeline";

import { PlotParams, Messages } from "./internalTypes";
import { getPaths, PlotData } from "./plotData";

type Service = Comlink.Remote<typeof import("./useDatasets.worker")["service"]>;
let worker: Worker | undefined;
let service: Service | undefined;
let numClients: number = 0;

const pending: ((service: Service) => void)[] = [];
async function waitService(): Promise<Service> {
  if (service != undefined) {
    return service;
  }
  return await new Promise((resolve) => {
    pending.push(resolve);
  });
}

const getIsLive = (ctx: MessagePipelineContext) => ctx.seekPlayback == undefined;

// topic -> isSent
type BlockStatus = Record<string, boolean>;
let blockStatus: BlockStatus[] = [];

type Client = {
  topics: readonly string[];
  setter: (topics: string[]) => void;
};
let clients: Record<string, Client> = {};

// Calculate the list of unique topics that _all_ of the plots need and
// nominate one panel to subscribe to the topics on behalf of the rest.
function chooseClient() {
  if (R.isEmpty(clients)) {
    return;
  }

  const clientList = R.values(clients);
  const topics = R.pipe(
    R.chain((client: Client) => client.topics),
    R.uniq,
  )(clientList);
  R.head(clientList)?.setter(topics);

  // Also clear the status of any topics we're no longer using
  blockStatus = R.map((block) => R.pick(topics, block), blockStatus);
}

// Subscribe to "current" messages (those near the seek head) and forward new
// messages to the worker as they arrive.
function useData(id: string, topics: readonly string[]) {
  const [subscribed, setSubscribed] = React.useState<string[]>([]);
  useEffect(() => {
    clients = {
      ...clients,
      [id]: {
        topics,
        setter: setSubscribed,
      },
    };
    chooseClient();
    return () => {
      const { [id]: _, ...rest } = clients;
      clients = rest;
      chooseClient();
    };
  }, [id, topics]);

  const isLive = useMessagePipeline<boolean>(getIsLive);
  React.useEffect(() => {
    void (async () => {
      const s = await waitService();
      await s.setLive(isLive);
    })();
  }, [isLive]);

  useCurrent<number>({
    topics: subscribed,
    restore: React.useCallback((state: number | undefined): number => {
      if (state == undefined) {
        void service?.clearCurrent();
      }
      return 0;
    }, []),
    addMessages: React.useCallback(
      (_: number | undefined, messages: readonly MessageEvent[]): number => {
        void service?.addCurrent(messages);
        return 1;
      },
      [isLive],
    ),
  });

  const blocks = useBlocks(subscribed);
  React.useEffect(() => {
    for (const [index, block] of blocks.entries()) {
      if (R.isEmpty(block)) {
        break;
      }

      // Package any new messages into a single bundle to send to the worker
      const messages: Messages = {};
      const status: BlockStatus = blockStatus[index] ?? {};
      for (const topic of subscribed) {
        const topicMessages = block[topic];
        if (topicMessages == undefined || status[topic] === true) {
          continue;
        }

        status[topic] = true;
        messages[topic] = topicMessages as MessageEvent[];
      }
      blockStatus[index] = status;

      if (!R.isEmpty(messages)) {
        void service?.addBlock(messages);
      }
    }
  }, [subscribed, blocks]);
}

// Mirror all of the topics and datatypes to the worker as necessary.
function useMetadata() {
  const { topics, datatypes } = useDataSourceInfo();
  useEffect(() => {
    void service?.receiveMetadata(topics, datatypes);
  }, [topics, datatypes]);

  const { globalVariables } = useGlobalVariables();
  useEffect(() => {
    void service?.receiveVariables(globalVariables);
  }, [globalVariables]);
}

export default function useDatasets(params: PlotParams): {
  data: Immutable<PlotData> | undefined;
  provider: TypedDataProvider;
  getFullData: () => Promise<PlotData | undefined>;
} {
  const id = useMemo(() => uuidv4(), []);

  const stableParams = useDeepMemo(params);
  const { xAxisPath, paths: yAxisPaths } = stableParams;

  const allPaths = useMemo(() => {
    return getPaths(yAxisPaths, xAxisPath);
  }, [xAxisPath, yAxisPaths]);

  const stablePaths = useShallowMemo(allPaths);
  const topics = useMemo(() => getTopicsFromPaths(stablePaths), [stablePaths]);

  useEffect(() => {
    if (worker == undefined) {
      worker = new Worker(
        // foxglove-depcheck-used: babel-plugin-transform-import-meta
        new URL("./useDatasets.worker", import.meta.url),
      );
      service = Comlink.wrap(worker);
      for (const other of pending) {
        other(service);
      }
    }

    numClients++;

    return () => {
      numClients--;
      if (numClients === 0) {
        worker?.terminate();
        worker = service = undefined;
      }
    };
  }, []);

  useMetadata();

  // Allow the worker direct access to `setState`.
  const [state, setState] = React.useState<Immutable<PlotData> | undefined>();
  useEffect(() => {
    return () => {
      void service?.unregister(id);
    };
  }, [id]);

  useData(id, topics);

  useEffect(() => {
    void service?.updateParams(id, stableParams);
  }, [id, stableParams]);

  const provider: TypedDataProvider = React.useMemo(
    () => ({
      setView: (view) => {
        void service?.updateView(id, view);
      },
      register: (setter, setPartial) => {
        void (async () => {
          const s = await waitService();
          void s.register(
            id,
            Comlink.proxy(setter),
            Comlink.proxy(setState),
            Comlink.proxy(setPartial),
          );
        })();
      },
    }),
    [id],
  );

  const getFullData = React.useMemo(
    () => async () => {
      const s = await waitService();
      return await s.getFullData(id);
    },
    [id],
  );

  return React.useMemo(
    () => ({
      data: state,
      provider,
      getFullData,
    }),
    [state, provider, getFullData],
  );
}
