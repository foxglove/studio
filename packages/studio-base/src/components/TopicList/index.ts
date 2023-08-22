// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export * from "./TopicList";

export const MESSAGE_PATH_DRAG_TYPE = Symbol("MESSAGE_PATH_DRAG_TYPE");

export type MessagePathDragObject = {
  path: string;
};
