// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Immutable as Im } from "immer";

import { Time } from "@foxglove/rostime";
import { ParameterValue, RegisterTopicMapperArgs } from "@foxglove/studio";
import { GlobalVariables } from "@foxglove/studio-base/hooks/useGlobalVariables";
import {
  AdvertiseOptions,
  Player,
  PlayerState,
  PublishPayload,
  SubscribePayload,
} from "@foxglove/studio-base/players/types";

import { MappingInputs, mapPlayerState, mapSubscriptions } from "./mapping";

export class TopicMappingPlayer implements Player {
  readonly #player: Player;

  #inputs: Im<MappingInputs>;
  #pendingSubscriptions: undefined | SubscribePayload[];
  #skipMapping: boolean;

  #listener?: (state: PlayerState) => Promise<void>;

  public constructor(player: Player, mappers: readonly RegisterTopicMapperArgs[]) {
    this.#player = player;
    this.#skipMapping = mappers.length === 0;
    this.#inputs = {
      mappers,
      topics: undefined,
    };
  }

  public setListener(listener: (playerState: PlayerState) => Promise<void>): void {
    this.#listener = listener;

    this.#player.setListener(async (state) => await this.#onPlayerState(state));
  }

  public setMappers(mappers: readonly RegisterTopicMapperArgs[]): void {
    this.#inputs = { mappers, topics: this.#inputs.topics };
    this.#skipMapping = mappers.length === 0;
  }

  public close(): void {
    this.#player.close();
  }

  public setSubscriptions(subscriptions: SubscribePayload[]): void {
    if (this.#skipMapping) {
      this.#player.setSubscriptions(subscriptions);
    } else {
      // If we have mappers but haven't yet recieved a topic list from an active state
      // from the wrapped player yet we have to delay setSubscriptions until we have the
      // topic list to set up the mappings.
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
  }

  async #onPlayerState(playerState: PlayerState) {
    if (this.#skipMapping) {
      await this.#listener?.(playerState);
      return;
    }

    if (playerState.activeData?.topics !== this.#inputs.topics) {
      this.#inputs = { ...this.#inputs, topics: playerState.activeData?.topics };
    }

    const newState = mapPlayerState(this.#inputs, playerState);
    await this.#listener?.(newState);

    if (this.#pendingSubscriptions && this.#inputs.topics) {
      this.setSubscriptions(this.#pendingSubscriptions);
    }
  }
}
