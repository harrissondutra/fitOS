import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')

  // Start browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Setup test data or authentication
    console.log('📝 Setting up test data...')
    
    // Mock authentication token
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-super-admin-token')
      localStorage.setItem('user', JSON.stringify({
        id: 'super-admin-1',
        role: 'SUPER_ADMIN',
        name: 'Super Admin',
        email: 'admin@fitos.app'
      }))
    })

    // Verify setup
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
