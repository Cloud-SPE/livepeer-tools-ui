#!/usr/bin/env node
/**
 * Convert MUI v6-era Box/Typography/Stack system props to v9 sx-prop form.
 *
 *   <Box mt={2} display="flex" sx={{ p: 1 }}>
 * becomes
 *   <Box sx={{ mt: 2, display: "flex", p: 1 }}>
 *
 * Run: node scripts/migrate-mui-sx.mjs <file> [<file>...]
 *
 * Naive but practical regex transform — covers the common patterns the
 * codebase uses. Verify with typecheck/test/build after.
 */
import { readFileSync, writeFileSync } from "node:fs";

// Props that MUI v7+ stripped from Box/Typography/Stack (must move to sx).
const DEPRECATED = new Set([
  // spacing
  "m",
  "mt",
  "mb",
  "ml",
  "mr",
  "mx",
  "my",
  "p",
  "pt",
  "pb",
  "pl",
  "pr",
  "px",
  "py",
  // layout
  "display",
  "justifyContent",
  "alignItems",
  "alignContent",
  "alignSelf",
  "flexGrow",
  "flexShrink",
  "flexDirection",
  "flexWrap",
  "flex",
  "gap",
  // sizing
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  // typography-ish
  "textAlign",
  "fontWeight",
  "fontSize",
  "lineHeight",
  // border / bg (less common, but in scope)
  "border",
  "borderRadius",
  "bgcolor",
]);

// Components to scan for. Stack/Container etc. share the same sx contract.
const COMPONENTS = [
  "Box",
  "Typography",
  "Stack",
  "Container",
  "Grid",
  "Paper",
  "Card",
  "CardContent",
];

function parseAttribute(text, startIdx) {
  // Match `name=`. Whitespace already consumed.
  const nameMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*(?:=)?/.exec(text.slice(startIdx));
  if (!nameMatch) return null;
  const name = nameMatch[1];
  let i = startIdx + nameMatch[0].length;
  // No `=` -> boolean prop
  if (!nameMatch[0].includes("=")) {
    return { name, raw: name, value: "true", isExpr: false, end: i };
  }
  // After `=`, expect either `"..."`, `'...'`, or `{ ... }`.
  while (text[i] === " " || text[i] === "\t" || text[i] === "\n") i++;
  if (text[i] === '"' || text[i] === "'") {
    const quote = text[i];
    let j = i + 1;
    while (j < text.length && text[j] !== quote) j++;
    if (j >= text.length) return null;
    const value = text.slice(i + 1, j);
    return {
      name,
      raw: text.slice(startIdx, j + 1),
      value: JSON.stringify(value),
      isExpr: false,
      end: j + 1,
    };
  }
  if (text[i] === "{") {
    let depth = 1;
    let j = i + 1;
    let inStr = null;
    while (j < text.length && depth > 0) {
      const c = text[j];
      if (inStr) {
        if (c === "\\") j++;
        else if (c === inStr) inStr = null;
      } else {
        if (c === '"' || c === "'" || c === "`") inStr = c;
        else if (c === "{") depth++;
        else if (c === "}") depth--;
      }
      j++;
    }
    const expr = text.slice(i + 1, j - 1).trim();
    return {
      name,
      raw: text.slice(startIdx, j),
      value: expr,
      isExpr: true,
      end: j,
    };
  }
  return null;
}

function parseAttributes(text) {
  // text is the inside of `<Component ` up to the `>` or `/>` (excluding it)
  const attrs = [];
  let i = 0;
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (i >= text.length) break;
    const attr = parseAttribute(text, i);
    if (!attr) return null;
    attrs.push(attr);
    i = attr.end;
  }
  return attrs;
}

function rebuildOpening(component, attrs, selfClosing) {
  const sxAttr = attrs.find((a) => a.name === "sx");
  const other = attrs.filter((a) => a.name !== "sx");
  const sxParts = [];
  // Existing sx entries first — we'll prepend deprecated ones below.
  if (sxAttr && sxAttr.isExpr) {
    // If sx is `{{ ... }}` (object literal), pull out the inner contents.
    const expr = sxAttr.value.trim();
    if (expr.startsWith("{") && expr.endsWith("}")) {
      const inner = expr.slice(1, -1).trim();
      if (inner) sxParts.push(inner);
    } else {
      // Non-literal: keep as-is, spread into a new object.
      sxParts.push(`...(${expr})`);
    }
  }
  const keptAttrs = [];
  const promoted = [];
  for (const attr of other) {
    if (DEPRECATED.has(attr.name)) {
      const value = attr.isExpr ? attr.value : attr.value; // already in string form
      // Quote key if it isn't an identifier (rare).
      promoted.push(`${attr.name}: ${value}`);
    } else {
      keptAttrs.push(attr);
    }
  }
  if (promoted.length === 0) return null; // no transform needed

  const allSx = [...promoted, ...sxParts].join(", ");
  const sxRendered = `sx={{ ${allSx} }}`;

  const rebuilt =
    "<" +
    component +
    [...keptAttrs.map((a) => " " + a.raw), " " + sxRendered].join("") +
    (selfClosing ? " />" : ">");
  return rebuilt;
}

function transform(source) {
  // Match opening tags of relevant components. We grab the attributes block
  // and detect self-close.
  const tagRe = new RegExp(
    "<(" + COMPONENTS.join("|") + ")((?:\\s|\\{[^}]*\\}|\"[^\"]*\"|'[^']*'|[^\"'/>])*)(/?)>",
    "g",
  );
  let changed = 0;
  const out = source.replace(tagRe, (match, name, attrsRaw, slash) => {
    const attrs = parseAttributes(attrsRaw);
    if (!attrs) return match;
    if (!attrs.some((a) => DEPRECATED.has(a.name))) return match;
    const replacement = rebuildOpening(name, attrs, slash === "/");
    if (!replacement) return match;
    changed++;
    return replacement;
  });
  return { out, changed };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: migrate-mui-sx.mjs <file>...");
  process.exit(1);
}
let total = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const { out, changed } = transform(src);
  if (changed > 0) {
    writeFileSync(f, out);
    console.log(`[migrate] ${f}: ${changed} transform(s)`);
    total += changed;
  }
}
console.log(`[migrate] total transforms: ${total}`);
