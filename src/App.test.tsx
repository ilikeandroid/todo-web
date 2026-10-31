import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { TASKS_STORAGE_KEY, loadTasks, saveTasks } from './tasks/storage.ts'
import * as storage from './tasks/storage.ts'
import { addTask } from './tasks/tasks.ts'

const createdAt = new Date('2026-01-01T00:00:00.000Z')

function taskInput(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Task' })
}

function typeAndAdd(value: string, method: 'click' | 'enter' = 'click') {
  const input = taskInput()
  fireEvent.change(input, { target: { value } })
  if (method === 'enter') {
    // jsdom does not implicit-submit on Enter. Browsers do, unless keydown was cancelled.
    const proceed = fireEvent.keyDown(input, { key: 'Enter' })
    if (proceed) {
      const form = input.closest('form')
      if (!form) {
        throw new Error('input is not in a form')
      }
      fireEvent.submit(form)
    }
  } else {
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  }
  return input
}

function startEditing(name: string) {
  fireEvent.click(screen.getByRole('button', { name: `Edit ${name}` }))
  const input = screen.getByRole('textbox', { name: `Edit ${name}` })
  expect(input).toHaveValue(name)
  expect(input).toHaveFocus()
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

    expect(screen.getAllByRole('listitem').map((item) => item.querySelector('span')?.textContent)).toEqual([
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

  it('toggles a task done and not done, with strikethrough, and saves both', () => {
    const { unmount } = render(<App />)
    typeAndAdd('Buy milk')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))

    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).toBeChecked()
    expect(screen.getByText('Buy milk', { selector: 'span' })).toHaveStyle({
      textDecoration: 'line-through',
    })
    expect(loadTasks()[0]?.done).toBe(true)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))

    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked()
    expect(screen.getByText('Buy milk', { selector: 'span' })).not.toHaveStyle({
      textDecoration: 'line-through',
    })
    expect(loadTasks()[0]?.done).toBe(false)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))
    unmount()
    render(<App />)

    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).toBeChecked()
    expect(screen.getByText('Buy milk', { selector: 'span' })).toHaveStyle({
      textDecoration: 'line-through',
    })
  })

  it('deletes a task without confirming and saves the remaining list', () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { unmount } = render(<App />)
    typeAndAdd('Buy milk')
    typeAndAdd('Walk dog')

    fireEvent.click(screen.getByRole('button', { name: 'Delete Buy milk' }))

    expect(confirm).not.toHaveBeenCalled()
    expect(screen.queryByRole('checkbox', { name: 'Buy milk' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Walk dog' })).toBeInTheDocument()
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
    expect(loadTasks().map((task) => task.text)).toEqual(['Walk dog'])

    unmount()
    render(<App />)
    expect(screen.queryByRole('checkbox', { name: 'Buy milk' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Walk dog' })).toBeInTheDocument()
  })

  it('shows the save error when toggling fails to save', () => {
    saveTasks(addTask([], 'Buy milk', { id: 'task-1', now: createdAt }))
    render(<App />)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })

    fireEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent("Couldn't save, changes may be lost")
    expect(alert).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).toBeChecked()
    expect(screen.getByText('Buy milk', { selector: 'span' })).toHaveStyle({
      textDecoration: 'line-through',
    })
    expect(loadTasks()[0]?.done).toBe(false)
  })

  it('shows the save error when deleting fails to save', () => {
    saveTasks([
      ...addTask([], 'Buy milk', { id: 'task-1', now: createdAt }),
      ...addTask([], 'Walk dog', { id: 'task-2', now: createdAt }),
    ])
    render(<App />)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Buy milk' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent("Couldn't save, changes may be lost")
    expect(alert).toBeVisible()
    expect(screen.queryByRole('checkbox', { name: 'Buy milk' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Walk dog' })).toBeInTheDocument()
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk', 'Walk dog'])
  })

  it('starts editing from the Edit button or a double-click, without toggling done', () => {
    render(<App />)
    typeAndAdd('Buy milk')

    const fromButton = startEditing('Buy milk')
    expect(fromButton).toHaveAttribute('aria-label', 'Edit Buy milk')
    fireEvent.keyDown(fromButton, { key: 'Escape' })
    if (fromButton.isConnected) {
      fireEvent.blur(fromButton)
    }

    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked()
    fireEvent.doubleClick(screen.getByText('Buy milk', { selector: 'span' }))
    const fromDoubleClick = screen.getByRole('textbox', { name: 'Edit Buy milk' })
    expect(fromDoubleClick).toHaveValue('Buy milk')
    expect(fromDoubleClick).toHaveFocus()
    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked()
  })

  it('saves a trimmed edit on Enter once, and a following blur does not save again', () => {
    render(<App />)
    typeAndAdd('Buy milk')
    typeAndAdd('Walk dog')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))

    const input = startEditing('Buy milk')
    fireEvent.change(input, { target: { value: '  Buy oat milk  ' } })
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')
    const blur = vi.spyOn(input, 'blur').mockImplementation(() => {})

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(blur).toHaveBeenCalledTimes(1)
    blur.mockRestore()
    expect(saveTasksSpy).toHaveBeenCalledTimes(1)
    fireEvent.blur(input)

    expect(saveTasksSpy).toHaveBeenCalledTimes(1)
    expect(saveTasksSpy.mock.calls[0]?.[0]?.map((task) => ({ text: task.text, done: task.done }))).toEqual([
      { text: 'Buy oat milk', done: true },
      { text: 'Walk dog', done: false },
    ])
    expect(screen.getByRole('checkbox', { name: 'Buy oat milk' })).toBeChecked()
    expect(screen.getByText('Buy oat milk', { selector: 'span' })).toHaveStyle({
      textDecoration: 'line-through',
    })
    expect(screen.getAllByRole('checkbox').map((box) => box.getAttribute('aria-label'))).toEqual([
      'Buy oat milk',
      'Walk dog',
    ])
    expect(screen.getByRole('button', { name: 'Edit Buy oat milk' })).toHaveFocus()
    expect(document.activeElement).not.toBe(document.body)
    expect(loadTasks().map((task) => ({ text: task.text, done: task.done }))).toEqual([
      { text: 'Buy oat milk', done: true },
      { text: 'Walk dog', done: false },
    ])
  })

  it('saves a trimmed edit when the field blurs', () => {
    const { unmount } = render(<App />)
    typeAndAdd('Buy milk')
    const input = startEditing('Buy milk')
    fireEvent.change(input, { target: { value: '  Buy oat milk  ' } })
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    fireEvent.blur(input)

    expect(saveTasksSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Buy oat milk', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Buy oat milk' })).toHaveFocus()
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy oat milk'])

    unmount()
    render(<App />)
    expect(screen.getByRole('checkbox', { name: 'Buy oat milk' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Buy milk' })).not.toBeInTheDocument()
  })

  it('does not save when blur follows Escape', () => {
    render(<App />)
    typeAndAdd('Buy milk')
    const input = startEditing('Buy milk')
    fireEvent.change(input, { target: { value: 'Changed' } })
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')
    const blur = vi.spyOn(input, 'blur').mockImplementation(() => {})

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(blur).toHaveBeenCalledTimes(1)
    blur.mockRestore()
    expect(input).toHaveValue('Changed')
    expect(input).toBeInTheDocument()
    fireEvent.blur(input)

    expect(saveTasksSpy).not.toHaveBeenCalled()
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk'])
    expect(screen.queryByDisplayValue('Changed')).not.toBeInTheDocument()
    expect(screen.getByText('Buy milk', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Buy milk' })).toHaveFocus()
    expect(document.activeElement).not.toBe(document.body)
  })

  it('rejects an empty edit on Enter and keeps the field open', () => {
    render(<App />)
    typeAndAdd('Buy milk')
    const input = startEditing('Buy milk')
    fireEvent.change(input, { target: { value: '   ' } })
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(saveTasksSpy).not.toHaveBeenCalled()
    expect(screen.getByText('Enter a task')).toBeInTheDocument()
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('   ')
    expect(input).toHaveAccessibleDescription('Enter a task')
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk'])
    expect(screen.queryByRole('button', { name: 'Edit Buy milk' })).not.toBeInTheDocument()
  })

  it('cancels an empty edit on blur and restores the original text', () => {
    render(<App />)
    typeAndAdd('Buy milk')
    const input = startEditing('Buy milk')
    fireEvent.change(input, { target: { value: ' \n\t ' } })
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    fireEvent.blur(input)

    expect(saveTasksSpy).not.toHaveBeenCalled()
    expect(screen.queryByText('Enter a task')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Edit Buy milk' })).not.toBeInTheDocument()
    expect(screen.getByText('Buy milk', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Buy milk' })).toHaveFocus()
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk'])
  })

  it('does not save when the trimmed edit is unchanged', () => {
    render(<App />)
    typeAndAdd('Buy milk')
    const input = startEditing('Buy milk')
    fireEvent.change(input, { target: { value: '  Buy milk  ' } })
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    fireEvent.keyDown(input, { key: 'Enter' })
    if (input.isConnected) {
      fireEvent.blur(input)
    }

    expect(saveTasksSpy).not.toHaveBeenCalled()
    expect(screen.getByText('Buy milk', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Buy milk' })).toHaveFocus()
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk'])
  })

  it('shows the save error when an edit fails to save', () => {
    saveTasks(addTask([], 'Buy milk', { id: 'task-1', now: createdAt }))
    render(<App />)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })
    const input = startEditing('Buy milk')
    fireEvent.change(input, { target: { value: 'Buy oat milk' } })

    fireEvent.keyDown(input, { key: 'Enter' })
    if (input.isConnected) {
      fireEvent.blur(input)
    }

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent("Couldn't save, changes may be lost")
    expect(alert).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Buy oat milk' })).toBeInTheDocument()
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk'])
  })

  it('edits only one task at a time', () => {
    render(<App />)
    typeAndAdd('Buy milk')
    typeAndAdd('Walk dog')

    startEditing('Buy milk')
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit Buy milk' }), {
      target: { value: 'Buy oat milk' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Edit Walk dog' }))

    expect(screen.queryByRole('textbox', { name: 'Edit Buy milk' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Edit Walk dog' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox', { name: /^Edit / })).toHaveLength(1)
  })

  it('moves focus to the next task Delete button after a delete', () => {
    render(<App />)
    typeAndAdd('Buy milk')
    typeAndAdd('Walk dog')
    typeAndAdd('Write tests')

    fireEvent.click(screen.getByRole('button', { name: 'Delete Walk dog' }))

    expect(screen.getByRole('button', { name: 'Delete Write tests' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Delete Buy milk' })).not.toHaveFocus()
    expect(document.activeElement).not.toBe(document.body)
    expect(screen.queryByRole('checkbox', { name: 'Walk dog' })).not.toBeInTheDocument()
  })

  it('moves focus to the previous task Delete button when the last task is deleted', () => {
    render(<App />)
    typeAndAdd('Buy milk')
    typeAndAdd('Walk dog')
    typeAndAdd('Write tests')

    fireEvent.click(screen.getByRole('button', { name: 'Delete Write tests' }))

    expect(screen.getByRole('button', { name: 'Delete Walk dog' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Delete Buy milk' })).not.toHaveFocus()
    expect(document.activeElement).not.toBe(document.body)
  })

  it('moves focus to the add-task input when a delete leaves the list empty', () => {
    render(<App />)
    typeAndAdd('Buy milk')

    fireEvent.click(screen.getByRole('button', { name: 'Delete Buy milk' }))

    expect(screen.getByRole('textbox', { name: 'Task' })).toHaveFocus()
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(document.activeElement).not.toBe(document.body)
  })
})
