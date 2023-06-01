// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { isEmpty } from "lodash";
import { ComponentType, createContext, useContext } from "react";

import { PanelStatics } from "@foxglove/studio-base/components/Panel";
import { ExtensionNamespace } from "@foxglove/studio-base/types/Extensions";
import { PanelConfig } from "@foxglove/studio-base/types/panels";
import { mightActuallyBePartial } from "@foxglove/studio-base/util/mightActuallyBePartial";

export type PanelComponent = ComponentType<{ childId?: string; tabId?: string }> &
  PanelStatics<PanelConfig>;

export type PanelInfo = {
  title: string;
  type: string;
  description?: string;
  thumbnail?: string;
  help?: React.ReactNode;

  /** Set this to true if a panel has custom toolbar items and so cannot be renamed. */
  hasCustomToolbar?: boolean;

  /**
   * The panel module is a function to load the panel.
   * This is to support our lazy built-in panels
   */
  module: () => Promise<{ default: PanelComponent }>;
  config?: PanelConfig;
  relatedConfigs?: { [panelId: string]: PanelConfig };
  preconfigured?: boolean;
  extensionNamespace?: ExtensionNamespace;
};

/** PanelCatalog describes the interface for getting available panels */
export interface PanelCatalog {
  /** get a list of the available panels */
  getPanels(): readonly PanelInfo[];

  /** Get panel information for a specific panel type (i.e. 3d, map, image, etc) */
  getPanelByType(type: string): PanelInfo | undefined;
}

const PanelCatalogContext = createContext<PanelCatalog | undefined>(undefined);
PanelCatalogContext.displayName = "PanelCatalogContext";

export function usePanelCatalog(): PanelCatalog {
  const panelCatalog = useContext(PanelCatalogContext);
  if (!panelCatalog) {
    throw new Error("A PanelCatalogContext provider is required to usePanelCatalog");
  }

  return panelCatalog;
}

// sanity checks to help panel authors debug issues
export function verifyPanels(panels: readonly PanelInfo[]): void {
  const panelTypes: Map<string, PanelInfo> = new Map();
  for (const panel of panels) {
    const { title, type, config } = mightActuallyBePartial(panel);
    const dispName = title ?? type ?? "<unnamed>";
    if (type == undefined || type.length === 0) {
      throw new Error(`Panel component ${title} must declare a unique \`static panelType\``);
    }
    const existingPanel = mightActuallyBePartial(panelTypes.get(type));
    if (existingPanel) {
      const bothHaveEmptyConfigs = isEmpty(existingPanel.config) && isEmpty(config);
      if (bothHaveEmptyConfigs) {
        const otherDisplayName = existingPanel.title ?? existingPanel.type ?? "<unnamed>";
        throw new Error(
          `Two components have the same panelType ('${type}') and no preset configs: ${otherDisplayName} and ${dispName}`,
        );
      }
    }
    panelTypes.set(type, panel);
  }
}

export default PanelCatalogContext;
