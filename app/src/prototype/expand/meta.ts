export interface ExpandVariantMeta {
    key: string;
    name: string;
}

/**
 * PROTOTYPE — day-row tap-to-reveal on mobile. Paces are currently hidden on
 * small screens (lg:inline in DayCard); three ways of revealing them on tap:
 * A = inline accordion, B = sticky note, C = bottom sheet. Switchable via
 * ?expand= on the schedule route, dev builds only.
 */
export const EXPAND_META: ExpandVariantMeta[] = [
    { key: 'A', name: 'Inline accordion' },
    { key: 'B', name: 'Sticky note' },
    { key: 'C', name: 'Bottom sheet' },
];
