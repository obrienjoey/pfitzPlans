/**
 * Training-zone colors — a sequential intensity ramp in the watch-display
 * vernacular (cool → hot). Order encodes effort: Recovery easiest, VO2 Max hardest.
 */
export const ZONE_COLORS: Record<string, string> = {
    'Recovery': '#5E7E9B',
    'General Aerobic': '#3F8E6D',
    'Long Run': '#2E6E54',
    'Marathon': '#D9A13B',
    'Lactate Threshold': '#CE5F2A',
    'VO2 Max': '#C3372C',
    'Race Equivalent': '#C3372C',
    'Speed 200m': '#94376E',
    'Speed 300m': '#94376E',
};

export const zoneColor = (zone: string | null | undefined): string | null =>
    zone ? ZONE_COLORS[zone] ?? null : null;

/** Zone display order for legends. */
export const ZONE_ORDER = [
    'Recovery',
    'General Aerobic',
    'Long Run',
    'Marathon',
    'Lactate Threshold',
    'VO2 Max',
] as const;
