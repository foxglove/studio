// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ScopedCssBaseline } from "@mui/material";
import { StoryObj } from "@storybook/react";

export default {
  component: ScopedCssBaseline,
  title: "components/CssBaseline",
  parameters: {
    colorScheme: "light",
  },
};

export const Scrollbars: StoryObj = {
  render: () => {
    return (
      <ScopedCssBaseline>
        <div
          style={{ width: "200px", height: "200px", border: "1px solid black", overflow: "scroll" }}
        >
          <div style={{ width: "400px", height: "400px" }}>Should have both scrollbars</div>
        </div>
      </ScopedCssBaseline>
    );
  },
};

export const FontFeatureSettings: StoryObj = {
  render: () => {
    // See https://github.com/foxglove/studio/pull/5113#discussion_r1106619194
    return (
      <ScopedCssBaseline>
        cv08: I
        <br />
        cv10: G
        <br />
        显示时间戳在
      </ScopedCssBaseline>
    );
  },
};

export const FontFeatureSettingsChinese: StoryObj = {
  ...FontFeatureSettings,
  parameters: { forceLanguage: "zh" },
};

export const FontFeatureSettingsJapanese: StoryObj = {
  ...FontFeatureSettings,
  parameters: { forceLanguage: "ja" },
};
