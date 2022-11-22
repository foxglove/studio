// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Typography, styled as muiStyled } from "@mui/material";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useMountedState } from "react-use";

import Stack from "@foxglove/studio-base/components/Stack";
import { useAnalytics } from "@foxglove/studio-base/context/AnalyticsContext";
import {
  IDataSourceFactory,
  usePlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { AppEvent } from "@foxglove/studio-base/services/IAnalytics";

import Connection from "./Connection";
import Remote from "./Remote";
import Start from "./Start";
import { WelcomeScreenViews } from "./types";
import { useOpenFile } from "./useOpenFile";

const Root = muiStyled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  width: "100%",
  height: "100%",
  overflowY: "auto",
}));

type WelcomeScreenProps = {
  activeView?: WelcomeScreenViews;
  activeDataSource?: IDataSourceFactory;
  onDismiss?: () => void;
};

export default function WelcomeScreen(props: WelcomeScreenProps): JSX.Element {
  const { activeView: defaultActiveView, onDismiss, activeDataSource } = props;
  const { availableSources, selectSource } = usePlayerSelection();

  const isMounted = useMountedState();
  const [activeView, setActiveView] = useState<WelcomeScreenViews>(defaultActiveView ?? "start");

  const openFile = useOpenFile(availableSources);

  const firstSampleSource = useMemo(() => {
    return availableSources.find((source) => source.type === "sample");
  }, [availableSources]);

  useLayoutEffect(() => {
    setActiveView(defaultActiveView ?? "start");
  }, [defaultActiveView]);

  const onSelectView = useCallback((view: WelcomeScreenViews) => {
    setActiveView(view);
  }, []);

  const analytics = useAnalytics();

  const onScreenClose = useCallback(() => {
    if (onDismiss) {
      onDismiss();
      void analytics.logEvent(AppEvent.DIALOG_CLOSE, { activeView });
    }
  }, [analytics, activeView, onDismiss]);

  useLayoutEffect(() => {
    if (activeView === "file") {
      openFile()
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          // set the view back to start so the user can click to open file again
          if (isMounted()) {
            setActiveView("start");
          }
        });
    } else if (activeView === "demo" && firstSampleSource) {
      selectSource(firstSampleSource.id);
    }
  }, [activeView, firstSampleSource, isMounted, openFile, selectSource]);

  // connectionSources is the list of availableSources supporting "connections"
  const connectionSources = useMemo(() => {
    return availableSources.filter((source) => {
      return source.type === "connection" && source.hidden !== true;
    });
  }, [availableSources]);

  const localFileSources = useMemo(() => {
    return availableSources.filter((source) => source.type === "file");
  }, [availableSources]);

  const remoteFileSources = useMemo(() => {
    return availableSources.filter((source) => source.type === "remote-file");
  }, [availableSources]);

  const view = useMemo(() => {
    const supportedLocalFileTypes = localFileSources.flatMap(
      (source) => source.supportedFileTypes ?? [],
    );
    const supportedRemoteFileTypes = remoteFileSources.flatMap(
      (source) => source.supportedFileTypes ?? [],
    );
    switch (activeView) {
      case "demo": {
        return {
          title: "",
          component: <></>,
        };
      }
      case "connection":
        return {
          title: "Open new connection",
          component: (
            <Connection
              onBack={() => onSelectView("start")}
              onCancel={onScreenClose}
              availableSources={connectionSources}
              activeSource={activeDataSource}
            />
          ),
        };
      case "remote":
        return {
          title: "Open a file from a remote location",
          component: (
            <Remote
              onBack={() => onSelectView("start")}
              onCancel={onScreenClose}
              availableSources={remoteFileSources}
            />
          ),
        };
      default:
        return {
          title: "Open data sources",
          component: (
            <Start
              onSelectView={onSelectView}
              supportedLocalFileExtensions={supportedLocalFileTypes}
              supportedRemoteFileExtensions={supportedRemoteFileTypes}
            />
          ),
        };
    }
  }, [
    activeDataSource,
    activeView,
    connectionSources,
    localFileSources,
    onSelectView,
    remoteFileSources,
    onScreenClose,
  ]);

  return (
    <Root>
      <Stack fullHeight flexGrow={1} justifyContent="space-around" paddingX={5}>
        <Stack flexBasis={450}>
          <Typography variant="h3" pb={3}>
            {view.title}
          </Typography>
          {view.component}
        </Stack>
      </Stack>
    </Root>
  );
}
