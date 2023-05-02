// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StoryObj } from "@storybook/react";

import { PanelConfigVersionGuard, VERSION_CONFIG_KEY } from "./PanelConfigVersionGuard";

export default {
  component: PanelConfigVersionGuard,
  title: "components/PanelConfigVersionGuard",
};

export const Default: StoryObj = {
  render: () => (
    <PanelConfigVersionGuard highestSupportedVersion={1} config={{ [VERSION_CONFIG_KEY]: 1 }}>
      OK
    </PanelConfigVersionGuard>
  ),
};

export const Incompatible: StoryObj = {
  render: () => (
    <PanelConfigVersionGuard highestSupportedVersion={1} config={{ [VERSION_CONFIG_KEY]: 2 }}>
      Not OK
    </PanelConfigVersionGuard>
  ),
};

export const NoVersion: StoryObj = {
  render: () => (
    <PanelConfigVersionGuard highestSupportedVersion={1} config={{}}>
      OK
    </PanelConfigVersionGuard>
  ),
};
