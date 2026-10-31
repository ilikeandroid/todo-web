import type { Task } from '../tasks/types.ts'

type TaskListProps = {
  /** List order is display order. `addTask` appends, so the newest task is last. */
  tasks: readonly Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return <p>No tasks yet</p>
  }

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.text}</li>
      ))}
    </ul>
  )
}
