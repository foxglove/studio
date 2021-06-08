// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { mergeStyles, MessageBar, MessageBarType, Stack, useTheme } from "@fluentui/react";
import { useState } from "react";
import { useAsync } from "react-use";
import styled from "styled-components";

import Button from "@foxglove/studio-base/components/Button";
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

const ListItem = styled.div``;

const ListItemStyles = mergeStyles({
  marginLeft: "-16px",
  marginRight: "-16px",
  paddingLeft: "16px",
  paddingRight: "16px",
  selectors: {
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      cursor: "pointer",
    },
  },
});

const Name = styled.span`
  color: #8b888f;
  font-weight: bold;
`;

const NameLine = styled.div`
  margin-top: 6px;
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
  margin-bottom: 10px;
`;

export default function Extensions(): React.ReactElement {
  const theme = useTheme();

  const [shouldFetch, setShouldFetch] = useState<boolean>(true);
  const [marketplaceEntries, setMarketplaceEntries] = useState<MarketplaceEntry[]>([]);

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

  const { error: availableError } = useAsync(async () => {
    if (!shouldFetch) {
      return;
    }
    setShouldFetch(false);

    const data = await fetch(MARKETPLACE_URL);
    const entries = (await data.json()) as MarketplaceEntry[];
    setMarketplaceEntries(entries);
  }, [shouldFetch]);

  if (availableError) {
    const errorMsg =
      "Failed to fetch the list of available extensions. Check your Internet connection and try again.";
    return (
      <SidebarContent title="Extensions">
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={true}
          dismissButtonAriaLabel="Close"
        >
          {errorMsg}
        </MessageBar>
        <Button
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={() => setShouldFetch(true)}
        >
          Retry Fetching Extensions
        </Button>
      </SidebarContent>
    );
  }

  return (
    <SidebarContent title="Extensions">
      <Stack tokens={{ childrenGap: 30 }}>
        <Stack.Item>
          <SectionHeader>Installed</SectionHeader>
          <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
            {installed && installed.length > 0 ? installed : "No installed extensions"}
          </Stack>
        </Stack.Item>
        <Stack.Item>
          <SectionHeader>Available</SectionHeader>
          <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
            {marketplaceEntries.map((entry) => (
              <Stack.Item key={entry.id} className={ListItemStyles}>
                <ListItem>
                  <NameLine>
                    <Name>{entry.name}</Name>
                    <Version>{entry.version}</Version>
                  </NameLine>
                  <DescriptionLine>
                    <Description>{entry.description}</Description>
                  </DescriptionLine>
                  <PublisherLine>
                    <Publisher>{entry.publisher}</Publisher>
                  </PublisherLine>
                </ListItem>
              </Stack.Item>
            ))}
          </Stack>
        </Stack.Item>
      </Stack>
    </SidebarContent>
  );
}
