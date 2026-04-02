import { test, expect } from '@playwright/test'

test('TEST 1: Dashboard loads without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  expect(errors).toHaveLength(0)
  await expect(page.getByText('FinanceOS')).toBeVisible()
})

test('TEST 2: Navbar has correct links', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'New Snapshot' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible()
})

test('TEST 3: Empty state or snapshot dropdown shows on dashboard', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const hasEmptyState = await page.getByText('No snapshots yet').isVisible().catch(() => false)
  const hasDropdown = await page.locator('select').isVisible().catch(() => false)

  expect(hasEmptyState || hasDropdown).toBeTruthy()
})

test('TEST 4: Profile page loads', async ({ page }) => {
  await page.goto('/profile')
  await page.waitForLoadState('networkidle')

  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  await expect(page.locator('input[type="text"]').first()).toBeVisible()
  await expect(page.locator('input[type="number"]').first()).toBeVisible()
})

test('TEST 5: Python health check', async ({ request }) => {
  const response = await request.get('http://localhost:8001/health')
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body).toEqual({ status: 'ok' })
})
