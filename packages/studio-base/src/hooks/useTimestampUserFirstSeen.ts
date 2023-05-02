// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo, useState } from "react";

import { WORKSPACE_CONTEXT_LOCAL_STORAGE_KEY } from "@foxglove/studio-base/context/WorkspaceContext";

const Keys = {
  STAMP: "fox.studio.user-first-seen",
  STAMP_IS_FIRST_SESSION: "fox.studio.user-first-seen.is-first-session",
} as const;

/**
 * Stamps the first time the user opens the app into local storage. We will use
 * this to drive various onboarding & tutorial features. We use the presence of
 * an existing persisted workspace context to determine if the user was using
 * the app before we wrote this stamp.
 *
 * This hook should only be used once at the root level of the app.
 */
export function useTimestampUserFirstSeen(): void {
  const [stampChecked, setStampChecked] = useState(false);

  if (!stampChecked) {
    const stamp = localStorage.getItem(Keys.STAMP);
    if (!stamp) {
      const isFirstSession = localStorage.getItem(WORKSPACE_CONTEXT_LOCAL_STORAGE_KEY) == undefined;
      localStorage.setItem(Keys.STAMP, new Date().toISOString());
      localStorage.setItem(Keys.STAMP_IS_FIRST_SESSION, String(isFirstSession));
    }
    setStampChecked(true);
  }
}

/**
 * Hook to retrieve the first seen timestamp and the flag indicating the user
 * was a first time user at the time of the stamp. This can be used anywhere in
 * the app to drive onboarding & tutorial features.
 */
// ts-prune-ignore-next
export function useUserFirstSeenTimestamp(): { firstSeen: Date; firstSeenIsFirstSession: boolean } {
  const stamp = localStorage.getItem(Keys.STAMP);
  const isFirstSession = Boolean(localStorage.getItem(Keys.STAMP_IS_FIRST_SESSION));

  return useMemo(
    () => ({
      firstSeen: stamp ? new Date(stamp) : new Date(),
      firstSeenIsFirstSession: isFirstSession,
    }),
    [stamp, isFirstSession],
  );
}
