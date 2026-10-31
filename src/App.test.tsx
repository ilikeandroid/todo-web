import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { TASKS_STORAGE_KEY, loadTasks, saveTasks } from './tasks/storage.ts'
import { addTask } from './tasks/tasks.ts'

const createdAt = new Date('2026-01-01T00:00:00.000Z')

function taskInput(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Task' })
}

function typeAndAdd(value: string, method: 'click' | 'enter' = 'click') {
  const input = taskInput()
  fireEvent.change(input, { target: { value } })
  if (method === 'enter') {
    fireEvent.keyDown(input, { key: 'Enter' })
  } else {
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  }
  return input
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('App', () => {
  it('renders the To-do heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'To-do' })).toBeInTheDocument()
  })

  it('shows an empty list message on start', () => {
    render(<App />)

    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Task' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('loads saved tasks on start', () => {
    saveTasks(addTask([], 'Buy milk', { id: 'task-1', now: createdAt }))

    render(<App />)

    expect(screen.getByRole('listitem')).toHaveTextContent('Buy milk')
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
  })

  it('adds a trimmed task, clears the input, and keeps focus', () => {
    render(<App />)

    const input = typeAndAdd('  Buy milk  ')

    expect(screen.getByRole('listitem')).toHaveTextContent('Buy milk')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.queryByText('Enter a task')).not.toBeInTheDocument()
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk'])
  })

  it('lists tasks with the newest at the bottom and saves each change', () => {
    render(<App />)

    typeAndAdd('Buy milk')
    typeAndAdd('Walk dog')

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Buy milk',
      'Walk dog',
    ])
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk', 'Walk dog'])
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).not.toBeNull()
  })

  it('rejects empty or whitespace-only input and shows a hint', () => {
    render(<App />)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    typeAndAdd('   ')

    expect(screen.getByText('Enter a task')).toBeInTheDocument()
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(setItem).not.toHaveBeenCalled()

    typeAndAdd('')
    expect(screen.getByText('Enter a task')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('clears the hint once the user types or adds a task', () => {
    render(<App />)

    typeAndAdd(' ')
    expect(screen.getByText('Enter a task')).toBeInTheDocument()

    fireEvent.change(taskInput(), { target: { value: 'Buy milk' } })
    expect(screen.queryByText('Enter a task')).not.toBeInTheDocument()

    typeAndAdd(' ')
    expect(screen.getByText('Enter a task')).toBeInTheDocument()

    typeAndAdd('Walk dog')
    expect(screen.queryByText('Enter a task')).not.toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Walk dog')
  })

  it('adds a task when Enter is pressed in the input', () => {
    render(<App />)

    const input = typeAndAdd('Walk dog', 'enter')

    expect(screen.getByRole('listitem')).toHaveTextContent('Walk dog')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(loadTasks().map((task) => task.text)).toEqual(['Walk dog'])
  })

  it('shows a visible save error and does not crash when saveTasks throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })
    render(<App />)

    typeAndAdd('Buy milk')

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent("Couldn't save, changes may be lost")
    expect(alert).toBeVisible()
    expect(screen.getByRole('listitem')).toHaveTextContent('Buy milk')
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
  })
})
