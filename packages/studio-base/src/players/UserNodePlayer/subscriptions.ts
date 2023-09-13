// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as R from "ramda";

import { Immutable } from "@foxglove/studio";
import { mergeSubscriptions } from "@foxglove/studio-base/components/MessagePipeline/subscriptions";
import { SubscribePayload } from "@foxglove/studio-base/players/types";

// A mapping from the subscription to the input topics needed to satisfy
// that request.
type SubscriberInputs = [SubscribePayload, readonly string[] | undefined];

/**
 * simplifySubscriptions takes an array of SubscribePayload[] representing the user's current subscriptions and does the following:
 * 1. Calculates the minimum set of subscriptions that are necessary to
 *    satisfy the user's request and their `preloadType`, along with any
 *    subscriptions the user made to topics that are not inputs.
 * 2. Rewrites the provided array of subscriptions to omit subscriptions to
 *    virtual topics and subscribe only to the inputs to those topics, then
 *    deduplicates.
 */
export function simplifySubscriptions(
  subscriptions: SubscribePayload[],
  inputsByOutputTopic: Map<string, readonly string[]>,
): [Record<string, SubscribePayload>, Immutable<SubscribePayload[]>] {
  // Pair all subscriptions with their user script input topics (if any)
  const payloadInputsPairs = R.pipe(
    R.map((v: SubscribePayload): SubscriberInputs => [v, inputsByOutputTopic.get(v.topic)]),
    R.filter(([, topics]: SubscriberInputs) => topics?.length !== 0),
  )(subscriptions);

  // An array of all of the input topics used by the user nodes referenced by
  // `subscriptions`
  const neededInputTopics = R.pipe(
    R.chain(([, v]: SubscriberInputs): readonly string[] => v ?? []),
    R.uniq,
  )(payloadInputsPairs);

  // #nodeSubscriptions is a mapping from topic name to a SubscribePayload
  // that contains the resolved preloadType--in other words, the kind of data
  // (current or block) that this subscription needs
  const nodeSubscriptions = R.pipe(
    R.map(([subscription]: SubscriberInputs) => subscription),
    // Gather all of the payloads into subscriptions for the same topic
    R.groupBy((v: SubscribePayload) => v.topic),
    // Consolidate subscriptions to the same topic down to a single payload
    // and ignore `fields`
    R.mapObjIndexed((payloads: SubscribePayload[] | undefined, topic): SubscribePayload => {
      // If at least one preloadType is explicitly "full", we need "full",
      // but default to "partial"
      const hasFull = R.any((v: SubscribePayload) => v.preloadType === "full", payloads ?? []);

      return {
        topic,
        preloadType: hasFull ? "full" : "partial",
      };
    }),
  )(payloadInputsPairs);

  const resolvedSubscriptions = R.pipe(
    R.chain(([subscription, topics]: SubscriberInputs): SubscribePayload[] => {
      const preloadType = subscription.preloadType ?? "partial";

      // Leave the subscription unmodified if it is not a user script topic
      if (topics == undefined) {
        // If this is an input to a user script, we need to upgrade it to a
        // subscription of all the fields
        if (neededInputTopics.includes(subscription.topic)) {
          return [
            {
              topic: subscription.topic,
              preloadType,
            },
          ];
        }

        return [subscription];
      }

      // Subscribe to all fields for all topics used by this user script
      // because we can't know what fields the user script actually uses
      // (for now)
      return topics.map((v) => ({
        topic: v,
        preloadType,
      }));
    }),
    mergeSubscriptions,
  )(payloadInputsPairs);

  return [nodeSubscriptions, resolvedSubscriptions];
}
