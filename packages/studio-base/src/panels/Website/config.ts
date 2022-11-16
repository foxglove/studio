// (c) jk-ethz, https://github.com/jk-ethz
// All rights reserved.

import { SettingsTreeNodes } from "@foxglove/studio";

// Persisted panel state
export type WebsiteConfig = {
  url: string;
};

export function getFullUrl(url: string): string {
  return new URL(url).href;
}

export function validateUrl(url: string): string | undefined {
  try {
    getFullUrl(url);
  } catch (_) {
    return 'URL is not valid';
  }
  return undefined;
}

export function buildSettingsTree(config: WebsiteConfig): SettingsTreeNodes {
  return {
    general: {
      label: "General",
      icon: "Settings",
      fields: {
        url: {
          input: "string",
          label: "Website URL",
          value: config.url,
          error: !!config.url && validateUrl(config.url) || undefined,
        },
      },
    },
  };
}
