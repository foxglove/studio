// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useMemo, useState } from "react";

import Log from "@foxglove/log";
import { AppSetting } from "@foxglove/studio-base/AppSetting";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { useCurrentLayoutActions } from "@foxglove/studio-base/context/CurrentLayoutContext";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import { usePlayerSelection } from "@foxglove/studio-base/context/PlayerSelectionContext";
import useDeepMemo from "@foxglove/studio-base/hooks/useDeepMemo";
import { useSessionStorageValue } from "@foxglove/studio-base/hooks/useSessionStorageValue";
import { PlayerPresence } from "@foxglove/studio-base/players/types";
import { parseAppURLState } from "@foxglove/studio-base/util/appURLState";
import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

const selectPlayerPresence = (ctx: MessagePipelineContext) => ctx.playerState.presence;
const selectSeek = (ctx: MessagePipelineContext) => ctx.seekPlayback;
const selectUrlState = (ctx: MessagePipelineContext) => ctx.playerState.urlState;

const log = Log.getLogger(__filename);

/**
 * Restores our session state from any deep link we were passed on startup.
 */
export function useInitialDeepLinkState(deepLinks: readonly string[]): {
  currentUserRequired: boolean;
} {
  const stableUrlState = useDeepMemo(useMessagePipeline(selectUrlState));
  const { selectSource } = usePlayerSelection();
  const { setSelectedLayoutId } = useCurrentLayoutActions();
  const [launchPreference, setLaunchPreference] = useSessionStorageValue(
    AppSetting.LAUNCH_PREFERENCE,
  );
  const seekPlayback = useMessagePipeline(selectSeek);
  const playerPresence = useMessagePipeline(selectPlayerPresence);
  const { currentUser } = useCurrentUser();

  const targetUrlState = useMemo(
    () => (deepLinks[0] ? parseAppURLState(new URL(deepLinks[0])) : undefined),
    [deepLinks],
  );

  // Maybe this should be abstracted somewhere but that would require a
  // more intimate interface with this hook and the player selection logic.
  const currentUserRequired = targetUrlState?.ds === "foxglove-data-platform";

  // Tracks what portions of the URL state we have yet to apply to the current session.
  const [unappliedUrlState, setUnappliedUrlState] = useState(
    targetUrlState ? { ...targetUrlState } : undefined,
  );

  // Set a sessionStorage preference for web if we have a stable URL state.
  // This allows us to avoid asking for the preference immediately on
  // launch of an empty session and makes refreshes do the right thing.
  useEffect(() => {
    if (isDesktopApp()) {
      return;
    }

    if (stableUrlState && !launchPreference) {
      setLaunchPreference("web");
    }
  }, [launchPreference, setLaunchPreference, stableUrlState]);

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
      setUnappliedUrlState((oldState) => ({ ...oldState, ds: undefined, dsParams: undefined }));
    }
  }, [currentUser, currentUserRequired, selectSource, unappliedUrlState]);

  // Select layout from URL.
  useEffect(() => {
    if (!unappliedUrlState) {
      return;
    }

    // Wait for current user session if one is required for this source.
    if (currentUserRequired && !currentUser) {
      return;
    }

    // If we have a target DS then wait until the player has loaded until
    // we try to select the layout. This also handles the case where the
    // data source requires a logged in user since the player won't start
    // until we have a current user.
    if (targetUrlState?.ds && playerPresence !== PlayerPresence.PRESENT) {
      return;
    }

    if (unappliedUrlState.layoutId != undefined) {
      log.debug(`Initializing layout from url: ${unappliedUrlState.layoutId}`);
      setSelectedLayoutId(unappliedUrlState.layoutId);
      setUnappliedUrlState((oldState) => ({ ...oldState, layoutId: undefined }));
    }
  }, [
    currentUser,
    currentUserRequired,
    playerPresence,
    setSelectedLayoutId,
    targetUrlState,
    unappliedUrlState,
  ]);

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
    setUnappliedUrlState((oldState) => ({ ...oldState, time: undefined }));
  }, [playerPresence, seekPlayback, unappliedUrlState]);

  return useMemo(() => ({ currentUserRequired }), [currentUserRequired]);
}
