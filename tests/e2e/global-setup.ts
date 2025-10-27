import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Start browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Check if the application is running
    const title = await page.title();
    console.log(`✅ Application loaded with title: ${title}`);
    
    // Perform any necessary setup tasks
    await performSetupTasks(page);
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function performSetupTasks(page: any) {
  try {
    // Check if we need to create test data
    console.log('📊 Setting up test data...');
    
    // Wait for any loading indicators to disappear
    await page.waitForTimeout(2000);
    
    // Check if the application is in a good state
    const isReady = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    if (!isReady) {
      throw new Error('Application not ready');
    }
    
    console.log('✅ Test data setup completed');
  } catch (error) {
    console.error('❌ Test data setup failed:', error);
    throw error;
  }
}

export default globalSetup;

