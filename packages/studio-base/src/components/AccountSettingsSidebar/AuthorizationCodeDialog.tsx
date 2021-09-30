// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { Auth0Client } from "@auth0/auth0-spa-js";
import {
  Stack,
  Dialog,
  DialogFooter,
  DefaultButton,
  Spinner,
  SpinnerSize,
  useTheme,
} from "@fluentui/react";
import { useMemo } from "react";
import { useAsync } from "react-use";

import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { Session } from "@foxglove/studio-base/services/ConsoleApi";

export const useAuth0 = (): Auth0Client => {
  return useMemo(() => {
    return new Auth0Client({
      domain: "foxglove-development.us.auth0.com",
      client_id: "ISUZutNA5j2kgeKyJxuGe7XajbwVmcqV",

      // Make sure to always prompt for login when doing signin flow
      prompt: "login",
    });
  }, []);
};
type AuthorizationCodePanelProps = {
  onClose?: (session?: Session) => void;
};

export default function AuthorizationCodeDialog(props: AuthorizationCodePanelProps): JSX.Element {
  const theme = useTheme();
  const api = useConsoleApi();
  const { onClose } = props;

  const auth0 = useAuth0();
  const { value: isAuthenticated, error: authenticatedError } = useAsync(async () => {
    await auth0.handleRedirectCallback();
    return await auth0.isAuthenticated();
  }, [auth0]);

  const { value: idToken } = useAsync(async () => {
    if (isAuthenticated !== true) {
      return;
    }

    const claims = await auth0.getIdTokenClaims();
    // eslint-disable-next-line no-underscore-dangle
    return claims.__raw;
  }, [auth0, isAuthenticated]);

  const { value: bearerToken, error: signinError } = useAsync(async () => {
    if (!idToken) {
      return;
    }

    return await api.signin({
      idToken,
    });
  }, [api, idToken]);

  return (
    <Dialog hidden={false} minWidth={440} title="Sign in">
      <div>hello</div>
      <DialogFooter styles={{ action: { display: "block" } }}>
        <Stack horizontal grow horizontalAlign="space-between">
          <Spinner
            size={SpinnerSize.small}
            label={"Awaiting authentication…"}
            labelPosition="right"
            styles={{
              label: {
                fontSize: theme.fonts.medium.fontSize,
                color: theme.semanticColors.bodyText,
              },
            }}
          />
          <DefaultButton text="Cancel" onClick={() => onClose?.()} />
        </Stack>
      </DialogFooter>
    </Dialog>
  );
}
