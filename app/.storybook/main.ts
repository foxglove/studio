import { Configuration } from "webpack";
import { makeConfig } from "../../webpack.renderer.config";

module.exports = {
  stories: ["../components/Tooltip.stories.tsx"], // FIXME testing
  addons: ["@storybook/addon-essentials", "@storybook/addon-actions"],

  core: {
    builder: "webpack5",
  },

  // Carefully merge our main webpack config with the Storybook default config.
  // For the most part, our webpack config has already been designed to handle
  // all the imports and edge cases we need to support. However, at least some of
  // Storybook's config is required, for instance the HtmlWebpackPlugin that they
  // use to generate the main iframe page.
  webpackFinal: (config: Configuration): Configuration => {
    console.log(JSON.stringify(config, null, "  "));

    config.resolve ||= {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      zlib: require.resolve("browserify-zlib"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      fs: false,
      "@blueprintjs/core": false,
      "@blueprintjs/icons": false,
    };

    config.module ||= {};
    config.module.rules = [
      // ...(config.module?.rules ?? []),
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            onlyCompileBundledFiles: true,
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
    ];

    return config;

    // const rendererConfig = makeConfig(null, { mode: "development" });
    // return {
    //   ...config,
    //   resolve: rendererConfig.resolve,
    //   module: rendererConfig.module,
    //   plugins: [...(config.plugins ?? []), ...(rendererConfig.plugins ?? [])],
    // };
  },
};
