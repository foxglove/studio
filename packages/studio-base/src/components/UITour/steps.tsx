// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Typography } from "@mui/material";
import { StepType } from "@reactour/tour";

import Stack from "@foxglove/studio-base/components/Stack";

const tourId = (id: string) => `[data-tourid=${id}]`;

function StepContent({ title, content }: { title: string; content: string }): JSX.Element {
  return (
    <Stack padding={2} gap={1}>
      <Typography variant="h3" fontWeight={500}>
        {title}
      </Typography>
      <Typography>{content}</Typography>
    </Stack>
  );
}

const steps: StepType[] = [
  {
    selector: tourId("app-bar"),
    content: (
      <StepContent
        title="App Bar"
        content="All of your high-level information and controls now live in the top bar."
      />
    ),
    padding: 0,
    position: "top",
  },
  {
    selector: tourId("app-menu"),
    content: (
      <StepContent
        title="App Menu"
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis ligula placerat nisl condimentum vulputate."
      />
    ),
  },
];

export default steps;
