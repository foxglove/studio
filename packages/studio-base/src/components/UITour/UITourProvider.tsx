// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useTheme } from "@mui/material";
import { TourProvider } from "@reactour/tour";
import { PropsWithChildren } from "react";
import tc from "tinycolor2";

import { PopoverContent } from "./PopoverContent";
import tourSteps from "./steps";

export function UITourProvider(props: PropsWithChildren<unknown>): JSX.Element {
  const theme = useTheme();
  const { children } = props;

  return (
    <TourProvider
      steps={tourSteps}
      onClickClose={({ setIsOpen, setCurrentStep }) => {
        setCurrentStep(0);
        setIsOpen(false);
      }}
      onClickMask={({ setIsOpen, setCurrentStep }) => {
        setCurrentStep(0);
        setIsOpen(false);
      }}
      styles={{
        popover: (base) => ({
          ...base,
          margin: 12,
          padding: undefined,
          backgroundColor: undefined,
          color: undefined,
        }),
        maskWrapper: (base) => ({
          ...base,
          color: tc(theme.palette.common.black).setAlpha(0.4).toString(),
        }),
      }}
      ContentComponent={PopoverContent}
    >
      {children}
    </TourProvider>
  );
}
