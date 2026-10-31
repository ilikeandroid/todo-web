/**
 * A single to-do item.
 * `id` is unique within a task list. `createdAt` is an ISO-8601 timestamp.
 */
export type Task = {
  id: string
  text: string
  done: boolean
  createdAt: string
}
