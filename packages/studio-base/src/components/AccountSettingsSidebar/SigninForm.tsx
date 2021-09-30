// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PrimaryButton, Stack, Text, useTheme } from "@fluentui/react";
import { useCallback, useState } from "react";

import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import { Session } from "@foxglove/studio-base/services/ConsoleApi";

import AccountSyncGraphic from "./AccountSyncGraphic";
import AuthorizationCodeDialog, { useAuth0 } from "./AuthorizationCodeDialog";
import DeviceCodeDialog from "./DeviceCodeDialog";

// https://github.com/electron/electron/issues/2288
const isElectron = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes(" electron/");
};

export default function SigninForm(): JSX.Element {
  const theme = useTheme();
  const { setBearerToken } = useCurrentUser();
  const [deviceCodeModalOpen, setDeviceCodeModalOpen] = useState(false);
  const [authorizationCodeModalOpen, setAuthorizationCodeModalOpen] = useState(false);
  const auth0 = useAuth0();

  const handleOnSigninClick = useCallback(async () => {
    if (isElectron()) {
      setDeviceCodeModalOpen(true);
    } else {
      await auth0.loginWithRedirect({
        redirect_uri: `http://localhost:8080`,
        scope: "openid email profile",
      });
    }
  }, [auth0]);

  // fixme - authorization code should just get cookie set, hanging onto bearer token shouldn't be necessary
  const onClose = useCallback(
    (session?: Session) => {
      if (isElectron()) {
        setDeviceCodeModalOpen(false);
        if (session != undefined) {
          setBearerToken(session.bearerToken);
        }
      } else {
        setAuthorizationCodeModalOpen(false);
      }
    },
    [setBearerToken],
  );

  return (
    <>
      {deviceCodeModalOpen && <DeviceCodeDialog onClose={onClose} />}
      {authorizationCodeModalOpen && <AuthorizationCodeDialog onClose={onClose} />}
      <Stack tokens={{ childrenGap: theme.spacing.l1 }} styles={{ root: { lineHeight: "1.3" } }}>
        <Stack
          horizontal
          horizontalAlign="center"
          styles={{ root: { color: theme.palette.accent } }}
        >
          <AccountSyncGraphic width={192} />
        </Stack>
        <Text variant="medium">
          Create a Foxglove account to sync your layouts across multiple devices, and share them
          with your team.
        </Text>

        <PrimaryButton
          text="Sign in"
          onClick={handleOnSigninClick}
          styles={{
            root: {
              marginLeft: 0,
              marginRight: 0,
            },
          }}
        />
      </Stack>
    </>
  );
}
