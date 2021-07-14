// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/* eslint-disable filenames/match-exported */

import { CleanWebpackPlugin } from "clean-webpack-plugin";
import path from "path";
import { Configuration } from "webpack";

import { WebpackArgv } from "@foxglove/studio-base/WebpackArgv";
import { makeConfig } from "@foxglove/studio-base/webpack";

const mainConfig = (env: unknown, argv: WebpackArgv): Configuration => {
  const isDev = argv.mode === "development";
  const allowUnusedVariables = isDev;

  const appWebpackConfig = makeConfig(env, argv, { allowUnusedVariables });

  const config: Configuration = {
    ...appWebpackConfig,

    target: "web",
    context: path.resolve(__dirname, "src"),
    entry: "./index.ts",
    devtool: isDev ? "eval-cheap-module-source-map" : "source-map",

    // There should only be one version of react (and react-dom) in a component tree
    // We expect the user to provide their version of react
    externals: {
      react: "react",
      "react-dom": "react-dom",
    },

    output: {
      publicPath: "",
      filename: "index.js",
      path: path.resolve(__dirname, ".webpack"),
      library: {
        type: "umd",
      },
      //chunkLoading: "import",
      //workerChunkLoading: "import",
    },

    plugins: [
      new CleanWebpackPlugin(),
      ...(appWebpackConfig.plugins ?? []),
      // fixme - make these options to their respective contexts so they aren't in studio base
      /*
      new EnvironmentPlugin({
        AMPLITUDE_API_KEY: process.env.AMPLITUDE_API_KEY ?? null, // eslint-disable-line no-restricted-syntax
        SIGNUP_API_URL: "https://foxglove.dev/api/signup",
        SLACK_INVITE_URL: "https://foxglove.dev/join-slack",
      }),
      */
    ],
  };

  return config;
};

export default mainConfig;
