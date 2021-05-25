// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CleanWebpackPlugin } from "clean-webpack-plugin";
import * as path from "path";
import type { Configuration } from "webpack";

export default (
  extensionPath: string,
  entryPoint: string,
  env: string | undefined,
): Configuration => {
  extensionPath = path.resolve(extensionPath);
  const isDev = env == undefined || env === "development";
  const configFile = path.join(extensionPath, "tsconfig.json");

  const config: Configuration = {
    target: "web",
    mode: isDev ? "none" : "production",
    context: extensionPath,
    entry: entryPoint,
    output: {
      path: path.join(extensionPath, "dist"),
      filename: "extension.js",
      library: {
        name: "entrypoint",
        type: "var",
      },
    },
    devtool: isDev ? "eval-source-map" : "source-map",
    externals: {
      "@foxglove/studio": "studio",
      react: "react",
      "react-dom": "reactDom",
    },
    resolve: {
      extensions: [".js", ".ts", ".jsx", ".tsx"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
              options: {
                configFile,
              },
            },
          ],
        },
      ],
    },
    plugins: [new CleanWebpackPlugin()],
  };

  return config;
};
