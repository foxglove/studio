// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// logger channel -> logger
const channels = new Map<string, Logger>();

const noop = () => {};

class Logger {
  // default logger has an empty name
  static default = new Logger("");

  #name: string;
  #enabled = true;

  // all new loggers are created from the default logger
  private constructor(name: string) {
    this.#name = name;
    this.#updateHandlers();

    channels.set(name, this);
  }

  // fully qualified name for the logger
  name() {
    return this.#name;
  }

  isEnabled() {
    return this.#enabled;
  }

  enable() {
    this.#enabled = true;
    this.#updateHandlers();
  }

  disable() {
    this.#enabled = false;
    this.#updateHandlers();
  }

  debug(..._args: unknown[]) {}
  info(..._args: unknown[]) {}
  warn(..._args: unknown[]) {}
  error(..._args: unknown[]) {}

  // create a new logger under this logger's namespace
  getLogger(name: string): Logger {
    const shortName = name.replace(/^.+\.(asar|webpack)[\\/\\]/, "");
    const channelName = this.#name.length > 0 ? `${this.#name}.${shortName}` : shortName;
    const existing = channels.get(channelName);
    if (existing) {
      return existing;
    }

    const logger = new Logger(channelName);
    channels.set(channelName, logger);
    return logger;
  }

  // get all logging channels
  channels(): Logger[] {
    return Array.from(channels.values());
  }

  #updateHandlers() {
    if (this.#enabled) {
      const prefix = this.#name.length > 0 ? `[${this.#name}]` : "";
      this.debug = console.debug.bind(global.console, `${prefix}`);
      this.info = console.info.bind(global.console, `${prefix}`);
      this.warn = console.warn.bind(global.console, `${prefix}`);
      this.error = console.error.bind(global.console, `${prefix}`);
    } else {
      this.debug = noop;
      this.info = noop;
      this.warn = noop;
      this.error = noop;
    }
  }
}

export default Logger.default;
