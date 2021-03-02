// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// Shared configuration used by all jest projects
export const sharedConfig = {
  rootDir: ".",
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/app/tsconfig.json",
    },
  },
  setupFiles: [
    "<rootDir>/app/test/setup.ts",
    "<rootDir>/app/test/setupEnzyme.ts",
    "jest-canvas-mock",
  ],
  setupFilesAfterEnv: ["<rootDir>/app/test/setupTestFramework.ts"],
  restoreMocks: true,
  transform: {
    "\\.ne$": "<rootDir>/app/test/transformers/neTransformer.js",
    "\\.(bin|template|wasm)$": "<rootDir>/app/test/transformers/rawTransformer.js",
  },
  moduleNameMapper: {
    "worker-loader.*!.*/UserNodePlayer/.+Worker":
      "<rootDir>/app/players/UserNodePlayer/worker.mock.ts",
    "worker-loader.*!.*": "<rootDir>/app/test/mocks/MockWorker.ts",
    "(.*)\\?raw$": "$1",
    "\\.svg$": "<rootDir>/app/test/mocks/MockSvg.tsx",
    "react-monaco-editor": "<rootDir>/app/test/stubs/MonacoEditor.tsx",
    "\\.(glb|md|png)$": "<rootDir>/app/test/mocks/fileMock.ts",
    "\\.(css|scss)$": "<rootDir>/app/test/mocks/styleMock.ts",
  },
  modulePathIgnorePatterns: ["<rootDir>/.webpack"],
};

// Configuration used by root jest project only
export default {
  ...sharedConfig,
  projects: [
    "<rootDir>",
    "<rootDir>/app/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    // Ignore userUtils tests - they are run in the nested jest project
    "\\/nodeTransformerWorker\\/typescript\\/userUtils\\/",
  ],
  transform: {
    ...sharedConfig.transform,
    "\\/nodeTransformerWorker\\/typescript\\/userUtils\\/.+\\.ts":
      "<rootDir>/app/test/transformers/rawTransformer.js",
  },
};
