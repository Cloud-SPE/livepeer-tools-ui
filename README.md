# livepeer-tools-ui

[![CI](https://github.com/Cloud-SPE/livepeer-tools-ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Cloud-SPE/livepeer-tools-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MUI](https://img.shields.io/badge/MUI-9-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/code_style-prettier-F7B93E?logo=prettier&logoColor=black)](https://prettier.io/)

A web UI for the Livepeer protocol and ecosystem. A thin presentation layer over three independent data providers — the Protocol Explorer API, the external Performance/Leaderboard service, and live Livepeer Gateways for AI inference. Its purpose is to make Livepeer protocol economics legible to humans.

This codebase is agent-generated: every line — application logic, tests, CI, docs — should be writable and reviewable by a coding agent.

## Getting started

```bash
npm ci
cp .env.example .env   # adjust if needed
npm run dev
```

## Scripts

| Command                     | What it does                                        |
| --------------------------- | --------------------------------------------------- |
| `npm run dev`               | Vite dev server                                     |
| `npm run build`             | Type-check then build                               |
| `npm run preview`           | Preview the production build                        |
| `npm run typecheck`         | `tsc -b --noEmit`                                   |
| `npm run lint`              | ESLint (enforces layering rules)                    |
| `npm run fmt` / `fmt:check` | Prettier                                            |
| `npm run test`              | Vitest (unit + structural)                          |
| `npm run gen:api`           | Regenerate `src/generated/api-types.ts`             |
| `npm run check:api-drift`   | Fail if generated types drift from the live OpenAPI |

## Documentation

`AGENTS.md` is the table of contents. The system of record lives under `docs/` — start with `docs/DESIGN.md` and `docs/FRONTEND.md`.

## License

[MIT](./LICENSE)
