// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StorybookDecorator } from "./StorybookDecorator";
import { UserMenu } from "./User";

export default {
  title: "components/AppBar/UserMenu",
  component: UserMenu,
  decorators: [StorybookDecorator],
};

export function Default(): JSX.Element {
  return (
    <>
      <UserMenu
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
