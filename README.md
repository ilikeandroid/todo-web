# todo-web

A to-do web app. This repository currently contains the runnable project scaffold: Vite, React, and TypeScript, with ESLint, Vitest, and Playwright.

## Install

Use Node.js `^22.13.0 || ^24.0.0 || >=26.0.0` (22.13 or newer on the 22 line, 24, or 26 and newer). That is the range in `package.json` `engines`. Vite 8, Vitest 5, and ESLint 10 do not run on older Node.

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

## Data storage

Tasks are stored in the browser under the `localStorage` key `todo-web.tasks`. The value is a JSON array of tasks. Each task has `id` (non-empty string), `text` (string), `done` (boolean), and `createdAt` (ISO-8601 string). New ids come from `crypto.randomUUID()`, which the browser provides only in a secure context (HTTPS or localhost).

`loadTasks()` returns an empty array when that key is missing. It also returns an empty array when the stored value is invalid JSON, when any item is missing `id`, `text`, `done`, or `createdAt`, has the wrong type for one of those fields, or has an empty `id`, or when reading `localStorage` throws (for example, access is denied). Loading does not throw, and it leaves corrupt data in place. One invalid item still rejects the whole list.

`saveTasks()` replaces whatever is stored under that key. It can throw, for example `QuotaExceededError` when storage is full, or when storage access is denied. Callers should handle that.

## Coding rules

- TypeScript strict mode is enabled (`"strict": true` in `tsconfig.app.json` and `tsconfig.node.json`).
- ESLint uses the flat config in `eslint.config.js`: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` flat recommended, and `eslint-plugin-react-refresh` Vite config (`react-refresh/only-export-components`).
- Vitest is the unit test runner. Colocate component tests with the component (`App.test.tsx`).
- Playwright is the browser test runner. End-to-end tests live in `e2e/` and run in Chromium.
- Component files use PascalCase (`App.tsx`).
- Hooks are named `useX` (for example, `useTodos`).
- Every feature pull request adds tests.
