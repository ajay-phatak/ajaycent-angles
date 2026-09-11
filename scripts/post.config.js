/*
  Per-post configuration for the publish scripts.

  The workflow these support: the post is drafted and edited as a note in the
  Obsidian vault, and that note stays the record of the post. The scripts derive
  the published .mdx and the Facebook plaintext from it, so the prose is never
  hand-transcribed and can't drift between the three copies.

  For the next post, change POST below — the scripts themselves shouldn't need
  editing unless the post uses a table shape none of the existing parsers cover.
*/

// Override with VAULT_DIR=... if the vault ever moves or you're on another machine.
export const VAULT =
	process.env.VAULT_DIR ?? 'C:/Users/wizar/OneDrive/Documents/Obsidian Vault/Ajaycent Angles';

export const SITE = 'https://ajaycent.com';

export const POST = {
	note: `${VAULT}/9-9-26 2026 Midterm Prediction.md`,
	slug: 'labor-day-2026-midterm-prediction',

	// Inline markers in the note, swapped for components in the .mdx. The note
	// keeps a human-readable marker so the draft still reads straight through.
	charts: [
		{ marker: 'Chart 1', component: 'SenatePollsVsMarketsChart' },
		{ marker: 'Chart 2', component: 'SenateSeatDistributionChart' },
	],

	/*
	  Markdown tables in the note that render as styled components on the site.
	  These exist twice — as markdown here, as a data array in the component — so
	  each one is verified row-by-row before the swap and the build fails loudly
	  on any mismatch. `parse` maps one markdown row's cells onto the shape the
	  component's array uses; only the fields `parse` returns are compared, so a
	  component may carry extra presentation-only fields.
	*/
	tables: [
		{
			header: '| Key | 2026 | |',
			component: 'MidtermKeysTable',
			array: 'KEYS',
			parse: (c) => ({
				key: c[0],
				held: c[1].replace(/\*/g, '') === 'TRUE',
				evidence: c[2].replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'),
			}),
		},
		{
			header: '| | Dem margin | Win probability |',
			component: 'SenateRaceOddsTable',
			array: 'RACES',
			parse: (c) => ({
				state: c[0],
				margin: c[1].replace(/\*/g, '') === 'no polling' ? null : Number(c[1].split('\u2212').join('-')),
				prob: c[2] === '\u2014' ? null : Number(c[2].replace('%', '')),
			}),
		},
		{
			header: '| Democrats win... | Seats |',
			component: 'HouseCeilingTable',
			array: 'TIERS',
			parse: (c) => ({ label: c[0], seats: Number(c[1]) }),
		},
	],
};
