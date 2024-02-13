// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type PlaybackConfig = {
  repeat: boolean;
  speed: 0.01 | 0.02 | 0.05 | 0.1 | 0.2 | 0.5 | 0.8 | 1 | 2 | 3 | 5;
};
