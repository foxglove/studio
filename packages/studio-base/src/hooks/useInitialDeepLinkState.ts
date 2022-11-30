// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useMemo, useState } from "react";

import Log from "@foxglove/log";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import { EventsStore, useEvents } from "@foxglove/studio-base/context/EventsContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import { PlayerPresence } from "@foxglove/studio-base/players/types";
import { AppURLState, parseAppURLState } from "@foxglove/studio-base/util/appURLState";

const selectPlayerPresence = (ctx: MessagePipelineContext) => ctx.playerState.presence;
const selectSeek = (ctx: MessagePipelineContext) => ctx.seekPlayback;
const selectSelectEvent = (store: EventsStore) => store.selectEvent;

const log = Log.getLogger(__filename);

/*
 * Sync functions necessary to keep separate to prevent memory leak from context kept in
 * useEffect closures. Notably `seekPlayback` being attached to the context of the `useEffect` closures
 * and that keeping the initial player in memory because the context is never updated because it doesn't depend
 * on the player.
 */

function useSyncSourceFromUrl(
  targetUrlState: AppURLState | undefined,
  { currentUserRequired }: { currentUserRequired: boolean },
) {
  const [unappliedUrlState, setUnappliedUrlState] = useState(
    targetUrlState ? { ds: targetUrlState.ds, dsParams: targetUrlState.dsParams } : undefined,
  );
  const { selectSource } = usePlayerSelection();
  const selectEvent = useEvents(selectSelectEvent);
  const { currentUser } = useCurrentUser();
  // Load data source from URL.
  useEffect(() => {
    if (!unappliedUrlState) {
      return;
    }

    // Wait for current user session if one is required for this source.
    if (currentUserRequired && !currentUser) {
      return;
    }

    // Apply any available datasource args
    if (unappliedUrlState.ds) {
      log.debug("Initialising source from url", unappliedUrlState);
      selectSource(unappliedUrlState.ds, {
        type: "connection",
        params: unappliedUrlState.dsParams,
      });
      selectEvent(unappliedUrlState.dsParams?.eventId);
      setUnappliedUrlState({ ds: undefined, dsParams: undefined });
    }
  }, [
    currentUser,
    currentUserRequired,
    selectEvent,
    selectSource,
    unappliedUrlState,
    setUnappliedUrlState,
  ]);
}
function useSyncLayoutFromUrl(
  targetUrlState: AppURLState | undefined,
  { currentUserRequired }: { currentUserRequired: boolean },
) {
  const { setSelectedLayoutId } = useCurrentLayoutActions();
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const [unappliedUrlState, setUnappliedUrlState] = useState(
    targetUrlState ? { layoutId: targetUrlState.layoutId } : undefined,
  );
  // Select layout from URL.
  useEffect(() => {
    if (!unappliedUrlState?.layoutId) {
      return;
    }

    // If our datasource requires a current user then wait until the player is
    // available to load the layout since we may need to sync layouts first and
    // that's only possible after the user has logged in.
    if (currentUserRequired && playerPresence !== PlayerPresence.PRESENT) {
      return;
    }

    log.debug(`Initializing layout from url: ${unappliedUrlState.layoutId}`);
    setSelectedLayoutId(unappliedUrlState.layoutId);
    setUnappliedUrlState({ layoutId: undefined });
  }, [currentUserRequired, playerPresence, setSelectedLayoutId, unappliedUrlState?.layoutId]);
}

function useSyncTimeFromUrl(targetUrlState: AppURLState | undefined) {
  const seekPlayback = useMessagePipeline(selectSeek);
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const [unappliedUrlState, setUnappliedUrlState] = useState(
    targetUrlState ? { time: targetUrlState.time } : undefined,
  );
  // Seek to time in URL.
  useEffect(() => {
    if (unappliedUrlState?.time == undefined || !seekPlayback) {
      return;
    }

    // Wait until player is ready before we try to seek.
    if (playerPresence !== PlayerPresence.PRESENT) {
      return;
    }

    log.debug(`Seeking to url time:`, unappliedUrlState.time);
    seekPlayback(unappliedUrlState.time);
    setUnappliedUrlState({ time: undefined });
  }, [playerPresence, seekPlayback, unappliedUrlState]);
}

/**
 * Restores our session state from any deep link we were passed on startup.
 */
export function useInitialDeepLinkState(deepLinks: readonly string[]): {
  currentUserRequired: boolean;
} {
  const targetUrlState = useMemo(
    () => (deepLinks[0] ? parseAppURLState(new URL(deepLinks[0])) : undefined),
    [deepLinks],
  );

  // Maybe this should be abstracted somewhere but that would require a
  // more intimate interface with this hook and the player selection logic.
  const currentUserRequiredParam = useMemo(
    () => ({ currentUserRequired: targetUrlState?.ds === "foxglove-data-platform" }),
    [targetUrlState?.ds],
  );
  useSyncSourceFromUrl(targetUrlState, currentUserRequiredParam);
  useSyncLayoutFromUrl(targetUrlState, currentUserRequiredParam);
  useSyncTimeFromUrl(targetUrlState);
  return currentUserRequiredParam;
}
