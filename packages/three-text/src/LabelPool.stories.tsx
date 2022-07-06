// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { chunk } from "lodash";
import { useEffect, useRef, useState } from "react";
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

class StoryScene {
  fontManager = new FontManager();
  labelPool = new LabelPool(this.fontManager);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  scene = new THREE.Scene();
  renderer?: THREE.WebGLRenderer;
  controls?: OrbitControls;

  constructor() {
    this.camera.position.set(2, 2, 2);
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.scene.add(new THREE.AxesHelper(5));
  }

  dispose() {
    this.controls?.dispose();
    this.renderer?.dispose();
  }

  render = () => {
    this.renderer?.render(this.scene, this.camera);
  };

  setCanvas(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.controls.addEventListener("change", this.render);
  }
}

export const Basic = Object.assign(BasicTemplate.bind({}), {
  args: {
    billboard: false,
    anchorPointX: 0.5,
    anchorPointY: 0.5,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
  },
  argTypes: {
    anchorPointX: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    anchorPointY: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    positionX: { control: { type: "range", min: -5, max: 5, step: 0.01 } },
    positionY: { control: { type: "range", min: -5, max: 5, step: 0.01 } },
    positionZ: { control: { type: "range", min: -5, max: 5, step: 0.01 } },
  },
});
function BasicTemplate({
  billboard,
  anchorPointX,
  anchorPointY,
  positionX,
  positionY,
  positionZ,
}: {
  billboard: boolean;
  anchorPointX: number;
  anchorPointY: number;
  positionX: number;
  positionY: number;
  positionZ: number;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(ReactNull);

  const [storyScene] = useState(() => new StoryScene());
  const [label, setLabel] = useState<Label>();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error("expected canvas");
    }
    storyScene.setCanvas(canvas);
    const newLabel = storyScene.labelPool.acquire();
    setLabel(newLabel);

    newLabel.update("Hello world!\nExample");
    storyScene.scene.add(newLabel);
    storyScene.render();

    return () => {
      storyScene.labelPool.release(newLabel);
      storyScene.dispose();
    };
  }, [storyScene]);

  useEffect(() => {
    if (label) {
      label.setBillboard(billboard);
      storyScene.render();
    }
  }, [billboard, label, storyScene]);

  useEffect(() => {
    if (label) {
      label.setAnchorPoint(anchorPointX, anchorPointY);
      storyScene.render();
    }
  }, [anchorPointX, anchorPointY, billboard, label, storyScene]);

  useEffect(() => {
    if (label) {
      label.position.set(positionX, positionY, positionZ);
      storyScene.render();
    }
  }, [label, positionX, positionY, positionZ, storyScene]);

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
