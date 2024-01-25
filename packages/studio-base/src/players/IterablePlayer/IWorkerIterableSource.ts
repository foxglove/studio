// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Comlink from "comlink";

import { Immutable, MessageEvent } from "@foxglove/studio";

import type {
  GetBackfillMessagesArgs,
  IIterableSource,
  IMessageCursor,
  IteratorResult,
  MessageIteratorArgs,
} from "./IIterableSource";

export interface IWorkerIterableSource extends IIterableSource {
  messageIterator(
    args: MessageIteratorArgs,
  ): AsyncIterableIterator<Readonly<IteratorResult>> & Comlink.ProxyMarked;
  getBackfillMessages(
    args: Omit<GetBackfillMessagesArgs, "abortSignal">,
    // abortSignal is a separate argument so it can be proxied by comlink since AbortSignal is not
    // clonable (and needs to signal across the worker boundary)
    abortSignal?: AbortSignal,
  ): Promise<MessageEvent[]>;
  getMessageCursor(
    args: Omit<Immutable<MessageIteratorArgs>, "abort">,
    abort?: AbortSignal,
  ): IMessageCursor & Comlink.ProxyMarked;
}
