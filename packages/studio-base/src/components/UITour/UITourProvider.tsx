// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { TourProvider, StepType } from "@reactour/tour";
import { PropsWithChildren } from "react";

const steps: StepType[] = [
  {
    selector: ".first-step",
    content: "This is my first Step",
    position: "right",
  },
];

export function UITourProvider(props: PropsWithChildren<unknown>): JSX.Element {
  const { children } = props;

  return <TourProvider steps={steps}>{children}</TourProvider>;
}
