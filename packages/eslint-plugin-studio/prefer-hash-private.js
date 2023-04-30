// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

const { findVariable } = require("@eslint-community/eslint-utils");

/**
 * @param {import("estree").Node} node
 */
function getEnclosingClass(node) {
  for (let current = node; current; current = current.parent) {
    if (current.type === "ClassDeclaration") {
      return current;
    } else if (current.type === "FunctionDeclaration") {
      return undefined;
    } else if (
      current.type === "FunctionExpression" &&
      current.parent?.parent?.type !== "ClassBody"
    ) {
      return undefined;
    }
  }
}

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    fixable: "code",
  },
  create: (context) => {
    /** @type {Map<import("estree").ClassDeclaration, { privates: Set<import("estree").Identifier>, memberReferences: Map<string, import("estree").Identifier[]> }>} */
    const infoByClass = new Map();
    return {
      [`MemberExpression:has(ThisExpression.object) > Identifier.property`]: (
        /** @type {import("estree").Identifier} */ node,
      ) => {
        const cls = getEnclosingClass(node);
        if (!cls) {
          return;
        }
        let info = infoByClass.get(cls);
        if (!info) {
          info = { privates: new Set(), memberReferences: new Map() };
          infoByClass.set(cls, info);
        }
        let refs = info.memberReferences.get(node.name);
        if (!refs) {
          refs = [];
          info.memberReferences.set(node.name, refs);
        }
        refs.push(node);
      },
      [`:matches(PropertyDefinition, MethodDefinition)[accessibility="private"] > Identifier.key`]:
        (
          /** @type {import("estree").PropertyDefinition | import("estree").MethodDefinition} */
          node,
        ) => {
          // debugger;
          const cls = getEnclosingClass(node);
          if (!cls) {
            throw new Error("No class around private definition??");
          }

          let info = infoByClass.get(cls);
          if (!info) {
            info = { privates: new Set(), memberReferences: new Map() };
            infoByClass.set(cls, info);
          }
          info.privates.add(node);

          // const scope = context.getScope();
          // const v = findVariable(context.getScope(), node.key.name);
          // console.log(`scope for ${node.key.name} is:`, scope);
          // console.log(`fn scope:`, scope.childScopes[1]);
          // console.log(`findVariable returned`, v);
          // const variable = scope.set.get(node.key.name);
          // if (!variable) {
          //   throw new Error(`Couldn't find scope variable named ${node.key.name}`);
          // }

          // const newName = "#" + node.key.name.replace(/^_/, "");

          // context.report({
          //   node,
          //   message: "Use `#` language feature instead of `private` accessibility modifier",
          //   suggest: [
          //     {
          //       desc: `Rename to ${newName}`,
          //       fix: (fixer) => {
          //         return variable.references.map((ref) => fixer.replaceText(ref.identifier, newName));
          //       },
          //     },
          //   ],
          // });
        },

      [`ClassDeclaration:exit`]: (node) => {
        const info = infoByClass.get(node);
        if (!info) {
          return;
        }

        for (const privateIdentifier of info.privates) {
          const refs = info.memberReferences.get(privateIdentifier.name);
          if (!refs) {
            continue;
          }

          const newName = "#" + privateIdentifier.name.replace(/^_/, "");
          context.report({
            node: privateIdentifier,
            message: `Prefer \`${newName}\` language feature over \`private ${privateIdentifier.name}\` accessibility modifier`,
            *fix(fixer) {
              const privateToken = context
                .getSourceCode()
                .getTokens(privateIdentifier.parent)
                .find((token) => token.type === "Keyword" && token.value === "private");
              if (privateToken) {
                yield fixer.removeRange([privateToken.range[0], privateToken.range[1] + 1]);
              }
              yield fixer.replaceText(privateIdentifier, newName);
              for (const ref of refs) {
                yield fixer.replaceText(ref, newName);
              }
            },
          });
        }
      },
    };
  },
};
