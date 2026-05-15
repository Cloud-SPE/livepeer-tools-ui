import { describe, expect, it } from "vitest";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(__dirname, "..", "..");
const SRC = resolve(ROOT, "src");
const LAYER_ORDER = ["types", "config", "repo", "service", "runtime", "ui"];

/**
 * Walk a directory recursively, returning file paths (absolute).
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
    if (s.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (/\.(ts|tsx)$/.test(e)) {
      out.push(full);
    }
  }
  return out;
}

function classify(file: string) {
  const norm = file.replaceAll("\\", "/");
  const domainMatch = norm.match(/\/src\/domains\/([^/]+)\/([^/]+)/);
  if (domainMatch && domainMatch[1] && domainMatch[2]) {
    const domain = domainMatch[1];
    const layer = domainMatch[2].replace(/\.(ts|tsx)$/, "");
    return { kind: "domain" as const, domain, layer };
  }
  if (/\/src\/providers(\/|$)/.test(norm)) return { kind: "provider" as const };
  if (/\/src\/app(\/|$)/.test(norm)) return { kind: "app" as const };
  return { kind: "other" as const };
}

function resolveSpecifier(spec: string, file: string): string | null {
  if (spec.startsWith("@/")) return "/" + spec.replace(/^@\//, "src/");
  if (spec.startsWith(".")) {
    const segs = file.replaceAll("\\", "/").split("/");
    const dir = segs.slice(0, -1).join("/");
    const joined = `${dir}/${spec}`;
    const parts = joined.split("/");
    const out: string[] = [];
    for (const p of parts) {
      if (p === "..") out.pop();
      else if (p !== "." && p !== "") out.push(p);
    }
    return "/" + out.join("/");
  }
  return null;
}

const IMPORT_RE = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;

interface Violation {
  file: string;
  importSpec: string;
  reason: string;
}

async function collectViolations(): Promise<Violation[]> {
  const files = await walk(SRC);
  const violations: Violation[] = [];
  for (const file of files) {
    if (file.includes("/src/generated/")) continue;
    const src = await readFile(file, "utf8");
    const me = classify(file);
    for (const m of src.matchAll(IMPORT_RE)) {
      const spec = m[1];
      if (!spec) continue;
      const resolved = resolveSpecifier(spec, file);
      if (!resolved) continue;
      const target = classify(resolved);

      if (me.kind === "provider" && target.kind === "domain") {
        violations.push({
          file: relative(ROOT, file),
          importSpec: spec,
          reason: "providers may not import domains",
        });
      }
      if (me.kind === "domain" && target.kind === "domain") {
        if (me.domain !== target.domain) {
          violations.push({
            file: relative(ROOT, file),
            importSpec: spec,
            reason: `cross-domain import: ${me.domain} -> ${target.domain}`,
          });
        } else {
          const fi = LAYER_ORDER.indexOf(me.layer);
          const ti = LAYER_ORDER.indexOf(target.layer);
          if (fi >= 0 && ti >= 0 && ti > fi) {
            violations.push({
              file: relative(ROOT, file),
              importSpec: spec,
              reason: `upward layer import: ${me.layer} -> ${target.layer}`,
            });
          }
        }
      }
      if (me.kind === "domain" && target.kind === "provider" && me.layer !== "repo") {
        violations.push({
          file: relative(ROOT, file),
          importSpec: spec,
          reason: `non-repo layer (${me.layer}) imports a provider`,
        });
      }
      if (me.kind === "app" && target.kind === "domain") {
        if (target.layer !== "runtime" && target.layer !== "ui") {
          violations.push({
            file: relative(ROOT, file),
            importSpec: spec,
            reason: `app imports ${target.layer} of domain ${target.domain} (must be runtime or ui)`,
          });
        }
      }
    }
  }
  return violations;
}

describe("structural: layered imports", () => {
  it("enforces the layered domain architecture across src/", async () => {
    const violations = await collectViolations();
    if (violations.length > 0) {
      const lines = violations
        .map((v) => `  ${v.file} :: import "${v.importSpec}" — ${v.reason}`)
        .join("\n");
      throw new Error(`Layered-import violations:\n${lines}`);
    }
    expect(violations).toEqual([]);
  });
});
