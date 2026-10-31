# todo-web

A to-do web app. Add tasks in the browser and they stay on this device after a reload. The project is Vite, React, and TypeScript, with ESLint, Vitest, and Playwright.

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

## Using the app

Type a task in the Task field and press Add, or press Enter. The task is added to the bottom of the list, the field clears, and focus stays in the field. Leave the field empty, or type only spaces, and nothing is added; the form shows "Enter a task". That hint goes away when you type again or add a task. When the list is empty, the page shows "No tasks yet".

Tasks are saved in this browser (see [Data storage](#data-storage)). Reload the page and the same list is still there. If the browser cannot save, the page shows "Couldn't save, changes may be lost" and keeps running.

## Test

Unit tests (Vitest):

```bash
npm test
```

Browser tests (Playwright, Chromium):

```bash
npm run test:e2e
```

The smoke test starts the dev server, loads the page, and checks for the "To-do" heading. `e2e/add-tasks.spec.ts` adds two tasks, reloads, and checks that both are still listed.

## Lint

```bash
npm run lint
```

## Data storage

Tasks are stored in the browser under the `localStorage` key `todo-web.tasks`. The value is a JSON array of tasks. Each task has `id` (non-empty string), `text` (string), `done` (boolean), and `createdAt` (ISO-8601 string). New ids come from `crypto.randomUUID()`, which the browser provides only in a secure context (HTTPS or localhost).

`loadTasks()` never throws. If the key is missing, it returns an empty array and does not write a backup. If the stored value is a JSON array, it keeps every valid task and skips malformed items (a missing field, a wrong type, or an empty `id`). That stored array is left as it is, and no backup is written for skipped items. If the stored value is not valid JSON or not an array, `loadTasks()` copies that raw string to the `localStorage` key `todo-web.tasks.backup` when the backup key is not already set, then returns an empty array. An existing backup, including an empty string, is not overwritten. If reading storage or writing the backup throws, `loadTasks()` still returns an empty array.

`saveTasks()` replaces whatever is stored under `todo-web.tasks`. It can throw, for example `QuotaExceededError` when storage is full, or when storage access is denied. Callers should handle that.

## Coding rules

- TypeScript strict mode is enabled (`"strict": true` in `tsconfig.app.json` and `tsconfig.node.json`).
- ESLint uses the flat config in `eslint.config.js`: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` flat recommended, and `eslint-plugin-react-refresh` Vite config (`react-refresh/only-export-components`).
- Vitest is the unit test runner. Colocate component tests with the component (`App.test.tsx`).
- Playwright is the browser test runner. End-to-end tests live in `e2e/` and run in Chromium.
- Component files use PascalCase (`App.tsx`).
- Hooks are named `useX` (for example, `useTodos`).
- Every feature pull request adds tests.
