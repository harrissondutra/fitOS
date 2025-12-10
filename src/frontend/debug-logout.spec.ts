import { test, expect } from '@playwright/test';

test.describe('Debug do Logout', () => {
  test('deve investigar a estrutura da página após login', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    await page.fill('input[type="email"]', 'harrissondutra@gmail.com');
    await page.fill('input[type="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/super-admin/dashboard', { timeout: 15000 });
    
    // Aguardar mais tempo para a página carregar completamente
    await page.waitForTimeout(3000);
    
    // Tirar screenshot para debug
    await page.screenshot({ path: 'dashboard-page.png' });
    
    // Procurar por elementos relacionados ao usuário
    console.log('=== INVESTIGANDO ELEMENTOS DO USUÁRIO ===');
    
    // Procurar por avatares
    const avatars = page.locator('[data-testid*="avatar"], .avatar, [class*="avatar"]');
    const avatarCount = await avatars.count();
    console.log('Avatares encontrados:', avatarCount);
    
    // Procurar por botões com aria-haspopup
    const popupButtons = page.locator('button[aria-haspopup="true"]');
    const popupCount = await popupButtons.count();
    console.log('Botões com aria-haspopup:', popupCount);
    
    // Procurar por elementos do sidebar
    const sidebarElements = page.locator('[data-sidebar], .sidebar, [class*="sidebar"]');
    const sidebarCount = await sidebarElements.count();
    console.log('Elementos do sidebar:', sidebarCount);
    
    // Procurar por elementos com "user" no texto ou classe
    const userElements = page.locator('[class*="user"], [data-testid*="user"], button:has-text("user"), button:has-text("User")');
    const userCount = await userElements.count();
    console.log('Elementos relacionados ao usuário:', userCount);
    
    // Procurar por dropdowns
    const dropdowns = page.locator('[role="menu"], [role="menuitem"], .dropdown, [class*="dropdown"]');
    const dropdownCount = await dropdowns.count();
    console.log('Elementos de dropdown:', dropdownCount);
    
    // Procurar por elementos que contenham "Sair" ou "Logout"
    const logoutElements = page.locator(':has-text("Sair"), :has-text("Logout"), :has-text("sair"), :has-text("logout")');
    const logoutCount = await logoutElements.count();
    console.log('Elementos com "Sair" ou "Logout":', logoutCount);
    
    // Listar todos os botões na página
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log('Total de botões na página:', buttonCount);
    
    // Listar os primeiros 10 botões
    for (let i = 0; i < Math.min(10, buttonCount); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      const classes = await button.getAttribute('class');
      const ariaLabel = await button.getAttribute('aria-label');
      console.log(`Botão ${i}: "${text}" - classes: "${classes}" - aria-label: "${ariaLabel}"`);
    }
  });
});
