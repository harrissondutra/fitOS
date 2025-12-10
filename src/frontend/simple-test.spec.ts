import { test, expect } from '@playwright/test';

test.describe('Teste Simples de Carregamento', () => {
  test('deve carregar a página de login', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('http://localhost:3000/auth/login');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
    
    // Aguardar mais tempo para o JavaScript carregar
    await page.waitForTimeout(5000);
    
    // Verificar se a página carregou
    await expect(page).toHaveTitle(/FitOS/);
    
    // Tirar screenshot para debug
    await page.screenshot({ path: 'login-page.png' });
    
    // Verificar se há algum elemento na página
    const body = await page.locator('body').textContent();
    console.log('Conteúdo da página:', body?.substring(0, 200));
    
    // Verificar se há o loading spinner
    const loadingSpinner = page.locator('.animate-spin');
    const hasLoadingSpinner = await loadingSpinner.count() > 0;
    console.log('Tem loading spinner:', hasLoadingSpinner);
    
    // Verificar se há o formulário de login
    const emailInput = page.locator('input[type="email"]');
    const hasEmailInput = await emailInput.count() > 0;
    console.log('Tem input de email:', hasEmailInput);
    
    // Se não tem input de email, aguardar mais tempo
    if (!hasEmailInput) {
      console.log('Aguardando mais tempo para o formulário aparecer...');
      await page.waitForTimeout(10000);
      
      const emailInputAfterWait = page.locator('input[type="email"]');
      const hasEmailInputAfterWait = await emailInputAfterWait.count() > 0;
      console.log('Tem input de email após espera:', hasEmailInputAfterWait);
    }
  });
});
