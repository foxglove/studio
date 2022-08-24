// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useTheme } from "@mui/material";
import { isEqual } from "lodash";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUpdateEffect } from "react-use";
import { v4 as uuid } from "uuid";

import Logger from "@foxglove/log";
import { fromSec, toSec } from "@foxglove/rostime";
import {
  AppSettingValue,
  ExtensionPanelRegistration,
  MessageEvent,
  PanelExtensionContext,
  ParameterValue,
  RenderState,
  SettingsTree,
  Subscription,
  Topic,
  VariableValue,
} from "@foxglove/studio";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { usePanelContext } from "@foxglove/studio-base/components/PanelContext";
import PanelToolbar from "@foxglove/studio-base/components/PanelToolbar";
import { useAppConfiguration } from "@foxglove/studio-base/context/AppConfigurationContext";
import {
  useClearHoverValue,
  useHoverValue,
  useSetHoverValue,
} from "@foxglove/studio-base/context/HoverValueContext";
import useGlobalVariables, {
  EMPTY_GLOBAL_VARIABLES,
  GlobalVariables,
} from "@foxglove/studio-base/hooks/useGlobalVariables";
import {
  AdvertiseOptions,
  PlayerCapabilities,
  PlayerState,
  SubscribePayload,
} from "@foxglove/studio-base/players/types";
import { usePanelSettingsTreeUpdate } from "@foxglove/studio-base/providers/PanelSettingsEditorContextProvider";
import { HoverValue } from "@foxglove/studio-base/types/hoverValue";
import { PanelConfig, SaveConfig } from "@foxglove/studio-base/types/panels";
import { assertNever } from "@foxglove/studio-base/util/assertNever";

const log = Logger.getLogger(__filename);

type PanelExtensionAdapterProps = {
  /** function that initializes the panel extension */
  initPanel: ExtensionPanelRegistration["initPanel"];

  config: unknown;
  saveConfig: SaveConfig<unknown>;

  /** Help document for the panel */
  help?: string;
};

const EmptyParameters = new Map<string, ParameterValue>();

const EmptyTopics: readonly Topic[] = [];

function selectSetSubscriptions(ctx: MessagePipelineContext) {
  return ctx.setSubscriptions;
}

function selectRequestBackfill(ctx: MessagePipelineContext) {
  return ctx.requestBackfill;
}

function selectCapabilities(ctx: MessagePipelineContext) {
  return ctx.playerState.capabilities;
}

function selectProfile(ctx: MessagePipelineContext) {
  return ctx.playerState.profile;
}

function selectSeekPlayback(ctx: MessagePipelineContext) {
  return ctx.seekPlayback;
}

function selectContext(ctx: MessagePipelineContext) {
  return ctx;
}

type RenderFn = (renderState: Readonly<RenderState>, done: () => void) => void;

