/**
 * Breakpoints for TypeScript (BreakpointObserver). MUST mirror `$bp-*` in src/styles/_mixins.scss.
 * Media queries can't read CSS custom properties, so the values are duplicated here on purpose.
 */
export const BREAKPOINT = { sm: 375, md: 768, lg: 1024, xl: 1440 } as const;

/** Matches the SCSS `mx.down(mx.$bp-lg)` range, where the sidebar becomes a drawer. */
export const COMPACT_LAYOUT_QUERY = `(max-width: ${BREAKPOINT.lg - 1}px)`;
