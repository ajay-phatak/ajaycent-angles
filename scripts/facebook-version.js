/*
  Generates the Facebook plaintext version of the post.

    npm run build:facebook            # writes ./<slug>-facebook.txt
    npm run build:facebook -- out.txt # or to a path you name

  Sourced from the vault note rather than the .mdx, because the note still holds
  every table as markdown while the .mdx swaps several for components. The two
  agree by construction — build-post.js refuses to run when they don't.

  Facebook strips markdown, so: headings become ALL-CAPS lines, tables collapse
  to one line per row, links become "text (url)", and charts become a pointer
  back to the real post.
*/
import fs from 'node:fs';
import { POST, SITE } from './post.config.js';
import { readNote } from './lib.js';

const OUT = process.argv[2] ?? `${POST.slug}-facebook.txt`;
const DASH = ' — ';
const CHART_NOTE = '(interactive charts in the full post)';

const { fm, body } = readNote(POST.note);
const lines = body.split('\n');
const out = [];

for (let i = 0; i < lines.length; ) {
	const line = lines[i];

	if (line.startsWith('|')) {
		const rows = [];
		while (i < lines.length && lines[i].startsWith('|')) {
			const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim());
			if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
			i++;
		}
		rows.shift(); // header: the prose around each table already names its columns
		for (const r of rows) out.push(`  ${r.filter((c) => c.length).join(DASH)}`);
		out.push('');
		continue;
	}

	if (/^#{2,3} /.test(line)) {
		out.push('', line.replace(/^#+ /, '').toUpperCase(), '');
		i++;
		continue;
	}

	if (/^\*\[Chart /.test(line)) {
		out.push(CHART_NOTE);
		i++;
		continue;
	}

	out.push(line);
	i++;
}

let text = out.join('\n');
text = text
	.replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, (_, label, href) => `${label} (${SITE}${href})`)
	.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (_, label, href) => `${label} (${href})`)
	.replace(/\*\*([^*]+)\*\*/g, '$1')
	.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
	.replace(/`([^`]+)`/g, '$1')
	.replace(/\n{3,}/g, '\n\n')
	.trim();

const fb = `${fm.title.toUpperCase()}\n\n${text}\n\n${SITE}/blog/${POST.slug}\n`;
fs.writeFileSync(OUT, fb);

const leftovers = [
	['pipes', /^\|/m],
	['headings', /^#/m],
	['bold', /\*\*/],
	['markdown links', /\]\(/],
	['backticks', /`/],
	['chart markers', /\*\[Chart/],
].filter(([, re]) => re.test(fb));

console.log(`wrote ${OUT} (${fb.length} chars)`);
if (leftovers.length) console.log(`  WARNING unconverted markdown: ${leftovers.map(([n]) => n).join(', ')}`);
