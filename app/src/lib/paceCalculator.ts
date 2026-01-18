export type PaceZone = 'Recovery' | 'General Aerobic' | 'Long Run' | 'Marathon' | 'Lactate Threshold' | 'VO2 Max';

export interface PaceRange {
    min: number; // seconds per km
    max: number; // seconds per km
}

export interface Paces {
    [key: string]: PaceRange;
}

// Pfitz Zones based on Marathon Pace (MP)
// Recovery: MP + 25-40% (Slowest effort)
// General Aerobic: MP + 15-25%
// Long Run: MP + 10-20%
// Marathon: MP
// Lactate Threshold: 15K to Half Marathon Pace (approx MP - 15-20 sec/mile or MP * 0.92-0.95 for time based) - Simplified to ~8-12% faster than MP for broad estimation or typically defined as 1 hour race pace.
// For calculation simplicity often derived as:
// LT: ~ 103-106% of MP (Speed is faster, so time/km is LOWER. Factor would be 0.94 - 0.97)
// VO2 Max: 5k Pace (~ 110-115% of MP). Factor ~ 0.88 - 0.92

// Let's refine multipliers for TIME per distance (inverse of speed):
// If goal is 4:00/km. 
// Recovery (slower): 4 * 1.25 to 4 * 1.40
// GA: 4 * 1.15 to 4 * 1.25
// Long: 4 * 1.10 to 4 * 1.20
// MP: 4 * 1.0
// LT (faster): 4 * 0.90 to 4 * 0.94 (Approximate 15k-HM pace)
// VO2 (faster): 4 * 0.86 to 4 * 0.90 (Approximate 3k-5k pace)

const ZONES: Record<PaceZone, { min: number; max: number }> = {
    // factors are multipliers of time-per-unit (e.g. seconds per km)
    // min factor = faster end (smaller multiplier)
    // max factor = slower end (larger multiplier)
    'Recovery': { min: 1.25, max: 1.40 },
    'General Aerobic': { min: 1.15, max: 1.25 },
    'Long Run': { min: 1.10, max: 1.20 },
    'Marathon': { min: 1.0, max: 1.0 }, // Exact MP
    'Lactate Threshold': { min: 0.90, max: 0.94 },
    'VO2 Max': { min: 0.86, max: 0.90 }
};

export const calculatePaces = (mpSecondsPerKm: number): Paces => {
    const paces: Paces = {};

    for (const [zone, factors] of Object.entries(ZONES)) {
        paces[zone] = {
            min: Math.round(mpSecondsPerKm * factors.min),
            max: Math.round(mpSecondsPerKm * factors.max)
        };
    }

    return paces;
};

export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseTimeString = (timeString: string): number | null => {
    // Expects "H:MM:SS" or "MM:SS"
    const parts = timeString.split(':').map(Number);
    if (parts.some(isNaN)) return null;

    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return null;
}

export const getPaceZone = (title: string, tags?: string[]): PaceZone | null => {
    const t = title.toLowerCase();

    if (t.includes('tune-up')) return null;

    if (tags?.includes('Race') || t.includes('goal marathon') || t.includes('race')) return 'Marathon'; // Simplification: assume marathon pace for race week rehearsal if not specified
    if (t.includes('marathon pace') || t.includes('mp')) return 'Marathon';

    if (t.includes('lt') || t.includes('lactate') || t.includes('threshold')) return 'Lactate Threshold';

    if (t.includes('vo₂max') || t.includes('vo2max') || t.includes('intervals') || t.includes('5k race pace')) return 'VO2 Max';

    if (t.includes('long run') || t.includes('med-long run')) return 'Long Run';

    if (t.includes('gen-aerobic') || t.includes('general aerobic')) return 'General Aerobic';

    if (t.includes('recovery')) return 'Recovery';

    return null;
};
