#!/usr/bin/env node
/**
 * MUI v7+ deprecated TextField's `inputProps` and `InputLabelProps` in
 * favor of `slotProps={{ htmlInput: {...}, inputLabel: {...} }}`.
 *
 * Naive regex transform; covers the literal-object-prop case used in this
 * codebase. Verify with typecheck after.
 */
import { readFileSync, writeFileSync } from "node:fs";

function balancedBraces(text, start) {
  // text[start] === '{'
  let depth = 1;
  let i = start + 1;
  let inStr = null;
  while (i < text.length && depth > 0) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === inStr) inStr = null;
    } else {
      if (c === '"' || c === "'" || c === "`") inStr = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
    }
    i++;
  }
  return i; // index AFTER closing brace
}

function rewriteTextField(source) {
  // Find each `<TextField` opening tag and rewrite within.
  let out = "";
  let i = 0;
  let count = 0;
  while (i < source.length) {
    const idx = source.indexOf("<TextField", i);
    if (idx === -1) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, idx);
    // Find tag end (`>` or `/>`).
    let j = idx + "<TextField".length;
    let inStr = null;
    let braceDepth = 0;
    while (j < source.length) {
      const c = source[j];
      if (inStr) {
        if (c === "\\") j++;
        else if (c === inStr) inStr = null;
      } else if (braceDepth > 0) {
        if (c === '"' || c === "'" || c === "`") inStr = c;
        else if (c === "{") braceDepth++;
        else if (c === "}") braceDepth--;
      } else {
        if (c === '"' || c === "'" || c === "`") inStr = c;
        else if (c === "{") braceDepth++;
        else if (c === ">") break;
      }
      j++;
    }
    if (j >= source.length) {
      out += source.slice(idx);
      break;
    }
    let tag = source.slice(idx, j + 1);

    // Extract inputProps={{...}} and InputLabelProps={{...}}.
    const slotEntries = [];
    let rewrote = false;
    const propRe = /\b(inputProps|InputLabelProps)\s*=\s*\{/g;
    let m;
    const ranges = [];
    while ((m = propRe.exec(tag)) !== null) {
      const propName = m[1];
      const braceStart = m.index + m[0].length - 1; // index of `{`
      const after = balancedBraces(tag, braceStart); // index after `}`
      const inner = tag.slice(braceStart + 1, after - 1).trim();
      const slotKey = propName === "inputProps" ? "htmlInput" : "inputLabel";
      // Inner may itself be a `{...}` literal. Strip outer braces if so to inline.
      let slotValue = inner;
      if (slotValue.startsWith("{") && slotValue.endsWith("}")) {
        const inside = slotValue.slice(1, -1).trim();
        slotValue = inside ? `{ ${inside} }` : `{}`;
      }
      slotEntries.push(`${slotKey}: ${slotValue}`);
      ranges.push([m.index, after]);
      rewrote = true;
    }

    if (rewrote) {
      // Remove the deprecated props (in reverse order so indices stay valid).
      ranges.sort((a, b) => b[0] - a[0]);
      for (const [start, end] of ranges) {
        // Also strip a trailing space if present.
        let trimEnd = end;
        while (trimEnd < tag.length && tag[trimEnd] === " ") trimEnd++;
        tag = tag.slice(0, start) + tag.slice(trimEnd);
      }
      // Inject slotProps before the closing `>` or `/>`.
      const closeIdx = tag.lastIndexOf("/>") !== -1 ? tag.lastIndexOf("/>") : tag.lastIndexOf(">");
      // If slotProps already present, merge into it; otherwise add new.
      const existingSlotPropsMatch = /\bslotProps\s*=\s*\{/.exec(tag);
      if (existingSlotPropsMatch) {
        // Merge: slotProps={{ ...existing, htmlInput: ..., ... }}
        // Find the braces of existing slotProps.
        const brStart = existingSlotPropsMatch.index + existingSlotPropsMatch[0].length - 1;
        const brEnd = balancedBraces(tag, brStart);
        const existingInner = tag.slice(brStart + 1, brEnd - 1).trim();
        // Strip surrounding braces if literal.
        let merged = existingInner;
        if (merged.startsWith("{") && merged.endsWith("}")) {
          merged = merged.slice(1, -1).trim();
        }
        const combinedInner = [merged, ...slotEntries].filter(Boolean).join(", ");
        tag = tag.slice(0, brStart) + `{{ ${combinedInner} }}` + tag.slice(brEnd);
      } else {
        const insert = ` slotProps={{ ${slotEntries.join(", ")} }}`;
        tag = tag.slice(0, closeIdx) + insert + tag.slice(closeIdx);
      }
      count++;
    }

    out += tag;
    i = j + 1;
  }
  return { out, count };
}

const files = process.argv.slice(2);
let total = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const { out, count } = rewriteTextField(src);
  if (count > 0) {
    writeFileSync(f, out);
    console.log(`[migrate-tf] ${f}: ${count} transform(s)`);
    total += count;
  }
}
console.log(`[migrate-tf] total: ${total}`);
