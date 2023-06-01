// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MosaicPath } from "react-mosaic-component";
import { MosaicDropTargetPosition } from "react-mosaic-component/lib/internalTypes";

import { PanelConfig, SavedProps } from "@foxglove/studio-base/types/panels";

export type PanelSelection = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: { [panelId: string]: PanelConfig };
};

export type DropDescription = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: SavedProps;
  position?: MosaicDropTargetPosition;
  path?: MosaicPath;
  tabId?: string;
};
