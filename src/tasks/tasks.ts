import type { Task } from './types.ts'

/**
 * Task list operations.
 *
 * Each function returns a new array and does not mutate `tasks` or its items.
 * Rejected input returns the same array reference: empty or whitespace-only
 * text for `addTask` and `editTask`, and an id that is not in the list for
 * `toggleTask`, `deleteTask`, and `editTask`.
 */

/** Overrides for id and clock. Used by tests; production callers can omit this. */
export type AddTaskOptions = {
  id?: string
  now?: Date
}

/**
 * Appends a not-done task.
 * Trims `text`. Empty or whitespace-only text returns `tasks` unchanged.
 * `id` defaults to `crypto.randomUUID()` and `createdAt` to `now` as an ISO string.
 */
export function addTask(tasks: Task[], text: string, options?: AddTaskOptions): Task[] {
  const trimmed = text.trim()
  if (trimmed === '') {
    return tasks
  }

  const task: Task = {
    id: options?.id ?? crypto.randomUUID(),
    text: trimmed,
    done: false,
    createdAt: (options?.now ?? new Date()).toISOString(),
  }

  return [...tasks, task]
}

/**
 * Flips `done` for every task with `id`.
 * An unknown id returns `tasks` unchanged.
 */
export function toggleTask(tasks: Task[], id: string): Task[] {
  if (!tasks.some((task) => task.id === id)) {
    return tasks
  }

  return tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
}

/**
 * Removes every task with `id`.
 * An unknown id returns `tasks` unchanged.
 */
export function deleteTask(tasks: Task[], id: string): Task[] {
  if (!tasks.some((task) => task.id === id)) {
    return tasks
  }

  return tasks.filter((task) => task.id !== id)
}

/**
 * Replaces `text` for every task with `id`.
 * Trims `text`. Empty or whitespace-only text, or an unknown id, returns `tasks` unchanged.
 */
export function editTask(tasks: Task[], id: string, text: string): Task[] {
  const trimmed = text.trim()
  if (trimmed === '') {
    return tasks
  }

  if (!tasks.some((task) => task.id === id)) {
    return tasks
  }

  return tasks.map((task) => (task.id === id ? { ...task, text: trimmed } : task))
}
