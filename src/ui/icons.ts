const paths: Record<string, string> = {
  undo: '<path d="M9 7H4v-5M4.5 6.5A8 8 0 1 1 4 14"/>',
  redo: '<path d="M15 7h5v-5m-.5 4.5A8 8 0 1 0 20 14"/>',
  link: '<path d="M10.5 13.5l3-3m-7 7-1 1a4 4 0 0 1-5.5-5.8l3.5-3.5A4 4 0 0 1 9 9m6 6a4 4 0 0 0 5.5-.2l3.5-3.5A4 4 0 0 0 18.5 5l-1 1"/>',
  image:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 3.5 3.5 2-2L20 19"/>',
  table:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  numbered:
    '<path d="M10 6h11M10 12h11M10 18h11M4 4h1v4M3.5 11.5c.5-1 2.5-1 2.5.5 0 1-2 1.5-2.5 3H6M3.5 18h2a1 1 0 0 1-2 1.2M3.5 17a1 1 0 0 1 2-.2"/>',
  alignLeft: '<path d="M4 6h16M4 10h11M4 14h16M4 18h9"/>',
  alignCenter: '<path d="M4 6h16M7 10h10M4 14h16M8 18h8"/>',
  alignRight: '<path d="M4 6h16M9 10h11M4 14h16M11 18h9"/>',
  justify: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  indent: '<path d="M10 6h10M10 10h10M10 14h10M10 18h10M4 9l3 3-3 3"/>',
  outdent: '<path d="M10 6h10M10 10h10M10 14h10M10 18h10M7 9l-3 3 3 3"/>',
  divider: '<path d="M4 12h16"/>',
  print:
    '<path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/>',
  moon: '<path d="M20.5 15.5A9 9 0 0 1 8.5 3.5a9 9 0 1 0 12 12z"/>',
  focus: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  preview:
    '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.5"/>',
};

export function icon(name: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] ?? ""}</svg>`;
}
