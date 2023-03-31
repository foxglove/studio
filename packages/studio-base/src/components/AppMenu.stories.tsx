// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import AppMenu from "@foxglove/studio-base/components/AppMenu";

export default {
  title: "components/AppMenu",
  component: AppMenu,
};

export function Default(): JSX.Element {
  return (
    <AppMenu
      open
      anchorPosition={{ top: 0, left: 0 }}
      anchorReference="anchorPosition"
      disablePortal
      handleClose={() => {
        // no-op
      }}
    />
  );
}
