import { formatTime } from './paceCalculator';
import { KM_PER_MILE } from './constants';

export const formatPlanLabel = (text: string, units: 'mi' | 'km'): string => {
    // Pattern: {mi_range:km_range} e.g. {8-9:13-14}
    return text.replace(/\{([0-9.-]+):([0-9.-]+)\}/g, (_, mi, km) => {
        return units === 'mi' ? mi : km;
    });
};

export const formatPaceRange = (
    range: { min: number; max: number },
    units: 'mi' | 'km',
    includeUnit: boolean = false
): string => {
    const minVal = units === 'km' ? range.min : range.min * KM_PER_MILE;
    const maxVal = units === 'km' ? range.max : range.max * KM_PER_MILE;
    
    let base = '';
    if (range.min === range.max) {
        base = formatTime(minVal);
    } else {
        base = `${formatTime(minVal)} – ${formatTime(maxVal)}`;
    }
    
    return includeUnit ? `${base} /${units}` : base;
};
