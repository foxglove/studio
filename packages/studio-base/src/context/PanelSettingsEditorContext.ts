// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext } from "react";
import { DeepReadonly } from "ts-essentials";
import { StoreApi } from "zustand";

import { SettingsTree } from "@foxglove/studio";

export type ImmutableSettingsTree = DeepReadonly<SettingsTree>;

export type PanelSettingsEditorStore = {
  settingsTrees: Record<string, ImmutableSettingsTree>;
  updateSettingsTree: (panelId: string, settingsTree: ImmutableSettingsTree) => void;
};

export const PanelSettingsEditorContext = createContext<
  undefined | StoreApi<PanelSettingsEditorStore>
>(undefined);
