// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useSnackbar } from "notistack";
import { useAsync } from "react-use";

import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

export function UpdateChecker(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  useAsync(async () => {
    try {
      const latestVersion = await (
        await fetch(
          `https://api.foxglove.dev/v1/oss-version?version=${FOXGLOVE_STUDIO_VERSION ?? ""}`,
        )
      ).text();
      if (latestVersion.length > 0 && latestVersion !== FOXGLOVE_STUDIO_VERSION) {
        enqueueSnackbar(`A new Foxglove Studio version is available: ${latestVersion}`, {
          variant: "info",
        });
      }
    } catch (err) {
      log.error(err);
    }
  }, [enqueueSnackbar]);
  return <></>;
}
