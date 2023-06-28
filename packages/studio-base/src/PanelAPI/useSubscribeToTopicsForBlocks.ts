// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import { SubscribePayload } from "@foxglove/studio-base/players/types";

/**
 * Maintains subscriptions to topics required for blocks.
 */
export function useSubscribeToTopicsForBlocks(topics: readonly string[]): void {
  const [id] = useState(() => uuidv4());

  const setSubscriptions = useMessagePipeline(
    useCallback(
      ({ setSubscriptions: pipelineSetSubscriptions }: MessagePipelineContext) =>
        pipelineSetSubscriptions,
      [],
    ),
  );

  const subscriptions: SubscribePayload[] = useMemo(() => {
    return topics.map((topic) => ({ topic, preloadType: "full" }));
  }, [topics]);

  useEffect(() => setSubscriptions(id, subscriptions), [id, setSubscriptions, subscriptions]);

  useEffect(() => {
    return () => {
      setSubscriptions(id, []);
    };
  }, [id, setSubscriptions]);
}
