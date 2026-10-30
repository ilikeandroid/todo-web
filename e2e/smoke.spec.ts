import { expect, test } from '@playwright/test'

test('home page shows the To-do heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'To-do' })).toBeVisible()
})
