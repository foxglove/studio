// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Button as MuiButton, ButtonProps, Typography } from "@mui/material";
import { Meta, StoryObj } from "@storybook/react";
import { Fragment } from "react";

const variants: ButtonProps["variant"][] = ["text", "contained", "outlined"];
const sizes: ButtonProps["size"][] = ["large", "medium", "small"];
const colors: ButtonProps["color"][] = [
  "inherit",
  "primary",
  "secondary",
  "success",
  "error",
  "info",
  "warning",
];

export default {
  component: MuiButton,
  title: "theme/overrides",
  args: {
    children: "Button",
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ padding: 16 }}>
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    colorScheme: "both-column",
  },
} as Meta<typeof MuiButton>;

export const Button: StoryObj = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px repeat(9, max-content)",
        gap: 12,
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      <div /> {/* empty cell */}
      {variants.map((variant) => (
        <Typography key={variant} variant="overline" style={{ gridColumn: "span 3" }}>
          {variant}
        </Typography>
      ))}
      {colors.map((color) =>
        variants.map((variant, idx) => (
          <Fragment key={variant}>
            {idx === 0 && (
              <Typography variant="overline" style={{ justifySelf: "flex-start" }}>
                {color}
              </Typography>
            )}
            {sizes.map((size) => (
              <MuiButton {...{ ...args, color, variant, size }} key={color}>
                Button
              </MuiButton>
            ))}
          </Fragment>
        )),
      )}
    </div>
  ),
};
