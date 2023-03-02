// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { HelpMenu } from "@foxglove/studio-base/components/AppBar/HelpMenu";
import { Wrapper } from "@foxglove/studio-base/components/AppBar/index.stories";

export default {
  title: "components/AppBar/Help",
  component: HelpMenu,
  decorators: [Wrapper],
};

export function Default(): JSX.Element {
  return (
    <>
      <HelpMenu
        open
        anchorReference="anchorPosition"
        anchorPosition={{ left: 0, top: 0 }}
        disablePortal
        handleClose={() => {
          // no-op
        }}
      />
    </>
  );
}
