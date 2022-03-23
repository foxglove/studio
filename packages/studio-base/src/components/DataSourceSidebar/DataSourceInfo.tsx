// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Typography } from "@mui/material";

import Duration from "@foxglove/studio-base/components/Duration";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import Stack from "@foxglove/studio-base/components/Stack";
import Timestamp from "@foxglove/studio-base/components/Timestamp";
import { subtractTimes } from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/time";

import { MultilineMiddleTruncate } from "../MultilineMiddleTruncate";

const selectStartTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.startTime;
const selectEndTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.endTime;
const selectPlayerName = (ctx: MessagePipelineContext) => ctx.playerState.name;

function DataSourceInfo(): JSX.Element {
  const startTime = useMessagePipeline(selectStartTime);
  const endTime = useMessagePipeline(selectEndTime);
  const playerName = useMessagePipeline(selectPlayerName);

  const duration = startTime && endTime ? subtractTimes(endTime, startTime) : undefined;

  return (
    <Stack gap={1.5} paddingX={2} paddingBottom={2}>
      <Stack direction="row" alignItems="center">
        <Stack flexGrow={1} zeroMinWidth>
          <Typography variant="overline" color="text.secondary">
            Current source
          </Typography>
          <Typography>
            {playerName ? <MultilineMiddleTruncate text={playerName} /> : <>&mdash;</>}
          </Typography>
        </Stack>
      </Stack>

      <Stack>
        <Typography variant="overline" color="text.secondary">
          Start time
        </Typography>
        {startTime ? (
          <Timestamp horizontal time={startTime} />
        ) : (
          <Typography color="text.secondary">&mdash;</Typography>
        )}
      </Stack>

      <Stack>
        <Typography variant="overline" color="text.secondary">
          End time
        </Typography>
        {endTime ? (
          <Timestamp horizontal time={endTime} />
        ) : (
          <Typography color="text.secondary">&mdash;</Typography>
        )}
      </Stack>

      <Stack>
        <Typography variant="overline" color="text.secondary">
          Duration
        </Typography>
        {duration ? (
          <Duration duration={duration} />
        ) : (
          <Typography color="text.secondary">&mdash;</Typography>
        )}
      </Stack>
    </Stack>
  );
}

export { DataSourceInfo };
