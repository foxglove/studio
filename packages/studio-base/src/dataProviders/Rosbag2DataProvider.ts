// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time } from "rosbag";

import Logger from "@foxglove/log";
import { Rosbag2, openFileSystemDirectoryHandle } from "@foxglove/rosbag2-web";
import {
  DataProvider,
  DataProviderDescriptor,
  ExtensionPoint,
  GetMessagesResult,
  GetMessagesTopics,
  InitializationResult,
} from "@foxglove/studio-base/dataProviders/types";

type BagFolderPath = { type: "folder"; folder: FileSystemDirectoryHandle | string };

type Options = { bagFolderPath: BagFolderPath };

const log = Logger.getLogger(__filename);

export default class Rosbag2DataProvider implements DataProvider {
  private options_: Options;
  private bag_?: Rosbag2;

  constructor(options: Options, children: DataProviderDescriptor[]) {
    if (children.length > 0) {
      throw new Error("Rosbag2DataProvider cannot have children");
    }
    this.options_ = options;
  }

  async initialize(_extensionPoint: ExtensionPoint): Promise<InitializationResult> {
    const folder = this.options_.bagFolderPath.folder;
    if (folder instanceof FileSystemDirectoryHandle) {
      this.bag_ = await openFileSystemDirectoryHandle(folder, (_) =>
        new URL("../../../../node_modules/sql.js/dist/sql-wasm.wasm", import.meta.url).toString(),
      );
    } else {
      throw new Error("Opening ROS2 bags via the native interface is not implemented yet");
    }

    return {
      start: { sec: 0, nsec: 0 },
      end: { sec: 0, nsec: 0 },
      topics: [],
      connections: [],
      providesParsedMessages: true,
      messageDefinitions: {
        type: "parsed",
        datatypes: {},
        messageDefinitionsByTopic: {},
        parsedMessageDefinitionsByTopic: {},
      },
    };
  }

  async getMessages(
    start: Time,
    end: Time,
    subscriptions: GetMessagesTopics,
  ): Promise<GetMessagesResult> {
    return { parsedMessages: [] };
  }

  async close(): Promise<void> {
    // no-op
  }
}
