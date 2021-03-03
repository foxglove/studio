// const rendererWebpackConfig = require("../../webpack.renderer.config");
// import rendererWebpackConfig from "../../webpack.renderer.config";
const webpack = require("webpack");
const path = require("path");
module.exports = {
  stories: ["../components/**/Modal.stories.tsx"],
  //   stories: ["../components/**/*.stories.@(ts|tsx)"],
  //   addons: ["@storybook/preset-typescript"],

  core: {
    builder: "webpack5",
  },

  webpackFinal: (config: any) => {
    config.resolve = {
      ...config.resolve,

      // extensions: [".js", ".ts", ".jsx", ".tsx"],
      alias: {
        "react-dnd": require.resolve("react-dnd"),
        "styled-components": require.resolve("styled-components"),
      },
      fallback: {
        path: require.resolve("path-browserify"),
        stream: require.resolve("stream-browserify"),
        zlib: require.resolve("browserify-zlib"),
        crypto: require.resolve("crypto-browserify"),
        fs: false,
        pnpapi: false,
        // These are optional for react-mosaic-component
        "@blueprintjs/core": false,
        "@blueprintjs/icons": false,
        domain: false,
      },
    };
    config.module.rules = [
      // Add support for native node modules
      {
        test: /\.node$/,
        use: "node-loader",
      },
      {
        test: /\.wasm$/,
        type: "asset/resource",
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            // https://github.com/TypeStrong/ts-loader#onlycompilebundledfiles
            // avoid looking at files which are not part of the bundle
            onlyCompileBundledFiles: true,
          },
        },
      },
      {
        // "?raw" imports are used to load stringified typescript in Node Playground
        // https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax
        resourceQuery: /raw/,
        type: "asset/source",
      },
      { test: /\.(md|template)$/, type: "asset/source" },
      {
        test: /\.svg$/,
        loader: "react-svg-loader",
        options: {
          svgo: {
            plugins: [{ removeViewBox: false }, { removeDimensions: false }],
          },
        },
      },
      { test: /\.ne$/, loader: "nearley-loader" },
      {
        test: /\.(png|jpg|gif)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
      },
      {
        test: /\.s?css$/,
        loader: "style-loader",
        sideEffects: true,
      },
      {
        test: /\.s?css$/,
        oneOf: [
          {
            test: /\.module\./,
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[path][name]-[sha512:hash:base32:5]--[local]",
              },
              sourceMap: true,
            },
          },
          { loader: "css-loader", options: { sourceMap: true } },
        ],
      },
      { test: /\.scss$/, loader: "sass-loader", options: { sourceMap: true } },
      { test: /\.woff2?$/, type: "asset/inline" },
      { test: /\.(glb|bag|ttf|bin)$/, type: "asset/resource" },
      {
        test: /node_modules[\\/]compressjs[\\/].*\.js/,
        loader: "string-replace-loader",
        options: {
          search: "if (typeof define !== 'function') { var define = require('amdefine')(module); }",
          replace:
            "/* webviz: removed broken amdefine shim (https://github.com/webpack/webpack/issues/5316) */",
        },
      },
    ];
    // config.plugins.push(new webpack.HotModuleReplacementPlugin());
    config.plugins.push(
      new webpack.ProvidePlugin({
        // since we avoid "import React from 'react'" we shim here when used globally
        React: "react",
        // the buffer module exposes the Buffer class as a property
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
        setImmediate: ["@foxglove-studio/app/shared/setImmediate", "default"],
      }),
    );
    // console.log("original config", config);
    return config;
    // const rendererConfig = rendererWebpackConfig(null, { mode: "development" });
    // return {
    //   ...config,
    //   //   resolve: rendererConfig.resolve,
    //   module: rendererConfig.module,
    //   //   plugins: rendererConfig.plugins,
    //   //   context: path.resolve(__dirname, ".."),
    // };
    // return {
    //   ...config,
    //   module: {
    //     ...config.module,
    //     rules: rendererWebpackConfig(null, { mode: "development" }).module.rules,
    //   },
    // };
  },
};
