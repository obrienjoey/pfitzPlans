import { test, expect } from '@playwright/test';

test.describe('RacePlans E2E Core Journeys', () => {

  test('1. Initial Setup Flow', async ({ page }) => {
    // Load home page
    await page.goto('/');

    // Check onboarding screen shows
    await expect(page.locator('h2:has-text("Start Your Training")')).toBeVisible();

    // Select "Faster Road Racing: 5K Schedule 1" plan
    const planButton = page.locator('button:has-text("Faster Road Racing: 5K Schedule 1")');
    await expect(planButton).toBeVisible();
    await planButton.click();

    // Click Generate Schedule
    const generateBtn = page.locator('button:has-text("Generate Schedule")');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Verify schedule is rendered with correct plan name
    await expect(page.locator('h2:has-text("Faster Road Racing: 5K Schedule 1")')).toBeVisible();
    await expect(page.locator('text=Training Paces')).toBeVisible();
  });

  test('2. Rescheduling Flow (Drag & Drop)', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    await page.goto('/');

    // Generate schedule
    await page.locator('button:has-text("Faster Road Racing: 5K Schedule 1")').click();
    await page.locator('button:has-text("Generate Schedule")').click();

    // Wait for the slide-in animation (duration-500) to finish completely
    await page.waitForTimeout(600);

    // Locate two day cards to swap (e.g., Day 1 and Day 2 of Week 0)
    const card1 = page.locator('[id="week-0-day-1"]');
    const card2 = page.locator('[id="week-0-day-2"]');
    
    await expect(card1).toBeVisible();
    await expect(card2).toBeVisible();

    // Get the workout titles before drag and drop
    const title1Before = await card1.locator('h4').textContent();
    const title2Before = await card2.locator('h4').textContent();

    // Scroll the week card/day cards into view to make sure they are in the viewport
    await card1.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Get viewport-relative coordinates of the day cards
    const rect1 = await card1.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const rect2 = await card2.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });

    console.log('Card 1 Viewport Rect:', rect1);
    console.log('Card 2 Viewport Rect:', rect2);

    if (rect1 && rect2) {
      // Move to center of card 1 (relative to viewport)
      await page.mouse.move(rect1.x + rect1.width / 2, rect1.y + rect1.height / 2);
      await page.mouse.down();
      
      // Move horizontally right past the 10px activation constraint threshold
      await page.mouse.move(rect1.x + rect1.width / 2 + 25, rect1.y + rect1.height / 2, { steps: 5 });
      await page.waitForTimeout(200);

      // Get updated viewport coordinates of card 2 in case the drag-start shifted the layout
      const rect2Updated = await card2.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });

      // Move horizontally to target card center
      await page.mouse.move(rect2Updated.x + rect2Updated.width / 2, rect2Updated.y + rect2Updated.height / 2, { steps: 10 });
      await page.waitForTimeout(200);
      
      await page.mouse.up();
      await page.waitForTimeout(150);
    }

    // Verify titles have swapped
    const title1After = await card1.locator('h4').textContent();
    const title2After = await card2.locator('h4').textContent();
    console.log('After Swap - Card 1 Title:', title1After);
    console.log('After Swap - Card 2 Title:', title2After);

    expect(title1After).toBe(title2Before);
    expect(title2After).toBe(title1Before);
  });

  test('3. Settings Toggle (Units mi/km)', async ({ page }) => {
    await page.goto('/');

    // Generate schedule
    await page.locator('button:has-text("Faster Road Racing: 5K Schedule 1")').click();
    await page.locator('button:has-text("Generate Schedule")').click();

    // Check initial unit display in a day card (usually km by default in store)
    const card = page.locator('[id="week-0-day-1"]');
    await expect(card).toBeVisible();
    
    // Toggle units on the header
    const unitsBtn = page.locator('button[title="Toggle Units"]');
    await expect(unitsBtn).toBeVisible();
    const initialUnit = await unitsBtn.textContent();
    
    await unitsBtn.click();
    
    const toggledUnit = await unitsBtn.textContent();
    expect(toggledUnit).not.toBe(initialUnit);

    // Verify that the distance badge in the day card updated
    const distText = await card.locator('.font-mono').textContent();
    expect(distText).toContain(toggledUnit?.trim());
  });

  test('4. Deep Linking (URL Sync)', async ({ page }) => {
    // Navigate with predefined URL parameters
    // Using frr_5k_01 plan, units mi, and date 2026-10-11
    await page.goto('/?plan=frr_5k_01&date=2026-10-11&dist=5K&time=0%3A18%3A45&units=mi');

    // The app should automatically bypass setup screen and render schedule
    await expect(page.locator('h2:has-text("Faster Road Racing: 5K Schedule 1")')).toBeVisible();

    // Verify target race date matches Oct 11, 2026
    await expect(page.getByText('Oct 11', { exact: true })).toBeVisible();
    await expect(page.getByText('2026', { exact: true }).first()).toBeVisible();

    // Verify units match 'mi'
    const unitsBtn = page.locator('button[title="Toggle Units"]');
    await expect(unitsBtn).toHaveText('mi');
  });

});
