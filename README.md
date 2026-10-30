# todo-web

A to-do web app. This repository currently contains the runnable project scaffold: Vite, React, and TypeScript, with ESLint, Vitest, and Playwright.

## Install

```bash
npm install
npx playwright install chromium
```

`npm install` installs the application and the Playwright test runner. End-to-end tests also need the Chromium browser binary, which the second command downloads.

## Run

Start the dev server:

```bash
npm run dev
```

Open http://127.0.0.1:5173. The page shows the heading "To-do".

Create a production build and preview it:

```bash
npm run build
npm run preview
```

## Test

Unit tests (Vitest):

```bash
npm test
```

Browser tests (Playwright, Chromium):

```bash
npm run test:e2e
```

The smoke test starts the dev server, loads the page, and checks for the "To-do" heading.

## Lint

```bash
npm run lint
```

## Coding rules

- TypeScript strict mode is enabled (`"strict": true` in `tsconfig.app.json` and `tsconfig.node.json`).
- ESLint uses the flat config in `eslint.config.js`: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` flat recommended, and `eslint-plugin-react-refresh` Vite config (`react-refresh/only-export-components`).
- Vitest is the unit test runner. Colocate component tests with the component (`App.test.tsx`).
- Playwright is the browser test runner. End-to-end tests live in `e2e/` and run in Chromium.
- Component files use PascalCase (`App.tsx`).
- Hooks are named `useX` (for example, `useTodos`).
- Every feature pull request adds tests.
