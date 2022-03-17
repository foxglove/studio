// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { Checkbox, FormControlLabel, Stack } from "@mui/material";

import { Marker, MarkerArray } from "@foxglove/studio-base/types/Messages";

import { TopicSettingsEditorProps } from ".";
import { SDescription } from "./common";

type GenericSettings = {
  frameLocked?: boolean;
};

export default function GenericSettingsEditor(
  props: TopicSettingsEditorProps<Marker | MarkerArray, GenericSettings>,
): JSX.Element {
  const { settings = {}, onFieldChange } = props;
  return (
    <Stack flex="auto">
      <FormControlLabel
        control={
          <Checkbox
            checked={settings.frameLocked === true}
            onChange={(_ev, checked) => onFieldChange("frameLocked", checked)}
          />
        }
        label="Frame lock"
      />
      <SDescription>
        By default, topics are translated into the 3d scene using their header stamp time. Enabling
        frame lock switches the translation to use the current playback time when translating the
        topic into its place within the 3d scene.
      </SDescription>
    </Stack>
  );
}
