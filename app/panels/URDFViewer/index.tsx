// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { ComboBox, DefaultButton, Slider, Stack, Toggle, useTheme } from "@fluentui/react";
import EventEmitter from "eventemitter3";
import { pick } from "lodash";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useUpdate } from "react-use";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { URDFRobot } from "urdf-loader/src/URDFClasses";

import * as PanelAPI from "@foxglove-studio/app/PanelAPI";
import EmptyState from "@foxglove-studio/app/components/EmptyState";
import Flex from "@foxglove-studio/app/components/Flex";
import Panel from "@foxglove-studio/app/components/Panel";
import PanelToolbar from "@foxglove-studio/app/components/PanelToolbar";
import { useRobotModel } from "@foxglove-studio/app/context/RobotModelContext";
import useCleanup from "@foxglove-studio/app/hooks/useCleanup";
import { JointState } from "@foxglove-studio/app/types/Messages";
import { SaveConfig } from "@foxglove-studio/app/types/panels";
import filterMap from "@foxglove-studio/app/util/filterMap";

import helpContent from "./index.help.md";

type EventTypes = {
  cameraMove: () => void;
};
class Renderer extends EventEmitter<EventTypes> {
  private scene = new THREE.Scene();
  private world = new THREE.Object3D();
  private camera = new THREE.PerspectiveCamera();
  private controls?: OrbitControls;
  private renderer?: THREE.WebGLRenderer;
  private ambientLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private model?: URDFRobot;
  private opacity: number = 1;

  cameraCentered = true;

  constructor() {
    super();
    this.camera.position.set(0, 0, 5);
    this.centerCamera();
    this.scene.add(this.world);
    this.world.rotation.set(-Math.PI / 2, 0, 0);

    this.ambientLight = new THREE.HemisphereLight("#666666", "#000");
    this.ambientLight.groundColor.lerp(this.ambientLight.color, 0.5);
    this.ambientLight.intensity = 0.8;
    this.ambientLight.position.set(0, 1, 0);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff);
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
  }

  centerCamera() {
    this.controls?.reset();
    this.camera.updateProjectionMatrix();
    this.cameraCentered = true;
    this.emit("cameraMove");
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setClearColor(0xffffff);
    this.renderer.setClearAlpha(0.5);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.controls = new OrbitControls(this.camera, canvas);
    // this.controls.enableDamping = true;
    // this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;
    this.controls.addEventListener("change", () => {
      this.cameraCentered = this.controls?.target.equals(new THREE.Vector3()) ?? false;
      this.emit("cameraMove");
    });
  }

  setSize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(width, height);
  }

  setModel(model?: URDFRobot) {
    if (this.model) {
      this.model.traverse((obj) => (obj as { dispose?(): void }).dispose?.());
      this.world.remove(this.model);
    }

    this.model = model;
    if (this.model) {
      this.world.add(this.model);
    }
    this.centerCamera();
    this.setOpacity(this.opacity); // Re-apply opacity to new model
  }

  setOpacity(opacity: number) {
    this.opacity = opacity;
    this.model?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.material instanceof THREE.Material) {
          obj.material.opacity = opacity;
          obj.material.transparent = opacity < 1;
          obj.material.depthWrite = !obj.material.transparent;
        }
      }
    });
  }

  render() {
    // The light should follow the viewer's position
    this.dirLight.position.copy(this.camera.position);

    this.renderer?.render(this.scene, this.camera);
  }

  setJointValues(values: Record<string, number>) {
    this.model?.setJointValues(values);
  }

  dispose() {
    this.scene.traverse((obj) => obj !== this.scene && (obj as { dispose?(): void }).dispose?.());
  }
}

type Config = {
  jointStatesTopic?: string;
  customJointValues?: Record<string, number>;
  opacity?: number;
};
type Props = {
  config: Config;
  saveConfig: SaveConfig<Config>;
};

function JointValueSliders({
  model,
  config,
  saveConfig,
}: Props & { model: URDFRobot }): JSX.Element {
  const { customJointValues } = config;
  const joints = useMemo(
    () => Object.entries(model.joints).sort(([key1], [key2]) => key1.localeCompare(key2)),
    [model.joints],
  );
  const setJointValue = useCallback(
    (name: string, val: number) => {
      const newValues = pick(customJointValues ?? {}, Object.keys(model.joints));
      newValues[name] = val;
      saveConfig({ customJointValues: newValues });
    },
    [saveConfig, customJointValues, model.joints],
  );
  const theme = useTheme();
  return (
    <Stack style={{ overflowY: "auto", width: "40%", maxWidth: 300, padding: theme.spacing.s1 }}>
      {joints.map(([name, joint]) => {
        const min = joint.jointType === "continuous" ? -Math.PI : +joint.limit.lower;
        const max = joint.jointType === "continuous" ? Math.PI : +joint.limit.upper;
        const value = customJointValues?.[name] ?? +joint.limit.lower;

        const RANGE = 10000;
        if (min === max) {
          return ReactNull;
        }
        return (
          <Slider
            key={name}
            label={name}
            min={0}
            max={RANGE}
            value={(RANGE * (value - min)) / (max - min)}
            onChange={(val) => setJointValue(name, min + (val / RANGE) * (max - min))}
            valueFormat={(val) => (min + (val / RANGE) * (max - min)).toFixed(2)}
          />
        );
      })}
    </Stack>
  );
}

