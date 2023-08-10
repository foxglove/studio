// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { union } from "lodash";
import moize from "moize";

import { Immutable } from "@foxglove/studio";
import { SubscribePayload } from "@foxglove/studio-base/players/types";

/**
 * Create a deep equal memoized identify function. Used for stabilizing the subscription payloads we
 * send on to the player.
 */
export function makeSubscriptionMemoizer(): (val: SubscribePayload) => SubscribePayload {
  return moize((val: SubscribePayload) => val, { isDeepEqual: true, maxSize: Infinity });
}

/**
 * Coalesces various topic subscriptions into a set of subscriptions to send on to the player.
 *
 * If any client requests a "whole" subscription to a topic then all fields will be fetched for that
 * topic. If various clients request different slices of a topic then we request the union of all
 * requested slices.
 */
export function simplifySubscriptionsById(
  subcriptionsById: Immutable<Map<string, SubscribePayload[]>>,
): Immutable<SubscribePayload>[] {
  const fullSubsByTopic = new Map<string, Immutable<SubscribePayload>>();
  const partialSubsByTopic = new Map<string, Immutable<SubscribePayload>>();
  for (const subs of subcriptionsById.values()) {
    for (const sub of subs) {
      const target = sub.preloadType === "full" ? fullSubsByTopic : partialSubsByTopic;
      const existing = target.get(sub.topic);
      if (existing) {
        if (existing.fields == undefined) {
          // Nothing to do, already subscribed to the whole topic.
        } else if (sub.fields == undefined) {
          // Replace any slice subscription with a subscription to the whole topic.
          target.set(sub.topic, sub);
        } else {
          // Skip slice subscriptions with no non-empty fields selected.
          const nonEmptyFields = sub.fields
            .map((field) => field.trim())
            .filter((field) => field.length > 0);
          if (nonEmptyFields.length > 0) {
            target.set(sub.topic, { ...sub, fields: union(existing.fields, nonEmptyFields) });
          }
        }
      } else {
        if (sub.fields == undefined) {
          // If no subscription for this topic exists, register a whole topic subscription.
          target.set(sub.topic, sub);
        } else {
          // Only register a slice sub if some fields are selected.
          const hasNonEmptyField = sub.fields.some((field) => field.trim().length > 0);
          if (hasNonEmptyField) {
            target.set(sub.topic, sub);
          }
        }
      }
    }
  }
  return [...fullSubsByTopic.values(), ...partialSubsByTopic.values()];
}
