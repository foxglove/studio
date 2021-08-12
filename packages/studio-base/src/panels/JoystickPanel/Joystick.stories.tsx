// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { action } from "@storybook/addon-actions";

import Joystick from "./Joystick";

export default {
  title: "panels/Joystick/Joystick",
  component: Joystick,
};

export const Basic = (): JSX.Element => {
  return <Joystick onClick={action("click")} />;
};
