// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ColorPicker } from "@fluentui/react";
import { Card, ClickAwayListener, TextField, styled as muiStyled } from "@mui/material";
import { useState } from "react";
import tinycolor from "tinycolor2";

import Stack from "@foxglove/studio-base/components/Stack";
import { fonts } from "@foxglove/studio-base/util/sharedStyleConstants";

import { ColorSwatch } from "./ColorSwatch";

const PickerWrapperLeft = muiStyled(Card)(({ theme }) => ({
  position: "absolute",
  zIndex: theme.zIndex.modal,
  top: "100%",
}));

const PickerWrapperRight = muiStyled(Card)(({ theme }) => ({
  position: "absolute",
  zIndex: theme.zIndex.modal,
  top: "100%",
  right: 0,
}));

export function ColorGradientInput({
  colors,
  onChange,
}: {
  colors: undefined | readonly [string, string];
  onChange: (colors: [string, string]) => void;
}): JSX.Element {
  const [showLeftPicker, setShowLeftPicker] = useState(false);
  const [showRightPicker, setShowRightPicker] = useState(false);
  const leftColor = colors?.[0] ?? "#000000";
  const rightColor = colors?.[1] ?? "#FFFFFF";
  const safeLeftColor = tinycolor(leftColor).isValid() ? leftColor : "#000000";
  const safeRightColor = tinycolor(rightColor).isValid() ? rightColor : "#FFFFFF";

  return (
    <Stack
      direction="row"
      style={{
        position: "relative",
        backgroundImage: `linear-gradient(to right, ${safeLeftColor}, ${safeRightColor})`,
      }}
    >
      <ColorSwatch color={safeLeftColor} onClick={() => setShowLeftPicker(true)} />
      <TextField
        variant="filled"
        size="small"
        fullWidth
        value={`${leftColor} / ${rightColor}`}
        style={{ visibility: "hidden" }}
      />
      <ColorSwatch color={safeRightColor} onClick={() => setShowRightPicker(true)} />
      {showLeftPicker && (
        <ClickAwayListener onClickAway={() => setShowLeftPicker(false)}>
          <PickerWrapperLeft variant="elevation">
            <ColorPicker
              color={leftColor}
              alphaType="alpha"
              styles={{
                tableHexCell: { width: "35%" },
                input: {
                  input: {
                    fontFeatureSettings: `${fonts.SANS_SERIF_FEATURE_SETTINGS}, 'zero'`,
                  },
                },
              }}
              onChange={(_event, newValue) => onChange([newValue.str, rightColor])}
            />
          </PickerWrapperLeft>
        </ClickAwayListener>
      )}
      {showRightPicker && (
        <ClickAwayListener onClickAway={() => setShowRightPicker(false)}>
          <PickerWrapperRight variant="elevation">
            <ColorPicker
              color={rightColor}
              alphaType="alpha"
              styles={{
                tableHexCell: { width: "35%" },
                input: {
                  input: {
                    fontFeatureSettings: `${fonts.SANS_SERIF_FEATURE_SETTINGS}, 'zero'`,
                  },
                },
              }}
              onChange={(_event, newValue) => onChange([leftColor, newValue.str])}
            />
          </PickerWrapperRight>
        </ClickAwayListener>
      )}
    </Stack>
  );
}
