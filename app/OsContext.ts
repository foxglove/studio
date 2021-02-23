import { OsMenuHandler } from "@foxglove-studio/app/OsMenuHandler";

// Events that are forwarded from the main process and can be listened to using ctxbridge.addListener
export type OsContextWindowEvent = "enter-full-screen" | "leave-full-screen";

/** OsContext is exposed over the electron Context Bridge */
export interface OsContext {
  platform: string;
  installMenuHandlers(handlers: OsMenuHandler): void;
  addWindowEventListener(eventName: OsContextWindowEvent, handler: () => void): void;
}

type GlobalWithCtx = typeof global & {
  ctxbridge?: OsContext;
};

/** Global singleton of the OsContext provided by the bridge */
export const OsContextSingleton = (global as GlobalWithCtx).ctxbridge;
