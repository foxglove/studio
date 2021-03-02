// const appWebpackConfig = require("../../webpack.renderer.config");

module.exports = {
  stories: ["../components/**/Modal.stories.tsx"],
  //   stories: ["../components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/preset-typescript"],

  core: {
    builder: "webpack5",
  },

  webpackFinal: (config) => {
    config.module.rules.push({
      // "?raw" imports are used to load stringified typescript in Node Playground
      // https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax
      resourceQuery: /raw/,
      type: "asset/source",
    });
    return config;
    // return {
    //   ...config,
    //   module: {
    //     ...config.module,
    //     rules: appWebpackConfig(null, { mode: "development" }).module.rules,
    //   },
    // };
  },
};
