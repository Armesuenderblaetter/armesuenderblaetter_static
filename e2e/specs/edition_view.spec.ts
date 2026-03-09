import { expect, test } from "@playwright/test";
import { glob } from 'glob';
import path from 'path';


const editionTypoFiles = await glob('html/fb_*.html');

const pathsToTest = editionTypoFiles.map(f => path.basename(f))


pathsToTest.forEach((path ) => {
  test(`testing edition page for ${path}`, async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 1920, height: 1200 });
    await page.goto(`http://localhost:8000/html/${path}`);
    await page.addStyleTag({ content: `
      #searchPage {height: auto !important;}
      #searchContainer {height: 100% !important; overflow: visible !important;}
      .search-col-left {height: 100% !important; overflow: visible !important;}
      .edition-content {height: 100% !important; overflow: visible !important;} 
      .edition-text-inner {overflow: visible !important; height: auto !important;} 
      .edition-text {overflow: visible !important;}
      #facsimiles {display:none !important;}
      .edition-pagination-header {display:none !important;}
      .nav-buttons {display:none !important;}
      footer {display:none !important;}
      header {display:none !important;}
      ` });
    const mainElement = page.locator("main");
		const textElemBox = await mainElement.boundingBox();
    const viewportWidth = page.viewportSize()?.width;
    await expect(page).toHaveScreenshot({fullPage: true, timeout: 10000,clip: { x: 0, y: 0, width: Number(viewportWidth), height: Number(textElemBox?.height) } });
  });
  // maxDiffPixelRatio: 0.1,
  // .tei-back, .site-top, #siteMenu, #facsimiles, footer, header, .footnotes, .edition-pagination-header, .search-col-left {display:none !important;}
});