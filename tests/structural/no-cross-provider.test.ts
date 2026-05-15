import { describe, expect, it } from "vitest";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(__dirname, "..", "..");
const PROVIDERS_DIR = resolve(ROOT, "src", "providers");

/**
 * Each provider subdirectory must be self-contained: no provider imports
 * another provider's internals. They may share env via @/providers/env.
 */
async function walk(dir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const full = join(dir, e);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(ts|tsx)$/.test(e)) out.push(full);
  }
  return out;
}

const IMPORT_RE = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;

function providerOf(file: string): string | null {
  const m = file.replaceAll("\\", "/").match(/\/src\/providers\/([^/]+)/);
  return m && m[1] ? m[1] : null;
}

describe("structural: providers are siloed", () => {
  it("no provider imports another provider's internals", async () => {
    const files = await walk(PROVIDERS_DIR);
    const violations: string[] = [];
    for (const file of files) {
      const myProvider = providerOf(file);
      if (!myProvider) continue;
      const src = await readFile(file, "utf8");
      for (const m of src.matchAll(IMPORT_RE)) {
        const spec = m[1];
        if (!spec) continue;
        // Only @/providers/* imports matter here.
        const match = spec.match(/^@\/providers\/([^/]+)/);
        if (!match || !match[1]) continue;
        const importedProvider = match[1];
        if (importedProvider !== myProvider) {
          violations.push(
            `${relative(ROOT, file)} imports "${spec}" (provider "${importedProvider}" ≠ own "${myProvider}")`,
          );
        }
      }
    }
    if (violations.length > 0) {
      throw new Error(`Cross-provider import violations:\n  ${violations.join("\n  ")}`);
    }
    expect(violations).toEqual([]);
  });
});
