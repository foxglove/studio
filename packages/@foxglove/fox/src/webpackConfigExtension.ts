// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CleanWebpackPlugin } from "clean-webpack-plugin";
import * as path from "path";
import { Configuration } from "webpack";

export default (
  extensionPath: string,
  entryPoint: string,
  env: string | undefined,
): Configuration => {
  extensionPath = path.resolve(extensionPath);
  const isDev = env == undefined || env === "development";

  const config: Configuration = {
    target: "web",
    mode: isDev ? "development" : "production",
    context: extensionPath,
    entry: entryPoint,
    output: {
      path: path.join(extensionPath, "dist"),
      filename: "extension.js",
      libraryTarget: "commonjs2",
    },
    devtool: isDev ? "eval-source-map" : "source-map",
    externals: {
      "@foxglove/studio": "studio",
      "object-assign": "Object.assign",
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
              loader: "esbuild-loader",
              options: {
                loader: "tsx",
                target: "es2020",
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
