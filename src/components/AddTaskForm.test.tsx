import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AddTaskForm } from './AddTaskForm.tsx'

function setup(onAdd: (text: string) => boolean) {
  render(<AddTaskForm onAdd={onAdd} />)
  return screen.getByRole('textbox', { name: 'Task' })
}

/** jsdom does not implicit-submit on Enter. Browsers do, unless the keydown was cancelled. */
function pressEnter(input: HTMLElement, init?: KeyboardEventInit) {
  const proceed = fireEvent.keyDown(input, { key: 'Enter', ...init })
  if (proceed) {
    const form = input.closest('form')
    if (!form) {
      throw new Error('input is not in a form')
    }
    fireEvent.submit(form)
  }
  return proceed
}

describe('AddTaskForm', () => {
  it('adds the raw input text from the Add button', () => {
    const onAdd = vi.fn<(text: string) => boolean>(() => true)
    const input = setup(onAdd)

    fireEvent.change(input, { target: { value: '  Buy milk  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('  Buy milk  ')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.queryByText('Enter a task')).not.toBeInTheDocument()
  })

  it('shows a hint and keeps the text when the task is rejected', () => {
    const onAdd = vi.fn<(text: string) => boolean>(() => false)
    const input = setup(onAdd)

    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('   ')
    expect(screen.getByText('Enter a task')).toBeInTheDocument()
    expect(input).toHaveValue('   ')
    expect(input).toHaveAccessibleDescription('Enter a task')
  })

  it('clears the hint when the user types', () => {
    const onAdd = vi.fn<(text: string) => boolean>(() => false)
    const input = setup(onAdd)

    fireEvent.change(input, { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Enter a task')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'B' } })
    expect(screen.queryByText('Enter a task')).not.toBeInTheDocument()
  })

  it('adds once when Enter is pressed in the input', () => {
    const onAdd = vi.fn<(text: string) => boolean>(() => true)
    const input = setup(onAdd)

    fireEvent.change(input, { target: { value: 'Walk dog' } })
    expect(pressEnter(input)).toBe(true)

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('Walk dog')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('does not add a task or show the hint when Enter is a key repeat or IME composition', () => {
    const onAdd = vi.fn<(text: string) => boolean>(() => false)
    const input = setup(onAdd)

    fireEvent.change(input, { target: { value: 'Walk dog' } })
    expect(pressEnter(input, { repeat: true })).toBe(false)
    expect(pressEnter(input, { isComposing: true })).toBe(false)

    expect(onAdd).not.toHaveBeenCalled()
    expect(input).toHaveValue('Walk dog')
    expect(screen.queryByText('Enter a task')).not.toBeInTheDocument()
  })

  it('does not show the hint when Enter repeats on an empty field', () => {
    const onAdd = vi.fn<(text: string) => boolean>(() => false)
    const input = setup(onAdd)

    expect(pressEnter(input, { repeat: true })).toBe(false)

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.queryByText('Enter a task')).not.toBeInTheDocument()
  })

  it('associates the label and hint through generated ids', () => {
    const onAdd = vi.fn<(text: string) => boolean>(() => false)
    const input = setup(onAdd)
    const label = screen.getByText('Task')

    expect(label).toHaveAttribute('for', input.id)
    expect(input.id).not.toBe('')
    expect(input.id).not.toBe('task-text')

    fireEvent.change(input, { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const hint = screen.getByText('Enter a task')
    expect(hint.id).not.toBe('')
    expect(hint.id).not.toBe('task-hint')
    expect(hint.id).not.toBe(input.id)
    expect(input).toHaveAttribute('aria-describedby', hint.id)
    expect(input).toHaveAccessibleDescription('Enter a task')
  })
})
