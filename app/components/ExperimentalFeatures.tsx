// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { mapValues, noop } from "lodash";
import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

import Modal, { Title } from "@foxglove-studio/app/components/Modal";
import SegmentedControl from "@foxglove-studio/app/components/SegmentedControl";
import TextContent from "@foxglove-studio/app/components/TextContent";
import Storage from "@foxglove-studio/app/util/Storage";
import logEvent, { getEventNames } from "@foxglove-studio/app/util/logEvent";

type ExperimentalFeaturesBackend = {
  features: FeatureDescriptions;
  settings: FeatureSettings;
  changeFeature(id: string, value: FeatureValue): void;
};
const ExperimentalFeaturesContext = createContext<ExperimentalFeaturesBackend>({
  features: {},
  settings: {},
  changeFeature: () => {},
});
export const ExperimentalFeaturesProvider = ExperimentalFeaturesContext.Provider;

export type FeatureDescriptions = {
  [id: string]: {
    name: string;
    description: string | React.ReactNode;
    developmentDefault: boolean;
    productionDefault: boolean;
  };
};

export type FeatureValue = "default" | "alwaysOn" | "alwaysOff";
export type FeatureStorage = {
  [id: string]: "alwaysOn" | "alwaysOff";
};
export type FeatureSettings = {
  [id: string]: { enabled: boolean; manuallySet: boolean };
};
export const EXPERIMENTAL_FEATURES_STORAGE_KEY = "experimentalFeaturesSettings";

function getDefaultKey(): "productionDefault" | "developmentDefault" {
  return process.env.NODE_ENV === "production" ? "productionDefault" : "developmentDefault";
}

export function ExperimentalFeaturesLocalStorageProvider({
  children,
  features,
}: PropsWithChildren<{ features: FeatureDescriptions }>): React.ReactElement {
  const [featureStorage, setFeatureStorage] = useState(
    () => new Storage().getItem<FeatureStorage>(EXPERIMENTAL_FEATURES_STORAGE_KEY) || {},
  );

  const settings = useMemo(
    () =>
      mapValues(features, (description, id) =>
        featureStorage[id] === "alwaysOn" || featureStorage[id] === "alwaysOff"
          ? { enabled: featureStorage[id] === "alwaysOn", manuallySet: true }
          : { enabled: description[getDefaultKey()], manuallySet: false },
      ),
    [features, featureStorage],
  );

  const backend: ExperimentalFeaturesBackend = {
    settings,
    features,
    changeFeature(id, value) {
      const storage = new Storage();
      const newStorage: FeatureStorage = { ...storage.getItem(EXPERIMENTAL_FEATURES_STORAGE_KEY) };

      // @ts-ignore Event logging is not currently well typed
      logEvent({ name: getEventNames().CHANGE_EXPERIMENTAL_FEATURE, tags: { feature: id, value } });

      if (value === "default") {
        delete newStorage[id];
      } else {
        newStorage[id] = value;
      }
      storage.setItem(EXPERIMENTAL_FEATURES_STORAGE_KEY, newStorage);
      setFeatureStorage(newStorage);
    },
  };
  return <ExperimentalFeaturesProvider value={backend}>{children}</ExperimentalFeaturesProvider>;
}

export function useExperimentalFeature(id: string): boolean {
  const { settings } = useContext(ExperimentalFeaturesContext);
  return settings[id]?.enabled ?? false;
}

export function ExperimentalFeaturesModal(props: {
  onRequestClose?: () => void;
}): React.ReactElement {
  const { settings, features, changeFeature } = useContext(ExperimentalFeaturesContext);
  return (
    <Modal onRequestClose={props.onRequestClose ?? noop}>
      <div style={{ maxWidth: "80vw", maxHeight: "90vh", overflow: "auto" }}>
        <Title>Experimental features</Title>
        <hr />
        <div style={{ padding: "32px" }}>
          <TextContent>
            <p>
              Enable or disable any experimental features. These settings will be stored locally and
              will not be associated with your layout or persisted in any backend.
            </p>
            {Object.keys(features).length === 0 && (
              <p>
                <em>Currently there are no experimental features.</em>
              </p>
            )}
          </TextContent>
          <table style={{ marginTop: 12 }}>
            <tbody>
              {Object.entries(features).map(([id, feature]) => {
                return (
                  <tr key={id}>
                    <td style={{ width: "100%", padding: 4 }}>
                      <TextContent>
                        <h2>
                          {feature.name} <code style={{ fontSize: 12 }}>{id}</code>
                        </h2>
                        {feature.description}
                      </TextContent>
                    </td>
                    <td style={{ verticalAlign: "middle" }}>
                      <SegmentedControl
                        selectedId={
                          settings[id]?.manuallySet
                            ? settings[id]?.enabled
                              ? "alwaysOn"
                              : "alwaysOff"
                            : "default"
                        }
                        onChange={(value) => {
                          if (
                            value !== "default" &&
                            value !== "alwaysOn" &&
                            value !== "alwaysOff"
                          ) {
                            throw new Error(`Invalid value for radio button: ${value}`);
                          }
                          changeFeature(id, value);
                        }}
                        options={[
                          {
                            id: "default",
                            label: `Default (${feature[getDefaultKey()] ? "on" : "off"})`,
                          },
                          { id: "alwaysOn", label: "On" },
                          { id: "alwaysOff", label: "Off" },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
