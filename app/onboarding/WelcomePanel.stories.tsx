// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import WelcomePanel from "@foxglove-studio/app/onboarding/WelcomePanel";
import PanelSetup from "@foxglove-studio/app/stories/PanelSetup";

export default {
  title: "<WelcomePanel>",
  component: WelcomePanel,
};

export function Example(): React.ReactElement {
  return (
    <PanelSetup>
      <WelcomePanel />
    </PanelSetup>
  );
}
