// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Card } from "@mui/material";
import { TourProvider, PopoverContentProps, StepType } from "@reactour/tour";
import { PropsWithChildren } from "react";

import Stack from "@foxglove/studio-base/components/Stack";

const tourSteps: StepType[] = [
  {
    selector: "[data-tourid=app-bar]",
    content: <Stack padding={2}>This is my first Step</Stack>,
    padding: 0,
    position: "top",
  },
];

function ContentComponent(props: PopoverContentProps): JSX.Element {
  const { currentStep, steps } = props;

  const step = steps[currentStep];

  return <Card variant="elevation">{step?.content}</Card>;
}

export function UITourProvider(props: PropsWithChildren<unknown>): JSX.Element {
  const { children } = props;

  return (
    <TourProvider
      steps={tourSteps}
      styles={{
        popover: (base) => ({
          ...base,
          margin: 16,
          padding: undefined,
          backgroundColor: undefined,
          color: undefined,
        }),
      }}
      ContentComponent={ContentComponent}
    >
      {children}
    </TourProvider>
  );
}
