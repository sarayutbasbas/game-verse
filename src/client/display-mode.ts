import { isDisplayMode, type DisplayMode } from '../shared/display-mode.js';
/** Retain Critter Kitchen's existing per-room preference key for compatibility. */
export function deviceDisplayMode(code: string): DisplayMode | '' { try {
    const mode = localStorage.getItem('ck-mode:' + code);
    return isDisplayMode(mode) ? mode : '';
}
catch {
    return '';
} }
export function saveDisplayMode(code: string, mode: string) { if (!isDisplayMode(mode))
    return; try {
    localStorage.setItem('ck-mode:' + code, mode);
}
catch { /* Unavailable storage must not prevent playing. */ } }
