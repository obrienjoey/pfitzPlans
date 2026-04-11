import type { FRRRow } from './frrData';
import { FRR_ROWS } from './frrData';

export const DISTS_M: Record<string, number> = {
  '5K': 5000, '10K': 10000, '15K': 15000,
  'Half Marathon': 21097.5, 'Marathon': 42195
};

// Pfitzinger's race-time ratios (relative to 10K time)
export const K5_FROM_K10 = 0.4808;
export const K15_FROM_K10 = 1.536;
export const TENMI_FROM_K10 = 1.72;
export const HM_FROM_K10 = 2.22;
export const MAR_FROM_K10 = 4.68;

export interface RaceInput {
  distance: '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon';
  timeSeconds: number;
}

export interface EquivalentTimes {
  '5K': number; '10K': number; '15K': number;
  '10 Miles': number; 'Half Marathon': number; 'Marathon': number;
}

export interface PaceRange { min: number; max: number; } // seconds per km

export interface TrainingPaces {
  'VO2 Max': PaceRange;
  'Lactate Threshold': PaceRange;
  'General Aerobic': PaceRange;
  'Long Run': PaceRange;
  'Marathon': PaceRange;
  'Recovery': PaceRange;
  'Speed 300m'?: PaceRange;
  'Speed 200m'?: PaceRange;
  /** Used by FRR plans in place of 'Marathon' to avoid displaying marathon pace for 5K/10K/HM plans */
  'Race Equivalent'?: PaceRange;
}

export type PaceZone = keyof TrainingPaces | 'General Aerobic' | 'Long Run' | 'Marathon' | 'Race Equivalent' | 'Lactate Threshold' | 'VO2 Max' | 'Recovery';

export function to10KEquivalent(input: RaceInput): number {
  switch (input.distance) {
    case '5K': return input.timeSeconds / K5_FROM_K10;
    case '15K': return input.timeSeconds / K15_FROM_K10;
    case 'Half Marathon': return input.timeSeconds / HM_FROM_K10;
    case 'Marathon': return input.timeSeconds / MAR_FROM_K10;
    case '10K': default: return input.timeSeconds;
  }
}

export function equivalentTimes(t10: number): EquivalentTimes {
  return {
    '5K': t10 * K5_FROM_K10,
    '10K': t10,
    '15K': t10 * K15_FROM_K10,
    '10 Miles': t10 * TENMI_FROM_K10,
    'Half Marathon': t10 * HM_FROM_K10,
    'Marathon': t10 * MAR_FROM_K10,
  };
}

