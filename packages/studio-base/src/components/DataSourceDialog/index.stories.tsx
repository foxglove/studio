// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DataSourceDialog } from "./DataSourceDialog";

export default {
  title: "components/DataSourceDialog",
  component: DataSourceDialog,
};

export const DefaultLight = (): JSX.Element => <DataSourceDialog />;
DefaultLight.parameters = { colorScheme: "light" };
DefaultLight.storyName = "Default (light)";

export const DefaultDark = (): JSX.Element => <DataSourceDialog />;
DefaultDark.parameters = { colorScheme: "dark" };
DefaultDark.storyName = "Default (dark)";
