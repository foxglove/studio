// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ReactElement } from "react";

import GenericSettingsEditor from "./GenericSettingsEditor";

export default {
  title: "panels/ThreeDimensionalViz/TopicSettingsEditor/GenericSettingsEditor",
  component: GenericSettingsEditor,
};

export function Default(): ReactElement {
  return (
    <GenericSettingsEditor
      onFieldChange={() => undefined}
      onSettingsChange={() => undefined}
      settings={{}}
    />
  );
}
