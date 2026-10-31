import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AddTaskForm } from './AddTaskForm.tsx'

function setup(onAdd: (text: string) => boolean) {
  render(<AddTaskForm onAdd={onAdd} />)
  return screen.getByRole('textbox', { name: 'Task' })
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
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('Walk dog')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('does not add a task when Enter is a key repeat or IME composition', () => {
    const onAdd = vi.fn<(text: string) => boolean>(() => true)
    const input = setup(onAdd)

    fireEvent.change(input, { target: { value: 'Walk dog' } })
    fireEvent.keyDown(input, { key: 'Enter', repeat: true })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })

    expect(onAdd).not.toHaveBeenCalled()
    expect(input).toHaveValue('Walk dog')
  })
})
