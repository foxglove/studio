// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { chunk } from "lodash";
import { useEffect, useRef } from "react";
import seedrandom from "seedrandom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

import { FontManager } from "./FontManager";
import { Label, LabelPool } from "./LabelPool";

export default {
  title: "LabelPool",
};

const rng = seedrandom("1");

function makeScene(canvas: HTMLCanvasElement) {
  const fontManager = new FontManager();
  const labelPool = new LabelPool(fontManager);

  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    2000,
  );
  camera.position.set(2, 2, 2);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  function render() {
    renderer.render(scene, camera);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();

  controls.addEventListener("change", render);

  const dispose = () => {
    controls.dispose();
    renderer.dispose();
  };
  return { scene, camera, render, labelPool, dispose };
}

Basic.parameters = { colorScheme: "dark" };
export function Basic(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(ReactNull);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const { render, scene, labelPool, dispose } = makeScene(canvas);

    const label = labelPool.acquire();
    label.update("Hello world!\nExample");
    scene.add(label);

    render();
    return dispose;
  }, []);

  return <canvas ref={canvasRef} width={400} height={400} style={{ width: 400, height: 400 }} />;
}

const tempColor = new THREE.Color();

class Word {
  floatingIndices: number[] = [];
  length = 0;
  lastChangeTime = 0;
  timeOffset = rng() * 5000;
  constructor(public label: Label, private text: string) {
    label.update(text);
  }

  startFrame(t: number) {
    this.label.rotation.set(0, (t + this.timeOffset) / 1000, 0);
    tempColor.setHSL((t + this.timeOffset) / 5000, 1, 0.8);
    this.label.setColor(tempColor.r, tempColor.g, tempColor.b);
    tempColor.setHSL(1 - (t + this.timeOffset) / 5000, 0.5, 0.2);
    this.label.setBackgroundColor(tempColor.r, tempColor.g, tempColor.b);

    this.label.setOpacity(0.5 + 0.5 * Math.sin((t + this.timeOffset) / 1000));

    if (t < this.lastChangeTime + 50) {
      return;
    }
    this.lastChangeTime = t;
    if (rng() < 0.2 && this.floatingIndices.length > 0) {
      this.floatingIndices.pop();
      if (this.length === this.text.length && this.floatingIndices.length === 0) {
        this.length = 0;
      }
    }

    if (rng() < 0.7 && this.length < this.text.length) {
      this.floatingIndices.splice(Math.floor(rng() * this.floatingIndices.length), 0, this.length);
      this.length++;
    }
    let string = "";
    let lineLength = 0;
    for (let i = 0; i < this.length; i++) {
      const char = this.text[i]!;
      if (char === " ") {
        if (lineLength > 10) {
          string += "\n";
          lineLength = 0;
        } else {
          string += char;
        }
      } else if (!this.floatingIndices.includes(i)) {
        string += char;
      } else {
        const isUppercase = char.toUpperCase() === char;
        string += String.fromCharCode(
          (isUppercase ? 0 : 32) + 65 + Math.floor(rng() * (90 - 65 + 1)),
        );
      }
      lineLength++;
    }
    this.label.update(string);
  }
}

export function Cipher(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(ReactNull);
  const canvasRef = useRef<HTMLCanvasElement>(ReactNull);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const stats = Stats();
    containerRef.current?.appendChild(stats.domElement);
    const { render, camera, scene, labelPool, dispose } = makeScene(canvas);

    camera.position.set(10, 10, 10);

    const exampleText =
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero animi omnis deleniti dolorum eligendi corporis, amet expedita doloribus dicta quasi vero numquam fugiat! Inventore obcaecati, harum in laborum distinctio tenetur.";
    const texts = chunk(exampleText.split(" "), 3).map((words) =>
      words.join(" ").replace(/\s/g, () => (rng() < 0.5 ? "\n" : " ")),
    );

    const words: Word[] = [];
    const interval = setInterval(() => {
      if (words.length > 0) {
        return;
      }
      const label = labelPool.acquire();
      label.position.set((rng() - 0.5) * 2, (rng() - 0.5) * 2, (rng() - 0.5) * 2);
      scene.add(label);
      words.push(new Word(label, texts[Math.floor(rng() * texts.length)]!));

      if (words.length > 10) {
        const word = words.shift()!;
        labelPool.release(word.label);
      }
    }, 500);

    let raf = requestAnimationFrame(frame);
    let start: number | undefined;
    function frame(stamp: number) {
      if (start == undefined) {
        start = stamp;
      }
      for (const word of words) {
        word.startFrame(stamp - start);
      }
      render();
      stats.update();
      raf = requestAnimationFrame(frame);
    }

    return () => {
      dispose();
      clearInterval(interval);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <canvas ref={canvasRef} width={400} height={400} style={{ width: 400, height: 400 }} />
    </div>
  );
}
