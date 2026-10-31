import { expect, test } from '@playwright/test'

test('added tasks are still listed after a reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.getByText('No tasks yet')).toBeVisible()

  const task = page.getByRole('textbox', { name: 'Task' })
  await task.fill('Buy milk')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(task).toHaveValue('')
  await expect(task).toBeFocused()

  await task.fill('Walk dog')
  await task.press('Enter')

  const items = page.getByRole('listitem')
  await expect(items).toHaveText(['Buy milk', 'Walk dog'])

  await page.reload()

  await expect(items).toHaveText(['Buy milk', 'Walk dog'])
})
