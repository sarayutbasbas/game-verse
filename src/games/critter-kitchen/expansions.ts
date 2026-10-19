import { ZOUS, RESTAURATEURS, PROMO_ZOUS, PROMO_RESTAURATEURS, ALACART_ZOUS } from './data.js';

/** Only verified, playable packs belong here. Missing card faces are not substitute rules. */
export interface CKExpansions { luckyDuck: boolean; rudy: boolean; aLaCartChefs?: boolean; aLaCartMoreChefs?: boolean }
export const BASE_EXPANSIONS: CKExpansions = { luckyDuck: false, rudy: false };
export function expansionOptions(value?: unknown): CKExpansions {
    if (value === undefined) return { ...BASE_EXPANSIONS };
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.entries(value).some(([key, enabled]) => !['luckyDuck', 'rudy', 'aLaCartChefs', 'aLaCartMoreChefs'].includes(key) || typeof enabled !== 'boolean'))
        throw Error('ชุดเสริมไม่ถูกต้อง');
    const options = { ...BASE_EXPANSIONS, ...value };
    // Omit the disabled additive field to preserve existing saved lobby settings.
    if (!options.aLaCartChefs) delete options.aLaCartChefs;
    if (!options.aLaCartMoreChefs) delete options.aLaCartMoreChefs;
    return options;
}
export const selectedZous = (options?: CKExpansions) => [...ZOUS, ...PROMO_ZOUS.filter(c => c.id === 'cosmo' ? options?.luckyDuck : options?.rudy), ...ALACART_ZOUS.filter(c => c.id === 'alex' || c.id === 'peter' ? options?.aLaCartChefs : options?.aLaCartMoreChefs)];
export const selectedRestaurateurs = (options?: CKExpansions) => [...RESTAURATEURS, ...PROMO_RESTAURATEURS.filter(() => options?.luckyDuck)];
