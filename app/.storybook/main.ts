import { makeConfig } from "../../webpack.renderer.config";

module.exports = {
  stories: ["../components/**/Modal.stories.tsx"],
  //stories: ["../components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-actions"],

  core: {
    builder: "webpack5",
  },

  webpackFinal: (config: any) => {
    const rendererConfig = makeConfig(null, { mode: "development" });
    return {
      ...config,
      resolve: { ...rendererConfig.resolve },
      module: {
        ...config.module,
        ...rendererConfig.module,
      },
      plugins: [...config.plugins, ...(rendererConfig.plugins as unknown[])],
    };
  },
};
