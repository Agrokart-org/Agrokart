const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('🚀 Starting Local Playwright Verification (Screenshots)...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    const log = (msg) => console.log(msg);

    try {
        // 1. Home Page
        log('🌐 Navigating to App Root...');
        await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Handle "Enable Notifications" modal if present
        try {
            const maybeLaterText = page.locator('text="Maybe Later"');
            if (await maybeLaterText.count() > 0 && await maybeLaterText.isVisible()) {
                await maybeLaterText.click();
                log('👉 Clicked "Maybe Later"');
                await page.waitForTimeout(1000);
            }
        } catch (e) { }

        log('📸 Taking Home screenshot...');
        await page.screenshot({ path: 'screenshot_home.png', fullPage: true });

        // 2. Products Page
        log('🌐 Navigating to Products Page...');
        await page.goto('http://localhost:3000/products', { waitUntil: 'domcontentloaded', timeout: 30000 });

        log('⏳ Waiting for products content (3s)...');
        await page.waitForTimeout(3000);

        log('📸 Taking Products screenshot...');
        await page.screenshot({ path: 'screenshot_products.png', fullPage: true });

        // 3. Simple Check
        const productCount = await page.locator('text=Add to Cart').count();
        log(`📊 "Add to Cart" buttons found: ${productCount}`);

        const content = await page.content();
        if (content.includes('Test Urea') || content.includes('Urea')) log('✅ Urea product found in DOM');

        log('✅ Verification & Screenshots Complete.');
    } catch (error) {
        log(`❌ Verification Failed: ${error.message}`);
        // Take error screenshot
        try {
            await page.screenshot({ path: 'screenshot_error.png' });
        } catch (e) { }
    } finally {
        await browser.close();
    }
})();
