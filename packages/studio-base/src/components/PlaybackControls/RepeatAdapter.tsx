// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useSnackbar } from "notistack";
import { useLayoutEffect, useRef } from "react";

import { compare, Time } from "@foxglove/rostime";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";

type RepeatAdapterProps = {
  repeatEnabled: boolean;
  // eslint-disable-next-line @foxglove/no-boolean-parameters
  setRepeat: (repeat: boolean) => void;
  play: (opts: { looped: boolean }) => void;
  seek: (to: Time) => void;
};

function activeDataSelector(ctx: MessagePipelineContext) {
  return ctx.playerState.activeData;
}

/**
 * RepeatAdapter handled looping from the start of playback when playback reaches the end
 *
 * NOTE: Because repeat adapter receives every message pipeline frame, we isolate its logic inside
 * a separate component so it does not cause virtual DOM diffing on any children.
 */
export function RepeatAdapter(props: RepeatAdapterProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();

  const { play, seek, repeatEnabled, setRepeat } = props;

  const activeData = useMessagePipeline(activeDataSelector);

  const lastRepeatTime = useRef<number | undefined>();

  useLayoutEffect(() => {
    if (!repeatEnabled) {
      return;
    }

    const currentTime = activeData?.currentTime;
    const endTime = activeData?.endTime;
    const startTime = activeData?.startTime;

    // repeat logic could also live in messagePipeline but since it is only triggered
    // from playback controls we've implemented it here for now - if there is demand
    // to toggle repeat from elsewhere this logic can move
    if (startTime && currentTime && endTime && compare(currentTime, endTime) >= 0) {
      const now = performance.now();
      if (lastRepeatTime.current != undefined && now - lastRepeatTime.current < 250) {
        setRepeat(false);
        enqueueSnackbar("Dataset is too small; playback loop has been automatically disabled.", {
          variant: "info",
        });
      }
      lastRepeatTime.current = now;

      seek(startTime);
      // if the user turns on repeat and we are at the end, we assume they want to play from start
      // even if paused
      play({ looped: true });
    }
  }, [activeData, enqueueSnackbar, play, repeatEnabled, seek, setRepeat]);

  return <></>;
}
