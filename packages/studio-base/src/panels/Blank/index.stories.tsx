// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Story, StoryContext } from "@storybook/react";

import Blank from "@foxglove/studio-base/panels/Blank";
import PanelSetup from "@foxglove/studio-base/stories/PanelSetup";

export default {
  title: "panels/Blank",
  component: Blank,
  decorators: [
    (StoryComponent: Story, context: StoryContext): JSX.Element => {
      return (
        <PanelSetup includeSettings={context.parameters.includeSettings}>
          <StoryComponent />
        </PanelSetup>
      );
    },
  ],
};

export function Default(): JSX.Element {
  return <Blank />;
}
Default.parameters = { colorScheme: "both-column" };

export function NoLogo(): JSX.Element {
  return <Blank />;
}
NoLogo.parameters = { colorScheme: "both-column" };

export function WithSettings(): JSX.Element {
  return <Blank />;
}
WithSettings.parameters = { colorScheme: "both-column", includeSettings: true };
