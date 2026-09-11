/* Shared helpers for the publish scripts. See post.config.js for the workflow. */
import fs from 'node:fs';

/* Read a vault note and split it into frontmatter fields and body, with the
   "Editing notes" callout removed. That callout is working material — chart
   placements, claims to verify — and must never reach the published post. */
export function readNote(path) {
	const raw = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
	const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!m) throw new Error(`no frontmatter in ${path}`);

	const fm = {};
	for (const line of m[1].split('\n')) {
		const i = line.indexOf(': ');
		if (i >= 0) fm[line.slice(0, i)] = line.slice(i + 2).replace(/^'|'$/g, '');
	}

	const before = m[2].length;
	const body = m[2].replace(/^\s*> \[!note\][\s\S]*?(?=\n\n(?!>))/, '').replace(/^\n+/, '');
	if (body.length === before) throw new Error('editing-notes callout not found — did the note lose it?');
	if (/\[!note\]/.test(body)) throw new Error('an editing-notes callout survived the strip');

	return { fm, body };
}

/* Pull a markdown table out of the body by its exact header line. Returns the
   whole block (so it can be replaced) plus its rows as arrays of cells. */
export function grabTable(body, header) {
	const at = body.indexOf(`${header}\n`);
	if (at < 0) throw new Error(`table not found: ${header}`);
	const lines = body.slice(at).split('\n');
	if (!/^\|[-|]+\|$/.test(lines[1])) throw new Error(`no separator row under: ${header}`);
	let end = 2;
	while (lines[end]?.startsWith('|')) end++;
	return {
		block: lines.slice(0, end).join('\n'),
		rows: lines.slice(2, end).map((r) => r.split('|').slice(1, -1).map((c) => c.trim())),
	};
}

/* Read a literal array out of a component's frontmatter. Deliberately string
   slicing rather than a regex — the escaping is easy to get subtly wrong. */
export function dataOf(file, name) {
	const raw = fs.readFileSync(file, 'utf8');
	const at = raw.indexOf(`const ${name} = [`);
	if (at < 0) throw new Error(`${name} not found in ${file}`);
	const open = raw.indexOf('[', at);
	const close = raw.indexOf('\n];', open);
	if (close < 0) throw new Error(`${name} array not closed in ${file}`);
	return new Function(`return ${raw.slice(open, close + 2)}`)();
}

/* Compare the note's rows against the component's data. Only fields present on
   the note rows are checked, so components may carry presentation-only extras. */
export function checkRows(label, fromNote, fromComponent) {
	if (fromNote.length !== fromComponent.length)
		throw new Error(`${label}: note has ${fromNote.length} rows, component has ${fromComponent.length}`);

	fromNote.forEach((n, i) => {
		for (const field of Object.keys(n)) {
			if (String(n[field]) !== String(fromComponent[i][field])) {
				throw new Error(
					`${label} row ${i + 1} differs on "${field}":\n` +
						`  note:      ${n[field]}\n` +
						`  component: ${fromComponent[i][field]}`
				);
			}
		}
	});
	console.log(`  ${label}: ${fromNote.length} rows verified`);
}
