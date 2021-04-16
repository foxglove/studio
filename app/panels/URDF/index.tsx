// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { useLayoutEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { URDFRobot } from "urdf-loader/src/URDFClasses";

import Panel from "@foxglove-studio/app/components/Panel";
import PanelToolbar from "@foxglove-studio/app/components/PanelToolbar";
import { useRobotModels } from "@foxglove-studio/app/context/RobotModelContext";
import useCleanup from "@foxglove-studio/app/hooks/useCleanup";

class Renderer {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  private controls?: OrbitControls;
  private renderer?: THREE.WebGLRenderer;
  private ambientLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private models: readonly URDFRobot[] = [];

  private frame?: number;

  constructor() {
    this.camera.position.z = 5;

    this.ambientLight = new THREE.HemisphereLight("#666666", "#000");
    this.ambientLight.groundColor.lerp(this.ambientLight.color, 0.5);
    this.ambientLight.intensity = 0.8;
    this.ambientLight.position.set(0, 1, 0);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff);
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setClearColor(0xffffff);
    this.renderer.setClearAlpha(0.5);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;
    this.controls.addEventListener("change", () => {
      if (this.frame == undefined) {
        this.frame = requestAnimationFrame(() => this.render());
      }
    });
  }

  setSize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(width, height);
  }

  setModels(models: readonly URDFRobot[]) {
    for (const model of this.models) {
      this.scene.remove(model);
    }
    this.models = models;
    for (const model of this.models) {
      this.scene.add(model);
    }
  }

  render() {
    if (this.frame != undefined) {
      cancelAnimationFrame(this.frame);
      this.frame = undefined;
    }
    this.dirLight.position.copy(this.camera.position);
    this.renderer?.render(this.scene, this.camera);
  }

  dispose() {
    if (this.frame != undefined) {
      cancelAnimationFrame(this.frame);
      this.frame = undefined;
    }
  }
}

function URDF() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | ReactNull>(ReactNull);
  const { ref: resizeRef, width, height } = useResizeDetector();
  const { models } = useRobotModels();

  const [renderer] = useState(() => new Renderer());
  useCleanup(() => renderer.dispose());

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
    renderer.setModels(models);
  }, [renderer, models]);

  useLayoutEffect(() => {
    renderer.render();
  });

  return (
    <div ref={resizeRef} style={{ flex: "1 1 auto" }}>
      <PanelToolbar floating />
      <canvas
        ref={(el) => setCanvas(el)}
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />
    </div>
  );
}

URDF.panelType = "URDF";
URDF.defaultConfig = {};
export default Panel(URDF);
