import { AddTaskForm } from './components/AddTaskForm.tsx'
import { TaskList } from './components/TaskList.tsx'
import { useTasks } from './hooks/useTasks.ts'

export default function App() {
  const { tasks, saveError, add, toggle, remove } = useTasks()

  return (
    <main>
      <h1>To-do</h1>
      <AddTaskForm onAdd={add} />
      {saveError !== null ? <p role="alert">{saveError}</p> : null}
      <TaskList tasks={tasks} onToggle={toggle} onDelete={remove} />
    </main>
  )
}
