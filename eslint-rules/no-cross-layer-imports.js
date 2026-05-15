/**
 * Custom ESLint rule enforcing the layered domain architecture.
 *
 * Rules enforced:
 *  1. Within `src/domains/<name>/`, files may only import from same-or-lower
 *     layers in the SAME domain. Layer order:
 *       types < config < repo < service < runtime < ui
 *  2. A domain may NOT import from a sibling domain.
 *  3. Only `repo.ts` (or files under `repo/`) may import from `src/providers/`.
 *  4. `src/providers/` may NOT import from `src/domains/`.
 *  5. `src/app/` may import from a domain's `runtime` or `ui` only.
 *
 * See docs/DESIGN.md and docs/design-docs/providers-and-boundaries.md.
 */

const LAYER_ORDER = ["types", "config", "repo", "service", "runtime", "ui"];

/**
 * @param {string} file Absolute path of the file being linted.
 * @returns {{ kind: "domain", domain: string, layer: string } |
 *           { kind: "provider" } |
 *           { kind: "app" } |
 *           { kind: "other" }}
 */
function classify(file) {
  const norm = file.replaceAll("\\", "/");
  const domainMatch = norm.match(/\/src\/domains\/([^/]+)\/([^/]+)/);
  if (domainMatch) {
    const [, domain, segment] = domainMatch;
    // segment is e.g. "types.ts" or "ui" (folder)
    const layer = segment.replace(/\.(ts|tsx)$/, "");
    return { kind: "domain", domain, layer };
  }
  if (/\/src\/providers(\/|$)/.test(norm)) return { kind: "provider" };
  if (/\/src\/app(\/|$)/.test(norm)) return { kind: "app" };
  return { kind: "other" };
}

function resolveImport(specifier, sourceFile) {
  if (specifier.startsWith("@/")) {
    return specifier.replace(/^@\//, "/src/");
  }
  if (specifier.startsWith(".")) {
    // Best-effort: only relative imports inside the same domain matter for
    // layer-order checks. Convert to a pseudo-path by appending under the
    // source file's directory.
    const dir = sourceFile.replaceAll("\\", "/").split("/").slice(0, -1).join("/");
    const joined = `${dir}/${specifier}`;
    // Strip ./ and ../ segments
    const parts = joined.split("/");
    const out = [];
    for (const p of parts) {
      if (p === "..") out.pop();
      else if (p !== "." && p !== "") out.push(p);
    }
    return "/" + out.join("/");
  }
  return null; // bare package import — irrelevant
}

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: { description: "Enforce layered-domain architecture imports." },
    schema: [],
    messages: {
      crossDomain:
        "Cross-domain import forbidden: '{{from}}' may not import from sibling domain '{{toDomain}}'. See docs/DESIGN.md.",
      higherLayer:
        "Upward layer import forbidden: '{{fromLayer}}' may not import '{{toLayer}}' in the same domain.",
      providerOutsideRepo:
        "Only repo.ts may import from src/providers/. '{{fromLayer}}' may not. See docs/design-docs/providers-and-boundaries.md.",
      providerImportsDomain:
        "Providers may not import from src/domains/. Providers are transport, not business logic.",
      appImportsInternal: "src/app/ may only import a domain's runtime or ui, not '{{toLayer}}'.",
    },
  },
  create(context) {
    const file = context.filename ?? context.getFilename();
    const me = classify(file);

    function check(node, specifier) {
      const resolved = resolveImport(specifier, file);
      if (!resolved) return;
      const target = classify(resolved);

      // Rule 4: providers may not import domains.
      if (me.kind === "provider" && target.kind === "domain") {
        context.report({ node, messageId: "providerImportsDomain" });
        return;
      }

      if (me.kind === "domain" && target.kind === "domain") {
        if (me.domain !== target.domain) {
          context.report({
            node,
            messageId: "crossDomain",
            data: { from: me.domain, toDomain: target.domain },
          });
          return;
        }
        // Same domain — check layer order.
        const fromIdx = LAYER_ORDER.indexOf(me.layer);
        const toIdx = LAYER_ORDER.indexOf(target.layer);
        if (fromIdx >= 0 && toIdx >= 0 && toIdx > fromIdx) {
          context.report({
            node,
            messageId: "higherLayer",
            data: { fromLayer: me.layer, toLayer: target.layer },
          });
          return;
        }
      }

      // Rule 3: only repo may import providers.
      if (me.kind === "domain" && target.kind === "provider") {
        if (me.layer !== "repo") {
          context.report({
            node,
            messageId: "providerOutsideRepo",
            data: { fromLayer: me.layer },
          });
          return;
        }
      }

      // Rule 5: app may only import runtime/ui from a domain.
      if (me.kind === "app" && target.kind === "domain") {
        if (target.layer !== "runtime" && target.layer !== "ui") {
          context.report({
            node,
            messageId: "appImportsInternal",
            data: { toLayer: target.layer },
          });
        }
      }
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
    };
  },
};

export default rule;
