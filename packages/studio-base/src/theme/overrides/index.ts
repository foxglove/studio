// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Components, Theme } from "@mui/material";
// import type {} from "@mui/lab/themeAugmentation";

import * as components from "./components";

export function overrides(theme: Theme): Components<Theme> {
  return Object(components)
    .entries()
    .reduce((acc: Components, fn: (theme: Theme) => Components) => {
      return { ...acc, ...fn(theme) };
    }, {});
}