export function marathonTrainingPaces(t10: number): TrainingPaces {
  const t5 = t10 * K5_FROM_K10;
  const p5km = t5 / 5.0; // VO2 max pace

  const p10km = t10 / 10.0;
  const ltMin = p10km + 10;
  const ltMax = p10km + 15;

  const tMar = t10 * MAR_FROM_K10;
  const mpKm = tMar / 42.195;
  
  return {
    'VO2 Max': { min: p5km, max: p5km },
    'Lactate Threshold': { min: ltMin, max: ltMax },
    'Marathon': { min: mpKm, max: mpKm },
    'General Aerobic': { min: mpKm * 1.15, max: mpKm * 1.25 },
    'Long Run': { min: mpKm * 1.10, max: mpKm * 1.20 },
    'Recovery': { min: mpKm * 1.25, max: mpKm * 1.40 }
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function parsePaceToSec(pace: string): number {
  const parts = pace.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

export function frrTrainingPaces(t10: number): TrainingPaces {
    let lower: FRRRow = FRR_ROWS[0];
    let upper: FRRRow = FRR_ROWS[FRR_ROWS.length - 1];
    let row: any = {};

    if (t10 <= lower.k10) {
        row = lower;
    } else if (t10 >= upper.k10) {
        row = upper;
    } else {
        for (let i = 0; i < FRR_ROWS.length - 1; i++) {
            if (t10 >= FRR_ROWS[i].k10 && t10 <= FRR_ROWS[i + 1].k10) {
                lower = FRR_ROWS[i];
                upper = FRR_ROWS[i + 1];
                break;
            }
        }
        
        const f = (t10 - lower.k10) / (upper.k10 - lower.k10);
        
        row.ltLo = lerp(parsePaceToSec(lower.ltLo), parsePaceToSec(upper.ltLo), f);
        row.ltHi = lerp(parsePaceToSec(lower.ltHi), parsePaceToSec(upper.ltHi), f);
        row.lrEarly = lerp(parsePaceToSec(lower.lrEarly), parsePaceToSec(upper.lrEarly), f);
        row.lrLatter = lerp(parsePaceToSec(lower.lrLatter), parsePaceToSec(upper.lrLatter), f);
        row.v400f = lerp(lower.v400f, upper.v400f, f);
        row.v400s = lerp(lower.v400s, upper.v400s, f);
        row.s300f = lerp(lower.s300f, upper.s300f, f);
        row.s300s = lerp(lower.s300s, upper.s300s, f);
        row.s200f = lerp(lower.s200f, upper.s200f, f);
        row.s200s = lerp(lower.s200s, upper.s200s, f);
    }
    
    const ltLoMi = typeof row.ltLo === 'string' ? parsePaceToSec(row.ltLo) : row.ltLo;
    const ltHiMi = typeof row.ltHi === 'string' ? parsePaceToSec(row.ltHi) : row.ltHi;
    const lrEarlyMi = typeof row.lrEarly === 'string' ? parsePaceToSec(row.lrEarly) : row.lrEarly;
    const lrLatterMi = typeof row.lrLatter === 'string' ? parsePaceToSec(row.lrLatter) : row.lrLatter;
    
    const miToKm = 1 / 1.609344;
    
    const tMar = t10 * MAR_FROM_K10;
    const trueMpKm = tMar / 42.195;
    // 10K race pace in sec/km — used as the reference for General Aerobic / Recovery in FRR plans
    const t10PaceKm = t10 / 10.0;

    return {
        'Lactate Threshold': { min: ltLoMi * miToKm, max: ltHiMi * miToKm },
        'Long Run': { min: lrLatterMi * miToKm, max: lrEarlyMi * miToKm },
        'VO2 Max': { min: row.v400f * (1000 / 400), max: row.v400s * (1000 / 400) },
        'Speed 300m': { min: row.s300f * (1000 / 300), max: row.s300s * (1000 / 300) },
        'Speed 200m': { min: row.s200f * (1000 / 200), max: row.s200s * (1000 / 200) },

        // Marathon pace is still computed for equivalents display, but for FRR plans
        // General Aerobic / Recovery reference the 10K pace, not the marathon equivalent
        'Marathon': { min: trueMpKm, max: trueMpKm },
        'General Aerobic': { min: t10PaceKm * 1.15, max: t10PaceKm * 1.25 },
        'Recovery': { min: t10PaceKm * 1.25, max: t10PaceKm * 1.40 }
    };
}

export function calculateTrainingPaces(
  input: RaceInput,
  planType: 'Marathon' | 'Half Marathon' | '5K' | '10K' | string
): { paces: TrainingPaces; equivalents: EquivalentTimes; t10: number } {
  const t10 = to10KEquivalent(input);
  const equivalents = equivalentTimes(t10);
  
  // 5K, 10K, and Half Marathon plans all use the FRR (Faster Road Racing) pace tables
  const paces = (planType === 'Half Marathon' || planType === '5K' || planType === '10K')
    ? frrTrainingPaces(t10) 
    : marathonTrainingPaces(t10);
    
  return { paces, equivalents, t10 };
}

export const formatTime = (seconds: number | undefined): string => {
    if (seconds === undefined || isNaN(seconds) || seconds == null || !isFinite(seconds)) return '—';
    const totalSecs = Math.round(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimeHMS = (seconds: number | undefined): string => {
    if (seconds === undefined || isNaN(seconds) || seconds == null || !isFinite(seconds)) return '—';
    const s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h === 0) return `${m}:${r.toString().padStart(2, '0')}`;
    return `${h}:${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
};

export const parseTimeString = (timeString: string | undefined): number | null => {
    if (!timeString) return null;
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

    // Tune-up races and goal races for non-marathon distances show no pace badge
    if (t.includes('tune-up')) return null;

    // Only map to 'Marathon' pace zone if the race is explicitly a marathon.
    // e.g. "8K or 10K goal race", "5K goal race" should NOT show the marathon-equivalent pace.
    if (t.includes('goal marathon') || t.includes('marathon goal race')) return 'Marathon';
    if (t.includes('goal race')) return null; // non-marathon goal race: no pace badge
    if (tags?.includes('Race')) return null;  // generic Race tag: no pace badge

    if (t.includes('marathon pace') || t.includes('mp')) return 'Marathon';
    if (t.includes('lt') || t.includes('lactate') || t.includes('threshold')) return 'Lactate Threshold';
    if (t.includes('speed') && !t.includes('aerobic')) return 'VO2 Max';
    // 'Race pace' intervals (e.g. 8K-10K race pace) and 'race pace + speed' map to VO2 Max zone
    if (t.includes('race pace')) return 'VO2 Max';
    if (t.includes('vo₂max') || t.includes('vo2max') || t.includes('intervals') || t.includes('5k race pace')) return 'VO2 Max';
    if (t.includes('long run') || t.includes('med-long run')) return 'Long Run';
    if (t.includes('endurance')) return 'Long Run';
    if (t.includes('gen-aerobic') || t.includes('general aerobic')) return 'General Aerobic';
    if (t.includes('recovery')) return 'Recovery';

    return null;
};
