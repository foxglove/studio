// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Stack, Typography } from "@mui/material";

export function StepContent({ title, content }: { title: string; content: string }): JSX.Element {
  return (
    <Stack padding={2} gap={1}>
      <Typography variant="h5" fontWeight={500}>
        {title}
      </Typography>
      <Typography variant="body2">{content}</Typography>
    </Stack>
  );
}
