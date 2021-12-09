// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import OpenDialog from "./OpenDialog";

export default {
  component: OpenDialog,
  title: "components/OpenDialog",
};

export const Start = (): JSX.Element => <OpenDialog />;

export const Remote = (): JSX.Element => <OpenDialog activeView="remote" />;

export const Connection = (): JSX.Element => <OpenDialog activeView="connection" />;
export const Connection1 = (): JSX.Element => (
  <OpenDialog activeView="connection" selectedConnection={1} />
);
export const Connection2 = (): JSX.Element => (
  <OpenDialog activeView="connection" selectedConnection={2} />
);
export const Connection3 = (): JSX.Element => (
  <OpenDialog activeView="connection" selectedConnection={3} />
);
