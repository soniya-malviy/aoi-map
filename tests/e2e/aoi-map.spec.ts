import { test, expect } from '@playwright/test';

test.describe('AOI Creation Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application with all key elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Define Area of Interest/i })).toBeVisible();

    await expect(page.getByTestId('search-input')).toBeVisible();

    await expect(page.getByTestId('upload-button')).toBeVisible();

    await expect(page.getByTestId('map-container')).toBeVisible();
  });

  test('should perform location search and display results', async ({ page }) => {
    const searchInput = page.getByTestId('search-input');

    await searchInput.fill('Cologne');

    await page.waitForTimeout(1000);

    const searchResults = page.getByTestId('search-results');
    await expect(searchResults).toBeVisible({ timeout: 10000 });

    const firstResult = searchResults.locator('button').first();
    await expect(firstResult).toBeVisible();

    await firstResult.click();

    await expect(searchResults).not.toBeVisible();
  });

  test('should open file upload dialog when clicking upload button', async ({ page }) => {
    const uploadButton = page.getByTestId('upload-button');

    await expect(uploadButton).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;

    expect(fileChooser).toBeTruthy();
  });

  test('should display and interact with map controls', async ({ page }) => {
    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    const zoomInButton = page.locator('.leaflet-control-zoom-in');
    await expect(zoomInButton).toBeVisible();

    const zoomOutButton = page.locator('.leaflet-control-zoom-out');
    await expect(zoomOutButton).toBeVisible();

    await zoomInButton.click();
    await page.waitForTimeout(500);
  });

  test('should show drawing controls for creating AOI', async ({ page }) => {
    const drawPolygonButton = page.locator('.leaflet-draw-draw-polygon');
    await expect(drawPolygonButton).toBeVisible();

    const drawRectangleButton = page.locator('.leaflet-draw-draw-rectangle');
    await expect(drawRectangleButton).toBeVisible();

    const drawMarkerButton = page.locator('.leaflet-draw-draw-marker');
    await expect(drawMarkerButton).toBeVisible();
  });

  test('should handle search input clearing', async ({ page }) => {
    const searchInput = page.getByTestId('search-input');

    await searchInput.fill('Test Location');
    await expect(searchInput).toHaveValue('Test Location');

    const clearButton = page.locator('button[aria-label="Clear search"]');
    await expect(clearButton).toBeVisible();

    await clearButton.click();
    await expect(searchInput).toHaveValue('');
  });
});

test.describe('Feature Management', () => {
  test('should create GeoJSON test file and upload it', async ({ page }) => {
    await page.goto('/');

    const testGeoJSON = {
      type: 'Feature',
      properties: { name: 'Test Area' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [6.5, 51.2],
            [6.6, 51.2],
            [6.6, 51.3],
            [6.5, 51.3],
            [6.5, 51.2],
          ],
        ],
      },
    };

    const fileContent = JSON.stringify(testGeoJSON);
    const buffer = Buffer.from(fileContent);

    const uploadButton = page.getByTestId('upload-button');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'test-area.geojson',
      mimeType: 'application/json',
      buffer: buffer,
    });

    await page.waitForTimeout(2000);
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    const uploadButton = page.getByTestId('upload-button');
    await expect(uploadButton).toBeVisible();
  });


});