function URDFViewer({ config, saveConfig }: Props) {
  const { customJointValues, jointStatesTopic, opacity } = config;
  const [canvas, setCanvas] = useState<HTMLCanvasElement | ReactNull>(ReactNull);
  const { ref: resizeRef, width, height } = useResizeDetector();
  const { model } = useRobotModel();

  const [renderer] = useState(() => new Renderer());
  const [cameraCentered, setCameraCentered] = useState(renderer.cameraCentered);
  const forceUpdate = useUpdate();
  const frameRef = useRef<number | undefined>();
  useEffect(() => {
    const listener = () => {
      if (frameRef.current == undefined) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = undefined;
          setCameraCentered(renderer.cameraCentered);
          forceUpdate();
        });
      }
    };
    renderer.addListener("cameraMove", listener);
    return () => {
      renderer.removeListener("cameraMove", listener);
    };
  }, [renderer, forceUpdate]);

  useCleanup(() => {
    if (frameRef.current != undefined) {
      cancelAnimationFrame(frameRef.current);
    }
    renderer.dispose();
  });

  useLayoutEffect(() => {
    if (canvas) {
      renderer.setCanvas(canvas);
    }
  }, [canvas, renderer]);

  useLayoutEffect(() => {
    if (width != undefined && height != undefined) {
      renderer.setSize(width, height);
    }
  }, [width, height, renderer]);

  useLayoutEffect(() => {
    renderer.setModel(model);
  }, [renderer, model]);

  const {
    [jointStatesTopic ?? ""]: [latestJointStatesMessage] = [],
  } = PanelAPI.useMessagesByTopic<JointState>({
    topics: jointStatesTopic != undefined ? [jointStatesTopic] : [],
    historySize: 1,
  });

  const useCustomJointValues = jointStatesTopic == undefined;
  const jointValues = useMemo(() => {
    if (useCustomJointValues) {
      return customJointValues;
    }
    const values: Record<string, number> = {};
    const jointState = latestJointStatesMessage?.message;
    if (jointState) {
      jointState.name.forEach((name, index) => {
        const position = jointState.position[index];
        if (position != undefined) {
          values[name] = position;
        }
      });
    }
    return values;
  }, [customJointValues, latestJointStatesMessage, useCustomJointValues]);

  useLayoutEffect(() => {
    if (jointValues) {
      renderer.setJointValues(jointValues);
    }
  }, [jointValues, renderer]);

  useLayoutEffect(() => {
    if (opacity != undefined) {
      renderer.setOpacity(opacity);
    }
  }, [renderer, opacity]);

  useLayoutEffect(() => {
    renderer.render();
  });

  const { topics } = PanelAPI.useDataSourceInfo();
  const topicOptions = useMemo(() => {
    const options = filterMap(topics, ({ name, datatype }) =>
      datatype === "sensor_msgs/JointState" ? { key: name, text: name } : undefined,
    );
    // Include a custom option that may not be present (yet) in the list of topics
    if (
      jointStatesTopic != undefined &&
      jointStatesTopic !== "" &&
      !options.some(({ key }) => key === jointStatesTopic)
    ) {
      options.unshift({ key: jointStatesTopic, text: jointStatesTopic });
    }
    return options;
  }, [jointStatesTopic, topics]);

  const theme = useTheme();
  return (
    <Flex col clip>
      <PanelToolbar helpContent={helpContent}>
        <Stack grow horizontal verticalAlign="baseline">
          <Toggle
            inlineLabel
            offText="Manual joint control"
            onText="Topic"
            checked={!useCustomJointValues}
            onChange={(event, checked) =>
              saveConfig({
                jointStatesTopic:
                  checked ?? false ? URDFViewer.defaultConfig.jointStatesTopic : undefined,
              })
            }
          />
          {!useCustomJointValues && (
            <ComboBox
              allowFreeform
              options={topicOptions}
              selectedKey={jointStatesTopic}
              onChange={(event, option, index, value) => {
                if (option) {
                  saveConfig({ jointStatesTopic: option.key as string });
                } else if (value != undefined) {
                  saveConfig({ jointStatesTopic: value });
                }
              }}
            />
          )}
        </Stack>
      </PanelToolbar>
      {model == undefined ? (
        <EmptyState>Drag and drop a URDF file to visualize it.</EmptyState>
      ) : (
        <Flex row clip>
          <div ref={resizeRef} style={{ flex: "1 1 auto", position: "relative" }}>
            <canvas
              ref={(el) => setCanvas(el)}
              width={width}
              height={height}
              style={{
                position: "absolute",
                inset: 0,
              }}
            />
            <Stack
              horizontal
              horizontalAlign="space-between"
              wrap
              style={{
                position: "absolute",
                bottom: theme.spacing.s1,
                left: theme.spacing.s1,
                right: theme.spacing.s1,
              }}
            >
              <Stack.Item grow style={{ minWidth: 120, maxWidth: 300 }}>
                <Slider
                  ariaLabel="Opacity"
                  min={0}
                  max={1}
                  step={0.01}
                  value={opacity}
                  valueFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  onChange={(value) => saveConfig({ opacity: value })}
                />
              </Stack.Item>
              {!cameraCentered && (
                <DefaultButton text="Re-center" onClick={() => renderer.centerCamera()} />
              )}
            </Stack>
          </div>
          {useCustomJointValues && model && (
            <JointValueSliders model={model} config={config} saveConfig={saveConfig} />
          )}
        </Flex>
      )}
    </Flex>
  );
}

URDFViewer.panelType = "URDFViewer";
URDFViewer.defaultConfig = {
  jointStatesTopic: "/joint_states",
  opacity: 0.75,
};
export default Panel(URDFViewer);
