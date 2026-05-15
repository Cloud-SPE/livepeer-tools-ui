# FRONTEND.md

Conventions for the React/MUI surface.

## Stack

- **React 18** function components, hooks only.
- **Vite 6** + `@vitejs/plugin-react`.
- **TypeScript** strict mode.
- **MUI 6** for layout, typography, controls. `@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`.
- **`@emotion/react` + `@emotion/styled`** for styling primitives (MUI peer deps).
- **`react-router-dom` v7** with the data-router API (`createBrowserRouter` + loaders).
- **`@tanstack/react-query`** for server state.
- **`zod`** for boundary validation on non-OpenAPI providers.

## App shell

`src/app/App.tsx` owns the global chrome: AppBar, Drawer, Outlet. It is intentionally close to the old `livepeer-tools-ui/packages/tools-ui/src/App.jsx` so users see no visual regression. The drawer menu items are sourced from a static array; each entry corresponds to a top-level route registered in `src/app/routes.tsx`.

The theme lives at `src/app/theme.ts`. Theme tokens are MUI defaults plus an additional `2xl: 2560` breakpoint and the outlined-button color overrides from the old shell.

## Routing

Routes are registered exclusively in `src/app/routes.tsx` via `createBrowserRouter(createRoutesFromElements(...))`. Each domain exports:

- A `route(s)` constant from its `ui/index.ts` — JSX `<Route>` element(s) used by the app router.
- A `loader` function from its `runtime.ts` — react-router data loader.
- One or more route components from `ui/`.

The app composes them. The app shell never imports a domain's `repo` or `service` directly.

## Data fetching

Each domain owns its data hooks in `runtime.ts`. The contract:

- Hooks are named `use<Thing>`, `use<Thing>List`, etc.
- Each hook wraps a `useQuery` (or `useMutation`) call whose `queryKey` is `[domain, action, ...args]`.
- The `queryFn` calls the domain's `repo.ts`. Hooks never call providers directly.
- Loaders prefetch with `queryClient.prefetchQuery` and return `null`. The hook reads from the cache for the initial render. This gives the route-loader UX without forcing the hook to be conditional.

## Styling

- Prefer MUI `sx={}` for one-off layout.
- Prefer `styled` from `@emotion/styled` for reusable presentational components.
- No CSS modules, no Tailwind. (The old codebase did not use them; we don't reintroduce them.)

## Charts and tables

- **Tables**: `@mui/x-data-grid`. Stay on v7 to match the old UI's behavior; do not adopt v8 features without an exec plan.
- **Charts**: `chart.js` + `react-chartjs-2` + `chartjs-plugin-autocolors` + `chartjs-plugin-datalabels`. Added per domain as needed; not in Phase 0.

## Dates

`moment` for date math and formatting, for parity with the old UI. We do not migrate to `date-fns` or `luxon` without a tracked exec plan.

## Iconography

`@mui/icons-material` only. No SVG drops, no Iconify.

## Accessibility

MUI defaults. Drawer is keyboard-navigable; tables ship with built-in a11y. No custom focus management at this stage.
