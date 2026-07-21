/*
  Shared palette + theme plumbing for post charts.
  Canvas can't read CSS custom properties, so these hex values mirror the
  oklch tokens in global.css closely enough to sit alongside the prose.
*/

export function isDark() {
	const explicit = document.documentElement.getAttribute('data-theme');
	if (explicit === 'dark') return true;
	if (explicit === 'light') return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function palette() {
	const dark = isDark();
	return {
		dark,
		ink: dark ? '#e8e9ee' : '#1f232f',
		inkSoft: dark ? '#a5a9b7' : '#5a5f6e',
		rule: dark ? '#383d4a' : '#dfe0e6',
		teal: dark ? '#4dbdca' : '#00727e',
		tealDim: dark ? '#35707a' : '#93c2c8',
		warm: dark ? '#d98f63' : '#b06135',
		warmFaint: dark ? 'rgba(217,143,99,0.42)' : 'rgba(176,97,53,0.38)',
		bg: dark ? '#15181f' : '#faf8f5',
		band: dark ? 'rgba(77,189,202,0.09)' : 'rgba(0,114,126,0.08)',
		fill: dark ? 'rgba(77,189,202,0.10)' : 'rgba(0,114,126,0.07)',
		tooltipBg: dark ? '#21252e' : '#fdfcfa',
		serif: 'Georgia, serif',
	};
}

/* Re-render on either the explicit toggle or an OS-level change. */
export function onThemeChange(handler) {
	new MutationObserver(handler).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme'],
	});
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler);
}
