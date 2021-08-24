// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Stack,
  StackItem,
  Text,
  makeStyles,
  Dialog,
  DialogFooter,
  PrimaryButton,
  useTheme,
  Link,
} from "@fluentui/react";
import { useEffect, useMemo } from "react";
import { useAsync, useMountedState } from "react-use";

import Logger from "@foxglove/log";
import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { DeviceCodeResponse, Session } from "@foxglove/studio-base/services/ConsoleApi";

const log = Logger.getLogger(__filename);

type DeviceCodePanelProps = {
  deviceCode: DeviceCodeResponse;
  onClose?: (session?: Session) => void;
};

const useStyles = makeStyles((theme) => {
  return {
    text: {
      textAlign: "center",
      fontWeight: "bold",
      padding: theme.spacing.l1,
    },
    orgItem: {
      cursor: "pointer",

      ":hover": {
        opacity: 0.8,
      },
    },
  };
});

// Show instructions on opening the browser and entering the device code
export default function DeviceCodeDialog(props: DeviceCodePanelProps): JSX.Element {
  const classes = useStyles();
  const theme = useTheme();
  const isMounted = useMountedState();
  const api = useConsoleApi();

  const { deviceCode, onClose } = props;
  const { user_code: userCode, verification_uri: verificationUrl } = deviceCode;

  const { value: deviceResponse, error: deviceResponseError } = useAsync(async () => {
    const endTimeMs = Date.now() + deviceCode.expires_in * 1000;

    // continue polling for the token until we receive the token or we timeout
    while (Date.now() < endTimeMs) {
      await new Promise((resolve) => setTimeout(resolve, deviceCode.interval * 1000));
      // no need to query if no longer mounted
      if (!isMounted()) {
        return;
      }

      try {
        const tempAccess = await api.token({
          device_code: deviceCode.device_code,
          client_id: process.env.OAUTH_CLIENT_ID!,
        });
        return tempAccess;
      } catch (err) {
        log.warn(err);
        // ignore and retry
      }
    }

    throw new Error("Timeout waiting for activation");
  }, [api, deviceCode, isMounted]);

  const { value: session, error: signinError } = useAsync(async () => {
    if (!deviceResponse) {
      return;
    }

    return await api.signin({
      id_token: deviceResponse.id_token,
    });
  }, [api, deviceResponse]);

  const dialogContent = useMemo(() => {
    return (
      <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
        <Text variant="large">Finish sign-in in your web browser.</Text>
        <StackItem className={classes.text}>
          <Text variant="xLarge">{userCode} </Text>
        </StackItem>

        <StackItem>
          <Text variant="large">
            If your browser did not automatically open, use the link below.
          </Text>
        </StackItem>
        <StackItem className={classes.text}>
          <Text variant="large">
            <Link href={`${verificationUrl}?user_code=${userCode}`}>{verificationUrl}</Link>
          </Text>
        </StackItem>

        <Text variant="large">Waiting for browser sign-in...</Text>
      </Stack>
    );
  }, [classes, userCode, verificationUrl, theme]);

  useEffect(() => {
    if (session) {
      onClose?.(session);
    }
  }, [onClose, session]);

  if (deviceResponseError || signinError) {
    return (
      <Dialog hidden={false} title="Error">
        {deviceResponseError?.message ?? signinError?.message}
        <DialogFooter>
          <PrimaryButton text="close" onClick={() => onClose?.()} />
        </DialogFooter>
      </Dialog>
    );
  }

  return (
    <Dialog hidden={false} maxWidth="100%" title="Complete Sign in">
      {dialogContent}
      <DialogFooter>
        <PrimaryButton text="cancel" onClick={() => onClose?.()} />
      </DialogFooter>
    </Dialog>
  );
}
