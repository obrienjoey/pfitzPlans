/**
 * PROTOTYPE design tokens — the 'coach's paper training log' palette.
 * Paper + warm ink + pencil + graph-grid, one red-pen accent, and a
 * watch-vernacular zone ramp (blue -> green -> amber -> orange -> red).
 */
export const T = {
    paper: '#F5F1E8',
    card: '#FDFBF4',
    ink: '#221E17',
    pencil: '#7C7466',
    grid: '#DED7C4',
    marker: '#C6392B',
    markerSoft: 'rgba(198, 57, 43, 0.08)',
} as const;

/** Zone ramp — order encodes intensity, cool to hot. */
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

import { KM_PER_MILE } from '../../lib/constants';
import type { Distance } from '../../types';

export const fmtDist = (dist: Distance, units: 'mi' | 'km'): string => {
    const conv = (v: number) => (units === 'km' ? Math.round(v * KM_PER_MILE * 10) / 10 : v);
    if (typeof dist === 'number') return `${conv(dist)} ${units}`;
    return `${conv(dist[0])}–${conv(dist[1])} ${units}`;
};
