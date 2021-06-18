// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { useCallback, useRef } from "react";

import * as PanelAPI from "@foxglove/studio-base/PanelAPI";
import { Frame, MessageEvent } from "@foxglove/studio-base/players/types";

/**
 * useFrame returns the latest frame of messages.
 *
 * This hook is stateful. It will trigger a re-render when there are new frames.
 *
 * @returns a cleared field indicating if the frame is a new frame and the frame itself
 */
const useFrame = (topics: string[]): { cleared: boolean; frame: Frame } => {
  // useMessageReducer may invoke restore and addMessages multiple times in a single pass
  // We use this flag to indicate if we've returned the result from a previous state update
  // and can start accumulating a new state
  const returnedLastValueRef = useRef(false);

  const clearedRef = React.useRef(false);

  // accumulate messages into a frame until we return the frame
  const frame = PanelAPI.useMessageReducer({
    topics,
    restore: useCallback(() => {
      clearedRef.current = true;
      returnedLastValueRef.current = false;
      return {};
    }, []),
    addMessages: useCallback((prev, messages: readonly MessageEvent<unknown>[]) => {
      if (returnedLastValueRef.current) {
        prev = {};
        returnedLastValueRef.current = false;
      }

      for (const message of messages) {
        (prev[message.topic] ??= []).push(message);
      }

      // every call to addMessages returns a new reference to trigger a state update
      return { ...prev };
    }, []),
  });

  const response = { cleared: clearedRef.current, frame };

  // next time we update we no longer have a new frame (cleared)
  clearedRef.current = false;

  // indicate we've returned the previous state and can start building a new frame
  returnedLastValueRef.current = true;

  return response;
};

export default useFrame;
