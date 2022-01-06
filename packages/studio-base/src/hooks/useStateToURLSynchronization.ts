// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { debounce } from "lodash";
import { useEffect } from "react";

import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { useCurrentLayoutSelector } from "@foxglove/studio-base/context/CurrentLayoutContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import useDeepMemo from "@foxglove/studio-base/hooks/useDeepMemo";
import { PlayerCapabilities } from "@foxglove/studio-base/players/types";
import { encodeAppURLState } from "@foxglove/studio-base/util/appURLState";
import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

const selectCanSeek = (ctx: MessagePipelineContext) =>
  ctx.playerState.capabilities.includes(PlayerCapabilities.playbackControl);
const selectCurrentTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.currentTime;
const selectUrlState = (ctx: MessagePipelineContext) => ctx.playerState.urlState;

// when we go to update the url, we should use the latest version of the url
// we should also cancel this
const debouncedURLUpdate = debounce(
  (url: URL) => {
    console.log("set url", url);
    window.history.replaceState(undefined, "", url.href);
  },
  500,
  { leading: true },
);

// during startup
// we have some state captured in the url
// our first pass into this hook gives us empty values
// cause we have not yet started
// then the other hook - initialdeeplinkstate runs and sets the source
// and now we have a source set but have an empty url

// stableUrlState isn't available?

// a source is selected, but

/**
 * Syncs our current player, layout and other state with the URL in the address bar.
 */
export function useStateToURLSynchronization(): void {
  const canSeek = useMessagePipeline(selectCanSeek);
  const currentTime = useMessagePipeline(selectCurrentTime);
  const urlState = useMessagePipeline(selectUrlState);
  const layoutId = useCurrentLayoutSelector((layout) => layout.selectedLayout?.id);
  const stableUrlState = useDeepMemo(urlState);
  const { selectedSource } = usePlayerSelection();

  console.log({ urlState, stableUrlState });

  useEffect(() => {
    console.log({ canSeek, currentTime, layoutId, selectedSource, stableUrlState });
    // Electron has its own concept of what the app URL is. If we want to do anything
    // here for desktop we'll need to find some other method of encoding the state
    // like perhaps the URL hash.
    if (isDesktopApp()) {
      return;
    }

    const url = encodeAppURLState(new URL(window.location.href), {
      ds: selectedSource?.id,
      layoutId,
      time: canSeek ? currentTime : undefined,
      dsParams: stableUrlState,
    });

    // Debounce updates to avoid spamming changes to the address bar.
    debouncedURLUpdate(url);
  }, [canSeek, currentTime, layoutId, selectedSource, stableUrlState]);
}
