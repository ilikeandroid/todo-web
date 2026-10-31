import type { Task } from '../tasks/types.ts'
import { TaskItem } from './TaskItem.tsx'

type TaskListProps = {
  /** List order is display order. `addTask` appends, so the newest task is last. */
  tasks: readonly Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p>No tasks yet</p>
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  )
}
