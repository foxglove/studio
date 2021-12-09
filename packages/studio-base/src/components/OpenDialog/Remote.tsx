// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Stack, TextField, useTheme } from "@fluentui/react";
import { useCallback } from "react";

import View from "./View";

type RemoteProps = {
  onCancel: () => void;
};

export default function Remote(props: RemoteProps): JSX.Element {
  const { onCancel } = props;

  const theme = useTheme();

  const onOpen = useCallback(() => {}, []);

  return (
    <View onCancel={onCancel} onOpen={onOpen}>
      <Stack tokens={{ childrenGap: theme.spacing.m }}>
        <TextField
          label="Remote file URL"
          placeholder="https://storage.googleapis.com/foxglove-public-assets/demo.bag"
        />
      </Stack>
    </View>
  );
}