function generateRender() {
  let prevVariables: GlobalVariables = EMPTY_GLOBAL_VARIABLES;
  let prevBlocks: unknown;
  let prevSeekTime: number | undefined;
  let prevSubscribedTopics: string[];

  const prevRenderState: RenderState = {};

  return function renderImpl(input: {
    watchedFields: Set<string>;
    playerState?: PlayerState;
    appSettings?: Map<string, AppSettingValue>;
    currentFrame?: MessageEvent<unknown>[];
    colorScheme?: RenderState["colorScheme"];
    globalVariables: GlobalVariables;
    hoverValue?: HoverValue;
    subscribedTopics: string[];
  }) {
    const {
      playerState,
      watchedFields,
      appSettings,
      currentFrame,
      colorScheme,
      globalVariables,
      hoverValue,
      subscribedTopics,
    } = input;

    // If the player has loaded all the blocks, the blocks reference won't change so our message
    // pipeline handler for allFrames won't create a new set of all frames for the newly
    // subscribed topic. To ensure a new set of allFrames with the newly subscribed topic is
    // created, we unset the blocks ref which will force re-creating allFrames.
    if (subscribedTopics !== prevSubscribedTopics) {
      prevBlocks = undefined;
    }

    // Should render indicates whether any fields of render state are updated
    let shouldRender = false;

    const activeData = playerState?.activeData;

    // The render state starts with the previous render state and changes are applied as detected
    const renderState: RenderState = prevRenderState;

    if (watchedFields.has("didSeek")) {
      const didSeek = prevSeekTime !== activeData?.lastSeekTime;
      if (didSeek !== renderState.didSeek) {
        renderState.didSeek = didSeek;
        shouldRender = true;
      }
      prevSeekTime = activeData?.lastSeekTime;
    }

    if (watchedFields.has("currentFrame")) {
      // If there are new frames we render
      // If there are old frames we render (new frames either replace old or no new frames)
      // Note: renderState.currentFrame.length !== currentFrame.length is wrong because it
      // won't render when the number of messages is the same from old to new
      if (renderState.currentFrame?.length !== 0 || currentFrame?.length !== 0) {
        shouldRender = true;
        renderState.currentFrame = currentFrame;
      }
    }

    if (watchedFields.has("parameters")) {
      const parameters = activeData?.parameters ?? EmptyParameters;
      if (parameters !== renderState.parameters) {
        shouldRender = true;
        renderState.parameters = parameters;
      }
    }

    if (watchedFields.has("variables")) {
      if (globalVariables !== prevVariables) {
        shouldRender = true;
        prevVariables = globalVariables;
        renderState.variables = new Map(Object.entries(globalVariables));
      }
    }

    if (watchedFields.has("topics")) {
      const newTopics = activeData?.topics ?? EmptyTopics;
      if (newTopics !== prevRenderState.topics) {
        shouldRender = true;
        renderState.topics = newTopics;
      }
    }

    if (watchedFields.has("allFrames")) {
      // see comment for prevBlocksRef on why extended message store updates are gated this way
      const newBlocks = playerState?.progress.messageCache?.blocks;
      if (newBlocks && prevBlocks !== newBlocks) {
        shouldRender = true;
        const frames: MessageEvent<unknown>[] = (renderState.allFrames = []);
        for (const block of newBlocks) {
          if (!block) {
            continue;
          }

          for (const messageEvents of Object.values(block.messagesByTopic)) {
            for (const messageEvent of messageEvents) {
              if (!subscribedTopics.includes(messageEvent.topic)) {
                continue;
              }
              frames.push(messageEvent);
            }
          }
        }
      }
      prevBlocks = newBlocks;
    }

    if (watchedFields.has("currentTime")) {
      const currentTime = activeData?.currentTime;

      if (currentTime != undefined && currentTime !== renderState.currentTime) {
        shouldRender = true;
        renderState.currentTime = currentTime;
      } else {
        if (renderState.currentTime != undefined) {
          shouldRender = true;
        }
        renderState.currentTime = undefined;
      }
    }

    if (watchedFields.has("previewTime")) {
      const startTime = activeData?.startTime;

      if (startTime != undefined && hoverValue != undefined) {
        const stamp = toSec(startTime) + hoverValue.value;
        if (stamp !== renderState.previewTime) {
          shouldRender = true;
        }
        renderState.previewTime = stamp;
      } else {
        if (renderState.previewTime != undefined) {
          shouldRender = true;
        }
        renderState.previewTime = undefined;
      }
    }

    if (watchedFields.has("colorScheme")) {
      if (colorScheme !== renderState.colorScheme) {
        shouldRender = true;
        renderState.colorScheme = colorScheme;
      }
    }

    if (watchedFields.has("appSettings")) {
      if (renderState.appSettings !== appSettings) {
        shouldRender = true;
        renderState.appSettings = appSettings;
      }
    }

    if (!shouldRender) {
      return undefined;
    }

    return renderState;
  };
}

/**
 * PanelExtensionAdapter renders a panel extension via initPanel
 *
 * The adapter creates a PanelExtensionContext and invokes initPanel using the context.
 */
