export interface DesignVariantMeta {
    key: string;
    name: string;
}

/**
 * PROTOTYPE — 'coach's paper training log' design direction.
 * Three structural variants of the plan page: A = Log Table, B = Bib & Splits,
 * C = Session Sheet. Switchable via ?design= on the schedule route, dev builds only.
 */
export const DESIGN_META: DesignVariantMeta[] = [
    { key: 'A', name: 'Log Table' },
    { key: 'B', name: 'Bib & Splits' },
    { key: 'C', name: 'Session Sheet' },
];
