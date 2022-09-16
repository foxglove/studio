// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useTheme as useFluentTheme } from "@fluentui/react";
import { Box, Stack, Typography } from "@mui/material";

export default {
  title: "Theme",
};

function ColorStory({ colors }: { colors: [string, string][] }) {
  return (
    <Stack flexWrap="wrap" padding={2} overflow="auto">
      {colors.map(([name, color]) => (
        <Stack key={name} direction="row" alignItems="center" spacing={1} padding={0.5}>
          <Box key={name} bgcolor={color} width={32} height={32} />
          <div>{name}</div>
        </Stack>
      ))}
    </Stack>
  );
}

export function Palette(): JSX.Element {
  const theme = useFluentTheme();
  return <ColorStory colors={Object.entries(theme.palette)} />;
}

export function SemanticColors(): JSX.Element {
  const theme = useFluentTheme();
  return (
    <ColorStory
      colors={Object.entries(theme.semanticColors).sort(([name1], [name2]) =>
        name1.localeCompare(name2),
      )}
    />
  );
}

export function TypographyCatalog(): JSX.Element {
  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        h1. Heading
      </Typography>
      <Typography variant="h2" gutterBottom>
        h2. Heading
      </Typography>
      <Typography variant="h3" gutterBottom>
        h3. Heading
      </Typography>
      <Typography variant="h4" gutterBottom>
        h4. Heading
      </Typography>
      <Typography variant="h5" gutterBottom>
        h5. Heading
      </Typography>
      <Typography variant="h6" gutterBottom>
        h6. Heading
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        subtitle1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        subtitle2. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
      </Typography>
      <Typography variant="body1" gutterBottom>
        body1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
        unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam
        dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.
      </Typography>
      <Typography variant="body2" gutterBottom>
        body2. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
        unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam
        dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.
      </Typography>
      <Typography variant="button" display="block" gutterBottom>
        button text
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        caption text
      </Typography>
      <Typography variant="overline" display="block" gutterBottom>
        overline text
      </Typography>
    </Box>
  );
}
