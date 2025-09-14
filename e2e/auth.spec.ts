import { test, expect } from '@playwright/test'

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login page from home', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible()
  })

  test('should display login form with Arabic text', async ({ page }) => {
    await page.goto('/login')

    // Check page title and headers
    await expect(page.locator('h2:has-text("تسجيل الدخول")')).toBeVisible()
    await expect(page.locator('text=أدخل بيانات الدخول للوصول إلى لوحة التحكم')).toBeVisible()

    // Check form labels
    await expect(page.locator('label:has-text("اسم المستخدم")')).toBeVisible()
    await expect(page.locator('label:has-text("كلمة المرور")')).toBeVisible()

    // Check button
    await expect(page.locator('button:has-text("دخول")')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in wrong credentials
    await page.fill('input[placeholder="أدخل اسم المستخدم"]', 'wronguser')
    await page.fill('input[placeholder="أدخل كلمة المرور"]', 'wrongpass')

    // Submit form
    await page.click('button:has-text("دخول")')

    // Check for error message
    await expect(page.locator('text=اسم المستخدم أو كلمة المرور غير صحيحة')).toBeVisible({
      timeout: 10000
    })
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in correct credentials
    await page.fill('input[placeholder="أدخل اسم المستخدم"]', 'admin')
    await page.fill('input[placeholder="أدخل كلمة المرور"]', 'admin123')

    // Submit form
    await page.click('button:has-text("دخول")')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
    await expect(page.locator('h1:has-text("لوحة التحكم")')).toBeVisible()
    await expect(page.locator('text=مرحباً بك في لوحة التحكم')).toBeVisible()
  })

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible()
  })

  test('should logout successfully', async ({ page, context }) => {
    // First login
    await page.goto('/login')
    await page.fill('input[placeholder="أدخل اسم المستخدم"]', 'admin')
    await page.fill('input[placeholder="أدخل كلمة المرور"]', 'admin123')
    await page.click('button:has-text("دخول")')

    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })

    // Click logout
    await page.click('button:has-text("خروج")')

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 })

    // Try to access dashboard again
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should have RTL layout', async ({ page }) => {
    await page.goto('/login')

    // Check HTML dir attribute
    const htmlDir = await page.locator('html').getAttribute('dir')
    expect(htmlDir).toBe('rtl')

    // Check lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBe('ar')

    // Check input fields have RTL
    const usernameInput = page.locator('input[placeholder="أدخل اسم المستخدم"]')
    const usernameDir = await usernameInput.getAttribute('dir')
    expect(usernameDir).toBe('rtl')
  })

  test('should disable form during submission', async ({ page }) => {
    await page.goto('/login')

    // Fill form
    await page.fill('input[placeholder="أدخل اسم المستخدم"]', 'admin')
    await page.fill('input[placeholder="أدخل كلمة المرور"]', 'admin123')

    // Start submission
    const submitPromise = page.click('button:has-text("دخول")')

    // Check button text changes
    await expect(page.locator('button:has-text("جاري تسجيل الدخول...")')).toBeVisible()

    await submitPromise
  })

  test('should require both username and password', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    await page.click('button:has-text("دخول")')

    // Check HTML5 validation
    const usernameInput = page.locator('input[placeholder="أدخل اسم المستخدم"]')
    const isUsernameInvalid = await usernameInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid
    })
    expect(isUsernameInvalid).toBe(true)
  })

  test('should handle session persistence', async ({ page, context }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[placeholder="أدخل اسم المستخدم"]', 'admin')
    await page.fill('input[placeholder="أدخل كلمة المرور"]', 'admin123')
    await page.click('button:has-text("دخول")')

    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })

    // Open new tab
    const newPage = await context.newPage()
    await newPage.goto('/dashboard')

    // Should stay on dashboard (session persists)
    await expect(newPage).toHaveURL(/.*dashboard/)
    await expect(newPage.locator('h1:has-text("لوحة التحكم")')).toBeVisible()

    await newPage.close()
  })
})