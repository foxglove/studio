// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { Stack, useTheme } from "@fluentui/react";
import { useAsync } from "react-use";
import styled from "styled-components";

import { SectionHeader } from "@foxglove/studio-base/components/Menu";
import { SidebarContent } from "@foxglove/studio-base/components/SidebarContent";
import { useExtensionLoader } from "@foxglove/studio-base/context/ExtensionLoaderContext";

const MARKETPLACE_URL =
  "https://raw.githubusercontent.com/foxglove/studio-extension-marketplace/main/extensions.json";

type MarketplaceEntry = {
  id: string;
  name: string;
  description: string;
  publisher: string;
  homepage: string;
  license: string;
  version: string;
  shasum: string;
  foxe: string;
  keywords: string[];
  time: Record<string, string>;
};

const Name = styled.span`
  color: #8b888f;
  font-weight: bold;
`;

const Version = styled.span`
  color: #7a777d;
  font-size: 80%;
  margin-left: 8px;
`;

const Description = styled.span`
  color: #8b888f;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  display: inline-block;
  overflow: hidden;
`;

const DescriptionLine = styled.div`
  margin-top: 6px;
`;

const Publisher = styled.span`
  color: #e2dce9;
`;

const PublisherLine = styled.div`
  margin-top: 4px;
  margin-bottom: 12px;
`;

export default function Extensions(): React.ReactElement {
  const theme = useTheme();

  const extensionLoader = useExtensionLoader();

  const { value: installed, error: installedError } = useAsync(async () => {
    const extensionList = await extensionLoader.getExtensions();
    return extensionList.map((extension) => (
      <Stack.Item key={extension.id}>
        <div>{extension.name}</div>
      </Stack.Item>
    ));
  }, [extensionLoader]);

  if (installedError) {
    throw installedError;
  }

  const { value: available, error: availableError } = useAsync(async () => {
    const data = await fetch(MARKETPLACE_URL);
    const entries = (await data.json()) as MarketplaceEntry[];
    return entries.map((entry) => (
      <Stack.Item key={entry.id}>
        <div>
          <Name>{entry.name}</Name>
          <Version>{entry.version}</Version>
        </div>
        <DescriptionLine>
          <Description>{entry.description}</Description>
        </DescriptionLine>
        <PublisherLine>
          <Publisher>{entry.publisher}</Publisher>
        </PublisherLine>
      </Stack.Item>
    ));
  }, []);

  if (availableError) {
    throw availableError;
  }

  return (
    <SidebarContent title="Extensions">
      <Stack tokens={{ childrenGap: 30 }}>
        <Stack.Item>
          <SectionHeader>Installed</SectionHeader>
          <Stack tokens={{ childrenGap: theme.spacing.s1 }}>{installed}</Stack>
        </Stack.Item>
        <Stack.Item>
          <SectionHeader>Available</SectionHeader>
          <Stack tokens={{ childrenGap: theme.spacing.s1 }}>{available}</Stack>
        </Stack.Item>
      </Stack>
    </SidebarContent>
  );
}
