// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext } from "react";
import { StoreApi, useStore } from "zustand";

import useGuaranteedContext from "@foxglove/studio-base/hooks/useGuaranteedContext";

type StudioLogControlChannel = { name: string; enabled: boolean };

interface IStudioLogsControl {
  readonly channels: ReadonlyArray<{ name: string; enabled: boolean }>;

  // Enable/disable a channel. Name is the full name of the channel.
  enableChannel(name: string): void;
  disableChannel(name: string): void;

  // Enable/disable an entire prefix. Any channels with a name starting with the prefix will be toggled
  enablePrefix(prefix: string): void;
  disablePrefix(prefix: string): void;
}

const StudioLogsControlContext = createContext<undefined | StoreApi<IStudioLogsControl>>(undefined);

function useStudioLogsControl(): IStudioLogsControl {
  const context = useGuaranteedContext(StudioLogsControlContext);
  return useStore(context);
}

export { StudioLogsControlContext, useStudioLogsControl };
export type { IStudioLogsControl, StudioLogControlChannel };
