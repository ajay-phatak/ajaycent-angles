/*
  Generates src/content/blog/<slug>.mdx from the vault note.

    npm run build:post

  The note is the record of the post, so the body is copied verbatim; the only
  edits are structural — drop the editing notes and `status:`, swap chart markers
  and markdown tables for components, add the imports. Every table swap is gated
  on the component's data still matching the note (see post.config.js), so the
  two copies of that data cannot drift silently.
*/
import fs from 'node:fs';
import { POST } from './post.config.js';
import { readNote, grabTable, dataOf, checkRows } from './lib.js';

const OUT = `src/content/blog/${POST.slug}.mdx`;
const componentPath = (name) => `src/components/${name}.astro`;

const { fm, body: original } = readNote(POST.note);
let body = original;

// --- tables: verify against the component, then swap ---
for (const t of POST.tables) {
	const { block, rows } = grabTable(body, t.header);
	checkRows(t.component, rows.map(t.parse), dataOf(componentPath(t.component), t.array));
	body = body.replace(block, `<${t.component} />`);
}

// --- charts: swap the inline markers ---
for (const c of POST.charts) {
	const marker = new RegExp(`^\\*\\[${c.marker}:[^\\]]*\\]\\*$`, 'm');
	if (!marker.test(body)) throw new Error(`marker not found in note: ${c.marker}`);
	body = body.replace(marker, `<${c.component} />`);
}

// --- nothing working-only may reach the published file ---
if (/\*\[Chart/.test(body)) throw new Error('an unswapped chart marker remains');
if (/^\|/m.test(body)) throw new Error('a markdown table survived the swap');
if (/^status:/m.test(body)) throw new Error('status: leaked into the body');

const imports = [...POST.charts, ...POST.tables]
	.map((c) => `import ${c.component} from '../../components/${c.component}.astro';`)
	.join('\n');

const frontmatter = [
	'---',
	`title: '${fm.title}'`,
	`description: ${fm.description}`,
	`pubDate: '${fm.pubDate}'`,
	'---',
	'',
].join('\n');

fs.writeFileSync(OUT, `${frontmatter}\n${imports}\n\n${body.trimStart()}`);
console.log(`rebuilt ${OUT}`);
