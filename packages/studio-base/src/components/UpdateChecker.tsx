// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useSnackbar } from "notistack";
import { useEffect } from "react";

import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

type VersionResponse = {
  version?: string;
  message?: string;
};

export function UpdateChecker(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!navigator.onLine || !FOXGLOVE_STUDIO_VERSION) {
      return;
    }

    const abort = new AbortController();

    fetch(`https://api.foxglove.dev/v1/studio-update?version=${FOXGLOVE_STUDIO_VERSION}`, {
      credentials: "omit",
      signal: abort.signal,
    })
      .then(async (res) => {
        const { message } = (await res.json()) as VersionResponse;
        if (message) {
          enqueueSnackbar(message);
        }
      })
      .catch((err) => {
        log.error(err);
      });

    return () => {
      abort.abort();
    };
  }, [enqueueSnackbar]);

  return <></>;
}
