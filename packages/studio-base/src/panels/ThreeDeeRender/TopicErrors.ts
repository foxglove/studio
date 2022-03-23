// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

export class TopicErrors {
  errors = new Map<string, Map<string, string>>(); // topic -> {errorId -> errorMessage}

  add(topic: string, errorId: string, errorMessage: string): void {
    let topicErrors = this.errors.get(topic);
    if (!topicErrors) {
      topicErrors = new Map();
      this.errors.set(topic, topicErrors);
    }
    topicErrors.set(errorId, errorMessage);
    log.warn(`[${topic}] ${errorId}: ${errorMessage}`);
  }

  remove(topic: string, errorId: string): void {
    const topicErrors = this.errors.get(topic);
    if (topicErrors) {
      topicErrors.delete(errorId);
    }
  }

  clearTopic(topic: string): void {
    this.errors.delete(topic);
  }

  clear(): void {
    this.errors.clear();
  }
}
