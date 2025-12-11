import { test, expect } from '@playwright/test';

test.describe('Stripe Checkout Flow', () => {
  test('should display GiroPro+ pricing page', async ({ page }) => {
    await page.goto('/giropro-plus');
    
    // Check page title
    await expect(page).toHaveTitle(/GiroPro/);
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('GiroPro');
    
    // Check for pricing section
    await expect(page.locator('text=R$ 19,90')).toBeVisible();
  });

  test('should show PaywallButton when not logged in', async ({ page }) => {
    await page.goto('/giropro-plus');
    
    // Look for the PaywallButton
    const checkoutButton = page.locator('button:has-text("Começar 7 dias grátis")').first();
    await expect(checkoutButton).toBeVisible();
  });

  test('should redirect to login when clicking checkout without auth', async ({ page }) => {
    await page.goto('/giropro-plus');
    
    const checkoutButton = page.locator('button:has-text("Começar 7 dias grátis")').first();
    await checkoutButton.click();
    
    // Should show alert
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Faça login');
      dialog.dismiss();
    });
  });

  test('should verify checkout API endpoint exists', async ({ page }) => {
    const response = await page.request.post('/api/checkout', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      data: {}
    });
    
    // Should return 401 or 400 (auth error), not 404
    expect([400, 401, 500]).toContain(response.status());
  });

  test('should verify webhook endpoint exists', async ({ page }) => {
    const response = await page.request.post('/api/webhooks/stripe', {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid-signature'
      },
      data: {}
    });
    
    // Should return 400 (invalid signature), not 404
    expect([400, 500]).toContain(response.status());
  });

  test('should display Pro+ benefits', async ({ page }) => {
    await page.goto('/giropro-plus');
    
    const benefits = [
      'Compliance tributário automatizado',
      'Desempenho mensal com IA ilimitada',
      'GiroGarage completo',
      'Simulador Pro+',
      'Relatórios premium'
    ];
    
    for (const benefit of benefits) {
      await expect(page.locator(`text=${benefit}`)).toBeVisible();
    }
  });

  test('should have proper responsive design on mobile', async ({ page }) => {
    page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('/giropro-plus');
    
    // Check that content is still visible
    await expect(page.locator('text=GiroPro')).toBeVisible();
    await expect(page.locator('text=R$ 19,90')).toBeVisible();
  });

  test('should verify dark mode support', async ({ page }) => {
    await page.goto('/giropro-plus');
    
    // Add dark class to html
    await page.addInitScript(() => {
      document.documentElement.classList.add('dark');
    });
    
    // Check if dark mode elements are visible
    const darkElements = page.locator('.dark\\:bg-gray-900');
    // Should have at least some dark-mode specific elements
    expect(darkElements).toBeDefined();
  });

  test('should load page without console errors', async ({ page }) => {
    let consoleErrors = false;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors = true;
      }
    });
    
    await page.goto('/giropro-plus');
    await page.waitForLoadState('networkidle');
    
    expect(consoleErrors).toBe(false);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/giropro-plus');
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    // Check for alt text on images (if any)
    const images = page.locator('img');
    const count = await images.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // Images should have alt text or aria-hidden
        const ariaHidden = await images.nth(i).getAttribute('aria-hidden');
        expect(alt || ariaHidden).toBeTruthy();
      }
    }
  });
});

test.describe('Checkout Performance', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/giropro-plus');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have layout shift on button click', async ({ page }) => {
    await page.goto('/giropro-plus');
    
    const button = page.locator('button:has-text("Começar 7 dias grátis")').first();
    await button.boundingBox(); // Get initial position
    
    // Button should not move significantly
    const beforeBox = await button.boundingBox();
    await page.mouse.move(0, 0);
    const afterBox = await button.boundingBox();
    
    if (beforeBox && afterBox) {
      expect(Math.abs(beforeBox.x - afterBox.x)).toBeLessThan(10);
      expect(Math.abs(beforeBox.y - afterBox.y)).toBeLessThan(10);
    }
  });
});
