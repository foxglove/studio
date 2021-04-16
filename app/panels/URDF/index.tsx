// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useUpdate } from "react-use";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import Flex from "@foxglove-studio/app/components/Flex";
import Panel from "@foxglove-studio/app/components/Panel";
import PanelToolbar from "@foxglove-studio/app/components/PanelToolbar";
import { useRobotModels } from "@foxglove-studio/app/context/RobotModelContext";

function URDF() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | ReactNull>(ReactNull);
  const { ref: resizeRef, width, height } = useResizeDetector();
  console.log("canvas size", { width, height, canvas });
  const { models } = useRobotModels();
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.PerspectiveCamera(75, 1, 0.1, 1000), []);
  const controls = useMemo(() => canvas && new OrbitControls(camera, canvas), [camera, canvas]);

  const renderer = useMemo(() => canvas && new THREE.WebGLRenderer({ canvas }), [canvas]);

  const forceUpdate = useUpdate();
  const frameRef = useRef<number | undefined>();
  useEffect(() => {
    if (renderer) {
      renderer.setClearColor(0xffffff);
      renderer.setClearAlpha(0.5);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    camera.position.z = 5; // + Math.sin(performance.now());
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = true;
      // controls.autoRotate = true;
      controls.addEventListener("change", (e) => {
        if (frameRef.current == undefined) {
          frameRef.current = requestAnimationFrame(() => forceUpdate());
        }
      });
    }
  }, [camera, controls, forceUpdate, renderer]);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  // cube.position.z = 15;

  useLayoutEffect(() => {
    if (width != undefined && height != undefined) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer?.setSize(width, height);
    }
  }, [width, height, camera, renderer]);

  useLayoutEffect(() => {
    frameRef.current = undefined;
    scene.clear();

    const ambientLight = new THREE.HemisphereLight("#666666", "#000");
    ambientLight.groundColor.lerp(ambientLight.color, 0.5);
    ambientLight.intensity = 0.5;
    ambientLight.position.set(0, 1, 0);
    scene.add(ambientLight);

    // Light setup
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(4, 10, 1);
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.normalBias = 0.001;
    dirLight.castShadow = true;
    scene.add(dirLight);
    scene.add(dirLight.target);

    const world = new THREE.Object3D();

    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(40, 40),
      new THREE.ShadowMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.5 }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    plane.receiveShadow = true;
    plane.scale.set(10, 10, 10);
    scene.add(plane);
    scene.add(world);
    // world.add(cube);

    // scene.add(cube);
    if (models.length > 0) {
      scene.add(...models);
      console.log("models", models[0]);
      models[0]?.traverse((c: any) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;

          if (c.material) {
            const mats = (Array.isArray(c.material) ? c.material : [c.material]).map((m: any) => {
              if (m instanceof THREE.MeshBasicMaterial) {
                m = new THREE.MeshPhongMaterial();
              }

              if (m.map) {
                m.map.encoding = THREE.GammaEncoding;
              }

              return m;
            });
            c.material = mats.length === 1 ? mats[0] : mats;
          }
        }
      });
    }
    controls?.update();
    renderer?.render(scene, camera);
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
