import { Page, expect } from '@playwright/test';

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Login with test credentials
   */
  async login(email: string = 'test@example.com', password: string = 'password') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-btn"]');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to a specific route
   */
  async navigateTo(route: string) {
    await this.page.goto(route);
    await this.waitForPageLoad();
  }

  /**
   * Fill form fields
   */
  async fillForm(fields: Record<string, string>) {
    for (const [selector, value] of Object.entries(fields)) {
      await this.page.fill(`[data-testid="${selector}"]`, value);
    }
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, value: string) {
    await this.page.selectOption(`[data-testid="${selector}"]`, value);
  }

  /**
   * Click button by test id
   */
  async clickButton(testId: string) {
    await this.page.click(`[data-testid="${testId}"]`);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(testId: string, timeout: number = 5000) {
    await this.page.waitForSelector(`[data-testid="${testId}"]`, { timeout });
  }

  /**
   * Check if element exists
   */
  async elementExists(testId: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element text
   */
  async getElementText(testId: string): Promise<string> {
    return await this.page.textContent(`[data-testid="${testId}"]`) || '';
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(testId: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="${testId}"]`, { state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(url: string, timeout: number = 10000) {
    await this.page.waitForResponse(response => response.url().includes(url), { timeout });
  }

  /**
   * Mock API response
   */
  async mockApiResponse(url: string, response: any) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Clear all mocks
   */
  async clearMocks() {
    await this.page.unrouteAll();
  }

  /**
   * Wait for notification
   */
  async waitForNotification(type: 'success' | 'error' | 'warning' = 'success') {
    await this.page.waitForSelector(`[data-testid="${type}-notification"]`, { timeout: 5000 });
  }

  /**
   * Check for success notification
   */
  async expectSuccessNotification() {
    await expect(this.page.locator('[data-testid="success-notification"]')).toBeVisible();
  }

  /**
   * Check for error notification
   */
  async expectErrorNotification() {
    await expect(this.page.locator('[data-testid="error-notification"]')).toBeVisible();
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 });
  }

  /**
   * Wait for modal to open
   */
  async waitForModal(testId: string) {
    await this.page.waitForSelector(`[data-testid="${testId}"]`, { state: 'visible' });
  }

  /**
   * Close modal
   */
  async closeModal() {
    await this.page.click('[data-testid="close-modal"]');
  }

  /**
   * Confirm dialog
   */
  async confirmDialog() {
    await this.page.click('[data-testid="confirm-btn"]');
  }

  /**
   * Cancel dialog
   */
  async cancelDialog() {
    await this.page.click('[data-testid="cancel-btn"]');
  }

  /**
   * Scroll to element
   */
  async scrollToElement(testId: string) {
    await this.page.locator(`[data-testid="${testId}"]`).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for table to load
   */
  async waitForTable(testId: string) {
    await this.page.waitForSelector(`[data-testid="${testId}"] tbody tr`, { timeout: 10000 });
  }

  /**
   * Get table row count
   */
  async getTableRowCount(testId: string): Promise<number> {
    return await this.page.locator(`[data-testid="${testId}"] tbody tr`).count();
  }

  /**
   * Wait for chart to load
   */
  async waitForChart(testId: string) {
    await this.page.waitForSelector(`[data-testid="${testId}"] canvas`, { timeout: 10000 });
  }

  /**
   * Wait for form validation
   */
  async waitForFormValidation() {
    await this.page.waitForTimeout(500);
  }

  /**
   * Check form validation error
   */
  async expectFormError(field: string, message: string) {
    await expect(this.page.locator(`[data-testid="${field}-error"]`)).toContainText(message);
  }

  /**
   * Clear form field
   */
  async clearField(testId: string) {
    await this.page.fill(`[data-testid="${testId}"]`, '');
  }

  /**
   * Upload file
   */
  async uploadFile(testId: string, filePath: string) {
    await this.page.setInputFiles(`[data-testid="${testId}"]`, filePath);
  }

  /**
   * Wait for file upload
   */
  async waitForFileUpload() {
    await this.page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });
  }

  /**
   * Wait for search results
   */
  async waitForSearchResults(testId: string) {
    await this.page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 5000 });
  }

  /**
   * Wait for filter to apply
   */
  async waitForFilter() {
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for pagination
   */
  async waitForPagination() {
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to next page
   */
  async goToNextPage() {
    await this.page.click('[data-testid="next-page-btn"]');
    await this.waitForPagination();
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage() {
    await this.page.click('[data-testid="prev-page-btn"]');
    await this.waitForPagination();
  }

  /**
   * Go to specific page
   */
  async goToPage(pageNumber: number) {
    await this.page.click(`[data-testid="page-${pageNumber}-btn"]`);
    await this.waitForPagination();
  }

  /**
   * Wait for dropdown to open
   */
  async waitForDropdown(testId: string) {
    await this.page.waitForSelector(`[data-testid="${testId}"]`, { state: 'visible' });
  }

  /**
   * Select dropdown option by text
   */
  async selectDropdownOption(testId: string, text: string) {
    await this.page.click(`[data-testid="${testId}"]`);
    await this.waitForDropdown(`${testId}-options`);
    await this.page.click(`[data-testid="${testId}-option-${text}"]`);
  }

  /**
   * Wait for tooltip
   */
  async waitForTooltip() {
    await this.page.waitForSelector('[data-testid="tooltip"]', { timeout: 5000 });
  }

  /**
   * Check tooltip text
   */
  async expectTooltipText(text: string) {
    await expect(this.page.locator('[data-testid="tooltip"]')).toContainText(text);
  }

  /**
   * Wait for toast notification
   */
  async waitForToast() {
    await this.page.waitForSelector('[data-testid="toast"]', { timeout: 5000 });
  }

  /**
   * Check toast text
   */
  async expectToastText(text: string) {
    await expect(this.page.locator('[data-testid="toast"]')).toContainText(text);
  }

  /**
   * Wait for confirmation dialog
   */
  async waitForConfirmationDialog() {
    await this.page.waitForSelector('[data-testid="confirmation-dialog"]', { timeout: 5000 });
  }

  /**
   * Confirm action
   */
  async confirmAction() {
    await this.waitForConfirmationDialog();
    await this.page.click('[data-testid="confirm-action-btn"]');
  }

  /**
   * Cancel action
   */
  async cancelAction() {
    await this.waitForConfirmationDialog();
    await this.page.click('[data-testid="cancel-action-btn"]');
  }
}

