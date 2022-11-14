// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Card, CardContent } from "@mui/material";
import { useMemo } from "react";

import { IDataSourceFactory } from "@foxglove/studio-base/context/PlayerSelectionContext";

type Props = {
  availableSources: IDataSourceFactory[];
};

export function Samples(props: Props): JSX.Element {
  const { availableSources } = props;

  const sampleSources = useMemo(() => {
    return availableSources.filter((source) => source.type === "sample");
  }, [availableSources]);

  return (
    <div>
      {sampleSources.map((source) => (
        <Card key={source.id}>
          <CardContent>{source.displayName}</CardContent>
        </Card>
      ))}
    </div>
  );
}
