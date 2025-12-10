import { test, expect } from '@playwright/test';

test.describe('Autenticação FitOS', () => {
  test('deve fazer login e redirecionar para dashboard', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('http://localhost:3000/auth/login');
    
    // Aguardar a página carregar completamente
    await page.waitForLoadState('networkidle');
    
    // Aguardar mais tempo para o JavaScript carregar completamente
    await page.waitForTimeout(5000);
    
    // Aguardar o formulário de login aparecer
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    // Verificar se a página de login carregou
    await expect(page).toHaveTitle(/FitOS/);
    
    // Preencher o formulário de login
    await page.fill('input[type="email"]', 'harrissondutra@gmail.com');
    await page.fill('input[type="password"]', 'Admin@1234');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar o redirecionamento
    await page.waitForURL('**/super-admin/dashboard', { timeout: 15000 });
    
    // Verificar se foi redirecionado para o dashboard correto
    expect(page.url()).toContain('/super-admin/dashboard');
    
    // Verificar se há elementos do dashboard
    await expect(page.locator('h1, h2, h3')).toContainText(['Dashboard Super Admin']);
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('http://localhost:3000/auth/login');
    
    // Aguardar a página carregar completamente
    await page.waitForLoadState('networkidle');
    
    // Aguardar mais tempo para o JavaScript carregar completamente
    await page.waitForTimeout(5000);
    
    // Aguardar o formulário de login aparecer
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    // Preencher com credenciais inválidas
    await page.fill('input[type="email"]', 'teste@teste.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar mensagem de erro
    await page.waitForSelector('[role="alert"], .error, .toast', { timeout: 5000 });
    
    // Verificar se ainda está na página de login
    expect(page.url()).toContain('/auth/login');
  });

  test('deve manter sessão após refresh', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Aguardar mais tempo para o JavaScript carregar completamente
    await page.waitForTimeout(5000);
    
    // Aguardar o formulário de login aparecer
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    await page.fill('input[type="email"]', 'harrissondutra@gmail.com');
    await page.fill('input[type="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/super-admin/dashboard', { timeout: 15000 });
    
    // Fazer refresh da página
    await page.reload();
    
    // Verificar se ainda está logado (não foi redirecionado para login)
    expect(page.url()).toContain('/super-admin/dashboard');
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Aguardar mais tempo para o JavaScript carregar completamente
    await page.waitForTimeout(5000);
    
    // Aguardar o formulário de login aparecer
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    await page.fill('input[type="email"]', 'harrissondutra@gmail.com');
    await page.fill('input[type="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/super-admin/dashboard', { timeout: 15000 });
    
    // Procurar pelo avatar do usuário no sidebar (NavUser)
    const userAvatar = page.locator('[data-sidebar="menu"] button[aria-haspopup="true"]').first();
    
    // Clicar no avatar para abrir o dropdown
    await userAvatar.click();
    await page.waitForTimeout(1000); // Aguardar menu abrir
    
    // Procurar pelo item "Sair" no dropdown
    const logoutButton = page.locator('[role="menuitem"]:has-text("Sair")').first();
    
    await logoutButton.click();
    
    // Aguardar redirecionamento para login
    await page.waitForURL('**/auth/login', { timeout: 5000 });
    
    // Verificar se foi redirecionado para login
    expect(page.url()).toContain('/auth/login');
  });
});