function PanelExtensionAdapter(props: PanelExtensionAdapterProps): JSX.Element {
  const { initPanel, config, saveConfig } = props;

  // Buffer initial state so initPanel is not called on every config update.
  const [initialState, setInitialState] = useState(config);

  const setSubscriptions = useMessagePipeline(selectSetSubscriptions);
  const requestBackfill = useMessagePipeline(selectRequestBackfill);
  const capabilities = useMessagePipeline(selectCapabilities);
  const dataSourceProfile = useMessagePipeline(selectProfile);
  const seekPlayback = useMessagePipeline(selectSeekPlayback);
  const { openSiblingPanel } = usePanelContext();

  const [panelId] = useState(() => uuid());

  const [error, setError] = useState<Error | undefined>();
  const [watchedFields, setWatchedFields] = useState(new Set<keyof RenderState>());

  // When subscribing to preloaded topics we use this array to filter the raw blocks to include only
  // the topics we subscribed to in the allFrames render state. Otherwise the panel would receive
  // messages in allFrames for topics the panel did not subscribe to.
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([]);

  const [appSettings, setAppSettings] = useState(new Map<string, AppSettingValue>());
  const [subscribedAppSettings, setSubscribedAppSettings] = useState<string[]>([]);

  const [renderFn, setRenderFn] = useState<RenderFn | undefined>();

  const [slowRender, setSlowRender] = useState(false);

  const { globalVariables, setGlobalVariables } = useGlobalVariables();

  const hoverValue = useHoverValue({
    componentId: `PanelExtensionAdapter:${panelId}`,
    isTimestampScale: true,
  });
  const setHoverValue = useSetHoverValue();
  const clearHoverValue = useClearHoverValue();

  // track the advertisements requested by the panel context
  // topic -> advertisement
  const advertisementsRef = useRef(new Map<string, AdvertiseOptions>());

  // Reset panel when config is cleared.
  useUpdateEffect(() => {
    if (isEqual(config, {})) {
      setInitialState(config);
    }
  }, [config]);

  const {
    palette: { mode: colorScheme },
  } = useTheme();

  const appConfiguration = useAppConfiguration();

  const computeRenderState = useMemo(() => generateRender(), []);

  useEffect(() => {
    const handlers = new Map<string, (newValue: AppSettingValue) => void>();

    for (const key of subscribedAppSettings) {
      const handler = (newValue: AppSettingValue) => {
        setAppSettings((old) => {
          old.set(key, newValue);
          return new Map(old);
        });
      };
      handlers.set(key, handler);
      appConfiguration.addChangeListener(key, handler);
    }

    const newAppSettings = new Map<string, AppSettingValue>();
    for (const key of subscribedAppSettings) {
      newAppSettings.set(key, appConfiguration.get(key));
    }

    setAppSettings(newAppSettings);

    return () => {
      for (const [key, handler] of handlers.entries()) {
        appConfiguration.removeChangeListener(key, handler);
      }
    };
  }, [appConfiguration, subscribedAppSettings]);

  const messagePipelineContext = useMessagePipeline(selectContext);
  const { playerState } = messagePipelineContext;

  const renderingRef = useRef<boolean>(false);
  useLayoutEffect(() => {
    if (!renderFn) {
      return;
    }

    const renderState = computeRenderState({
      watchedFields,
      globalVariables,
      hoverValue,
      playerState,
      colorScheme,
      appSettings,
      subscribedTopics,
    });

    if (!renderState) {
      return;
    }

    if (renderingRef.current) {
      // fixme - keep a warn? do something else?
      console.warn("Could not render frame because already rendering");
      setSlowRender(true);
      return;
    }

    setSlowRender(false);
    const resumeFrame = messagePipelineContext.pauseFrame(panelId);

    // tell the panel to render and lockout future renders until rendering is complete
    renderingRef.current = true;
    try {
      setError(undefined);
      let doneCalled = false;
      renderFn(renderState, () => {
        // ignore any additional done calls from the panel
        if (doneCalled) {
          return;
        }
        doneCalled = true;
        resumeFrame();
        renderingRef.current = false;
      });
    } catch (err) {
      setError(err);
    }
  }, [
    panelId,
    messagePipelineContext,
    subscribedTopics,
    watchedFields,
    appSettings,
    hoverValue,
    playerState,
    renderFn,
    colorScheme,
    computeRenderState,
    globalVariables,
  ]);

  const updatePanelSettingsTree = usePanelSettingsTreeUpdate();

  const updateSettings = useCallback(
    (settings: SettingsTree) => {
      updatePanelSettingsTree(settings);
    },
    [updatePanelSettingsTree],
  );

  type PartialPanelExtensionContext = Omit<PanelExtensionContext, "panelElement">;
  const partialExtensionContext = useMemo<PartialPanelExtensionContext>(() => {
    const layout: PanelExtensionContext["layout"] = {
      addPanel({ position, type, updateIfExists, getState }) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (position === "sibling") {
          openSiblingPanel({
            panelType: type,
            updateIfExists,
            siblingConfigCreator: (existingConfig) => getState(existingConfig) as PanelConfig,
          });
          return;
        }
        assertNever(position, `Unsupported position for addPanel: ${position}`);
      },
    };

    return {
      initialState,

      saveState: saveConfig,

      layout,

      seekPlayback: seekPlayback ? (stamp: number) => seekPlayback(fromSec(stamp)) : undefined,

      dataSourceProfile,

      setParameter: (name: string, value: ParameterValue) => {
        messagePipelineContext.setParameter(name, value);
      },

      setVariable: (name: string, value: VariableValue) => {
        setGlobalVariables({ [name]: value });
      },

      setPreviewTime: (stamp: number | undefined) => {
        if (stamp == undefined) {
          clearHoverValue("PanelExtensionAdatper");
        } else {
          const ctx = messagePipelineContext;
          const startTime = ctx.playerState.activeData?.startTime;
          // if we don't have a start time we cannot correctly set the playback seconds hover value
          // this hover value needs seconds from start
          if (!startTime) {
            return;
          }
          const secondsFromStart = stamp - toSec(startTime);
          setHoverValue({
            type: "PLAYBACK_SECONDS",
            componentId: "PanelExtensionAdatper",
            value: secondsFromStart,
          });
        }
      },

      watch: (field: keyof RenderState) => {
        setWatchedFields((old) => {
          old.add(field);
          return new Set(old);
        });
      },

      subscribe: (topics: ReadonlyArray<string | Subscription>) => {
        const newSubscribedTopics: string[] = [];
        const subscribePayloads = topics.map<SubscribePayload>((item) => {
          if (typeof item === "string") {
            newSubscribedTopics.push(item);
            // For backwards compatability with the topic-string-array api `subscribe(["/topic"])`
            // results in a topic subscription with full preloading
            return { topic: item, preloadType: "full" };
          }

          newSubscribedTopics.push(item.topic);
          return {
            topic: item.topic,
            preloadType: item.preload === true ? "full" : "partial",
          };
        });

        setSubscribedTopics(newSubscribedTopics);
        setSubscriptions(panelId, subscribePayloads);
        if (topics.length > 0) {
          requestBackfill();
        }
      },

      advertise: capabilities.includes(PlayerCapabilities.advertise)
        ? (topic: string, datatype: string, options) => {
            const payload: AdvertiseOptions = {
              topic,
              datatype,
              options,
            };
            advertisementsRef.current.set(topic, payload);

            messagePipelineContext.setPublishers(
              panelId,
              Array.from(advertisementsRef.current.values()),
            );
          }
        : undefined,

      unadvertise: capabilities.includes(PlayerCapabilities.advertise)
        ? (topic: string) => {
            advertisementsRef.current.delete(topic);
            messagePipelineContext.setPublishers(
              panelId,
              Array.from(advertisementsRef.current.values()),
            );
          }
        : undefined,

      publish: capabilities.includes(PlayerCapabilities.advertise)
        ? (topic, message) => {
            messagePipelineContext.publish({
              topic,
              msg: message as Record<string, unknown>,
            });
          }
        : undefined,

      callService: capabilities.includes(PlayerCapabilities.callServices)
        ? async (service, request): Promise<unknown> => {
            return await messagePipelineContext.callService(service, request);
          }
        : undefined,

      unsubscribeAll: () => {
        setSubscribedTopics([]);
        setSubscriptions(panelId, []);
      },

      subscribeAppSettings: (settings: string[]) => {
        setSubscribedAppSettings(settings);
      },

      updatePanelSettingsEditor: updateSettings,
    };
  }, [
    capabilities,
    clearHoverValue,
    dataSourceProfile,
    initialState,
    messagePipelineContext,
    openSiblingPanel,
    panelId,
    requestBackfill,
    saveConfig,
    seekPlayback,
    setGlobalVariables,
    setHoverValue,
    setSubscriptions,
    updateSettings,
  ]);

  const panelContainerRef = useRef<HTMLDivElement>(ReactNull);

  // Manage extension lifecycle by calling initPanel() when the panel context changes.
  //
  // If we useEffect here instead of useLayoutEffect, the prevRenderState can get polluted with data
  // from a previous panel instance.
  useLayoutEffect(() => {
    if (!panelContainerRef.current) {
      throw new Error("Expected panel container to be mounted");
    }

    // Reset local state when the panel element is mounted or changes
    setRenderFn(undefined);

    const panelElement = document.createElement("div");
    panelElement.style.width = "100%";
    panelElement.style.height = "100%";
    panelElement.style.overflow = "hidden";
    panelContainerRef.current.appendChild(panelElement);

    log.info(`Init panel ${panelId}`);
    initPanel({
      panelElement,
      ...partialExtensionContext,

      // eslint-disable-next-line no-restricted-syntax
      set onRender(renderFunction: RenderFn | undefined) {
        setRenderFn(() => renderFunction);
      },
    });

    return () => {
      panelElement.remove();
      messagePipelineContext.setSubscriptions(panelId, []);
      messagePipelineContext.setPublishers(panelId, []);
    };
  }, [initPanel, panelId, partialExtensionContext, messagePipelineContext]);

  const style: CSSProperties = {};
  if (slowRender) {
    style.borderColor = "orange";
    style.borderWidth = "1px";
    style.borderStyle = "solid";
  }

  if (error) {
    throw error;
  }

  return (
    <div
      style={{
        alignItems: "stretch",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        width: "100%",
        zIndex: 0,
        ...style,
      }}
    >
      <PanelToolbar helpContent={props.help} />
      <div style={{ flex: 1, overflow: "hidden" }} ref={panelContainerRef} />
    </div>
  );
}

export default PanelExtensionAdapter;
