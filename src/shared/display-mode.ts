/** Shared layout names. Room-specific control permissions are validated separately by the server. */
export const DISPLAY_MODES = ['shared-table', 'full-mobile'] as const;
export type DisplayMode = typeof DISPLAY_MODES[number];
export const isDisplayMode = (value: unknown): value is DisplayMode => DISPLAY_MODES.some(mode => mode === value);
