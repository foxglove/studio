// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Link, Typography } from "@mui/material";
import { useCallback, useMemo } from "react";

import Stack from "@foxglove/studio-base/components/Stack";
import { IDataSourceFactory } from "@foxglove/studio-base/context/PlayerSelectionContext";

import { useOpenFile } from "./useOpenFile";

type ViewProps = {
  availableSources: IDataSourceFactory[];
};

export function LocalFile(props: ViewProps): JSX.Element {
  const { availableSources } = props;

  const openFile = useOpenFile(availableSources);

  const openFileAction = useCallback(() => {
    openFile()
      .catch((err) => {
        // fixme - how to indicate error to user?
        console.error(err);
      })
      .finally(() => {
        // fixme - close the open dialog or does this happen automatically?
      });
  }, [openFile]);

  const localFileSources = useMemo(() => {
    return availableSources.filter((source) => source.type === "file");
  }, [availableSources]);

  const supportedLocalFileTypes = useMemo(() => {
    return localFileSources.flatMap((source) => source.supportedFileTypes ?? []);
  }, [localFileSources]);

  return (
    <Stack gap={2}>
      <Typography color="text.secondary" component="div">
        <div>
          Drag & Drop a file or <Link onClick={openFileAction}>browse</Link>
        </div>
        <div>{`${supportedLocalFileTypes} files are supported.`}</div>
      </Typography>
    </Stack>
  );
}
