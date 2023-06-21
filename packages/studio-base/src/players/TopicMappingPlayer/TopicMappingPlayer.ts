// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time } from "@foxglove/rostime";
import { Immutable, ParameterValue } from "@foxglove/studio";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import {
  AdvertiseOptions,
  Player,
  PlayerState,
  PublishPayload,
  SubscribePayload,
} from "@foxglove/studio-base/players/types";

import { MappingInputs, TopicMappers, mapPlayerState, mapSubscriptions } from "./mapping";

/**
 * This is a player that wraps an underlying player and applies a mapping to all topic
 * names in data emitted from the player. It is inserted into the player chain before
 * UserNodePlayer so that UserNodePlayer can use the mapped topics.
 *
 * Mappings that map input topics to other input topics or that request conflicting
 * mappings from multiple input topics to the same output topic are disallowed and flagged
 * as player problems
 */
export class TopicMappingPlayer implements Player {
  readonly #player: Player;

  #inputs: Immutable<MappingInputs>;
  #pendingSubscriptions: undefined | SubscribePayload[];
  #subscriptions: SubscribePayload[] = [];

  // True if no mappers are active and we can pass calls directly through to the
  // underlying player.
  #skipMapping: boolean;

  #listener?: (state: PlayerState) => Promise<void>;

  public constructor(
    player: Player,
    mappers: Immutable<TopicMappers>,
    variables: Immutable<GlobalVariables>,
  ) {
    this.#player = player;
    this.#skipMapping = mappers.length === 0;
    this.#inputs = {
      mappers,
      topics: undefined,
      variables,
    };
  }

  public setListener(listener: (playerState: PlayerState) => Promise<void>): void {
    this.#listener = listener;

    this.#player.setListener(async (state) => await this.#onPlayerState(state));
  }

  public setMappers(mappers: Immutable<TopicMappers>): void {
    this.#inputs = { ...this.#inputs, mappers };
    this.#skipMapping = mappers.length === 0;
  }

  public close(): void {
    this.#player.close();
  }

  public setSubscriptions(subscriptions: SubscribePayload[]): void {
    this.#subscriptions = subscriptions;

    if (this.#skipMapping) {
      this.#player.setSubscriptions(subscriptions);
    } else {
      // If we have mappers but haven't recieved a topic list from an active state from
      // the wrapped player yet we have to delay setSubscriptions until we have the topic
      // list to set up the mappings.
      if (this.#inputs.topics != undefined) {
        const mappedSubscriptions = mapSubscriptions(this.#inputs, subscriptions);
        this.#player.setSubscriptions(mappedSubscriptions);
        this.#pendingSubscriptions = undefined;
      } else {
        this.#pendingSubscriptions = subscriptions;
      }
    }
  }

  public setPublishers(publishers: AdvertiseOptions[]): void {
    this.#player.setPublishers(publishers);
  }

  public setParameter(key: string, value: ParameterValue): void {
    this.#player.setParameter(key, value);
  }

  public publish(request: PublishPayload): void {
    this.#player.publish(request);
  }

  public async callService(service: string, request: unknown): Promise<unknown> {
    return await this.#player.callService(service, request);
  }

  public startPlayback?(): void {
    this.#player.startPlayback?.();
  }

  public pausePlayback?(): void {
    this.#player.pausePlayback?.();
  }

  public seekPlayback?(time: Time, backfillDuration?: Time | undefined): void {
    this.#player.seekPlayback?.(time, backfillDuration);
  }

  public playUntil?(time: Time): void {
    this.#player.playUntil?.(time);
  }

  public setPlaybackSpeed?(speedFraction: number): void {
    this.#player.setPlaybackSpeed?.(speedFraction);
  }

  public setGlobalVariables(globalVariables: GlobalVariables): void {
    this.#player.setGlobalVariables(globalVariables);
    this.#inputs = { ...this.#inputs, variables: globalVariables };
  }

  async #onPlayerState(playerState: PlayerState) {
    if (this.#skipMapping) {
      await this.#listener?.(playerState);
      return;
    }

    if (playerState.activeData?.topics !== this.#inputs.topics) {
      this.#inputs = { ...this.#inputs, topics: playerState.activeData?.topics };
    }

    const newState = mapPlayerState(this.#inputs, this.#subscriptions, playerState);
    await this.#listener?.(newState);

    if (this.#pendingSubscriptions && this.#inputs.topics) {
      this.setSubscriptions(this.#pendingSubscriptions);
    }
  }
}
