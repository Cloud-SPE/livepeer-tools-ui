# 015 — Full dependency migration to latest

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Outcome

All dependencies bumped to the latest stable compatible with the React ecosystem.

| Package                                 | Before | After |
| --------------------------------------- | ------ | ----- |
| react / react-dom                       | 18.3   | 19.2  |
| @types/react / @types/react-dom         | 18.3   | 19.2  |
| react-konva                             | 18.2   | 19.2  |
| @mui/material / icons-material / system | 6.3    | 9.0   |
| @mui/x-data-grid                        | 7.23   | 8.28  |
| react-markdown                          | 9.0    | 10.1  |
| konva                                   | 9.3    | 10.3  |
| vite                                    | 6.0    | 8.0   |
| @vitejs/plugin-react                    | 4.3    | 6.0   |
| vitest                                  | 2.1    | 4.1   |
| typescript                              | 5.7    | 6.0   |
| zod                                     | 3.23   | 4.4   |
| openapi-fetch                           | 0.13   | 0.17  |
| lefthook                                | 1.8    | 2.1   |
| @types/node                             | 22.10  | 25.8  |
| globals                                 | 15.13  | 17.6  |
| eslint-plugin-react-hooks               | 5.0    | 7.1   |

**Held back: `eslint` (9.39, latest is 10.3).** Blocked by `eslint-plugin-react@7.37.5` which caps its peer at ESLint 9. Will lift when the plugin publishes ESLint-10-compatible support.

## Migration notes worth keeping

- React 19 dropped the global `JSX` namespace. 44 component files needed `import type { JSX } from "react"`. Bulk-patched with a one-line `sed` insertion.
- TypeScript 6 deprecated `baseUrl`. Removed it from `tsconfig.json` — `paths` works fine without it in modern TS.
- Vite 8 ships Rolldown as the bundler. Stricter peer-dep resolution required adding `@mui/system` to `dependencies` explicitly (previously transitive).
- Zod 4 was a non-event for this codebase. Our usage was already compatible with the v4 API.
- MUI v7+ removed system props from `Box` / `Typography` / `Stack` / `Grid` (mt, mb, p, display, textAlign, alignItems, etc.) — they must go inside `sx={}`. 52 instances migrated by `scripts/migrate-mui-sx.mjs`, plus 4 more in a follow-up pass after extending the component list.
- MUI v7+ deprecated TextField's `inputProps` and `InputLabelProps` in favor of `slotProps={{ htmlInput: {...}, inputLabel: {...} }}`. 11 instances migrated by `scripts/migrate-mui-textfield.mjs`.
- MUI Grid v2 dropped the `item` prop; `xs/sm/md/lg/xl` collapse into one `size` prop. 27 files migrated by `@mui/codemod v7.0.0/grid-props`.
- `@mui/icons-material/PersonOutline` was renamed to `PersonOutlined`. One file affected.
- Test runner output looks slightly different under Vitest 4 (cleaner per-file lines) but the test API itself is unchanged.

## Verification

- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run test` ✓ — **11 files, 215 tests passing** (same as before)
- `npm run build` ✓ — bundle 2.07 MB / 617 KB gzipped (was 1.2 MB / 370 KB; React 19 + MUI 9 plus the newly-added `@mui/system` add to the surface)
- Dev probe of all 35 routes — all 200.

## Migration scripts kept

- `scripts/migrate-mui-sx.mjs` — regex-based Box/Typography/Grid/Stack system-props → sx
- `scripts/migrate-mui-textfield.mjs` — TextField inputProps/InputLabelProps → slotProps

Kept in-tree for future MUI bumps. Scripts directory is ignored by ESLint (added in this plan).

## Intent

Bump every dependency to the latest stable major. Five stages, each verified before moving on so any regression is localized.

## Stages

1. **Low-risk** — @types/node 25, globals 17, react-markdown 10, konva 10, openapi-fetch 0.17, lefthook 2, eslint 10, eslint-plugin-react-hooks 7.
2. **Build tooling** — vite 8, @vitejs/plugin-react 6, vitest 4, typescript 6.
3. **Zod 4** — likely API/type changes around `.url()`, `.default()`, error message shapes.
4. **React 19** — react/react-dom 19, @types/react 19, @types/react-dom 19, react-konva 19. Replace `JSX.Element` global with `React.JSX.Element`.
5. **MUI 9 + DataGrid 8** — Grid migration (Grid v2 `size` prop, no `item`), DataGrid column API changes.

## Acceptance criteria

- [ ] `npm outdated` shows zero "Latest" disparities.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes (currently 215 tests / 11 files).
- [ ] `npm run build` succeeds.
- [ ] `npm run dev` serves; all 35 routes return 200.

## Strategy notes

- Bump in stages; after each stage run **all five gates** to catch regressions early.
- For each major migration, prefer mechanical replacement over rewriting.
- Keep one rollback option open: if a stage proves intractable, revert to the previous stage's lock and surface the issue.
- React 19 has `useTransition` and `useActionState` improvements but no required migration beyond JSX namespace.
- MUI v7 deprecated Grid in favor of Grid v2 (formerly Unstable_Grid2); v8 finished the migration. The `item` prop is gone; `xs/sm/md` etc. consolidate into `size`.
- Zod v4 removes the deprecated `z.string().url()` in favor of `z.url()`. Default values' shape is the same; error message types differ.

## Test plan

- Each stage: typecheck, lint, test, build.
- Final stage: dev probe of every route in addition.
