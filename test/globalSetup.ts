// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import webpack from "webpack";

import { WebpackArgv } from "../WebpackArgv";
import mainConfig from "../webpack.main.config";
import preloadConfig from "../webpack.preload.config";
import renderConfig from "../webpack.renderer.config";

const webpackArgs: WebpackArgv = { mode: "production" };
const compiler = webpack([
  mainConfig(undefined, webpackArgs),
  preloadConfig(undefined, webpackArgs),
  renderConfig(undefined, webpackArgs),
]);

// global jest test setup builds the webpack build before running any integration tests
export default async (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line no-restricted-syntax
    console.info("Building Webpack");
    compiler.run((err) => {
      if (err) {
        reject(err);
        return;
      }
      // eslint-disable-next-line no-restricted-syntax
      console.info("Webpack build complete");
      resolve();
    });
  });
};
