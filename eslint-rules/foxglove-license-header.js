// @ts-check

const COMMENT = `
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
`.trim();

module.exports = {
  create: (context) => {
    return {
      Program: (node) => {
        const source = context.getSourceCode().getText();
        console.log("derp", source.substr(0, 200));
        context.report({
          loc: node.loc,
          message: "derp2",
          fix: (fixer) => {
            fixer.insertTextBefore(node, COMMENT);
          },
        });
      },
    };
  },
};
