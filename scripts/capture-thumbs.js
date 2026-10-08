/*
  Screenshots each post's lead chart for its card on the Blog page.

    npm run dev            (in another terminal, or astro dev --background)
    npm run build:thumbs

  Writes src/assets/thumbs/<slug>-light.png and <slug>-dark.png. The Blog page
  picks those up by filename, so a new post only needs a line in THUMBS below.
  Uses the installed Chrome rather than a downloaded browser.
*/
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.env.SITE_URL || 'http://localhost:4321';
const OUT = 'src/assets/thumbs';

// slug -> selector of the element to capture
const THUMBS = {
	'how-wrong-can-the-polls-be': 'figure.pes .pes-control',
	'labor-day-2026-midterm-prediction': '#seat-distribution-chart',
	'fiscal-responsibility-in-america': '#debt-chart',
	'state-of-the-iran-war': '#spr-chart',
};

const only = process.argv.slice(2);
const slugs = only.length ? only : Object.keys(THUMBS);

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });

for (const scheme of ['light', 'dark']) {
	const page = await browser.newPage({
		viewport: { width: 1100, height: 900 },
		deviceScaleFactor: 2,
		colorScheme: scheme,
	});
	for (const slug of slugs) {
		await page.goto(`${BASE}/blog/${slug}/`, { waitUntil: 'networkidle' });
		const el = page.locator(THUMBS[slug]).first();
		await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
		await el.scrollIntoViewIfNeeded();
		await page.waitForTimeout(1200); // let Chart.js finish its entry animation
		const file = `${OUT}/${slug}-${scheme}.png`;
		// pad the crop so edge labels aren't clipped
		const box = await el.boundingBox();
		const pad = 16;
		await page.screenshot({
			path: file,
			animations: 'disabled',
			clip: { x: box.x - pad, y: box.y - pad, width: box.width + 2 * pad, height: box.height + 2 * pad },
		});
		console.log(file);
	}
	await page.close();
}

await browser.close();
