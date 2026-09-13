// PROTOTYPE — throwaway for issue #2 (Render weekly volume ranges in WeekCard header).
// Question: how should the header show displayTotal.formatted so single values
// ("85 km") and ranges ("82.9 - 84.5 km") both stay crisp and balanced?
// Three variants of the WeekCard header volume block, switchable via ?variant=
// on the existing plan route (sub-shape A: real PlanViewer data and density).
// Run: npm run dev → open a plan with a race date → append &variant=vol-ledger
// (or vol-bracket / vol-stamp). ←/→ keys cycle. Toggle mi/km to compare
// rounding. No tests, no persistence — delete after a winner is picked.
import { format } from 'date-fns';
import type { RenderedWeek, WeeklyVolume } from '../../types';

export interface VolumeHeaderProps {
    week: RenderedWeek;
    units: 'mi' | 'km';
    displayTotal: WeeklyVolume;
    actualVolume?: number | null;
    label: string;
    isCurrentWeek: boolean;
}

/** Full WeeklyVolume state, rendered under every variant so changes are visible. */
const DebugState = ({ displayTotal, units }: { displayTotal: WeeklyVolume; units: string }) => (
    <div className="font-data text-[10px] text-pencil mt-1 tabular-nums">
        state: min {displayTotal.min} · max {displayTotal.max} · avg {displayTotal.average} · “{displayTotal.formatted}”
        · {units}
    </div>
);

const DateLine = ({ week, isCurrentWeek }: { week: RenderedWeek; isCurrentWeek: boolean }) => (
    <div className="font-data text-[10px] uppercase tracking-[0.18em] text-pencil">
        {format(week.weekStart, 'MMM d')} – {format(week.weekEnd, 'MMM d')}
        {isCurrentWeek && <span className="text-marker font-bold"> · this week</span>}
    </div>
);

const LoggedLine = ({ actualVolume }: { actualVolume?: number | null }) =>
    actualVolume != null ? (
        <div className="font-data text-[10px] text-marker font-bold mt-0.5">
            {actualVolume > 0 ? `✓ ${actualVolume} logged` : '· 0 logged'}
        </div>
    ) : null;

/** A — ledger column: total stays right-aligned, range honesty moves to a spread caption. */
export const VariantLedger = ({ week, units, displayTotal, actualVolume, label, isCurrentWeek }: VolumeHeaderProps) => {
    const isRange = displayTotal.min !== displayTotal.max;
    const spread = Math.round((displayTotal.max - displayTotal.min) * 10) / 10;
    return (
        <div className="flex items-center gap-4 px-3 sm:px-5 py-2.5 border-b border-rule">
            <div className="font-display font-bold text-ink text-3xl sm:text-4xl leading-none w-14 sm:w-16 flex-none">
                {String(week.weekNumber).padStart(2, '0')}
            </div>
            <div className="flex-1 min-w-0">
                <DateLine week={week} isCurrentWeek={isCurrentWeek} />
                <div className="text-xs text-pencil">{label}</div>
            </div>
            <div className="text-right flex-none">
                <span className="font-data text-ink font-bold text-lg leading-none tabular-nums">
                    {displayTotal.formatted}
                </span>
                <span className="font-data text-[10px] text-pencil ml-1">{units}</span>
                <div className="font-data text-[10px] text-pencil mt-0.5 tabular-nums">
                    {isRange ? `avg ${displayTotal.average} · ±${spread}` : 'exact week'}
                </div>
                <LoggedLine actualVolume={actualVolume} />
                <DebugState displayTotal={displayTotal} units={units} />
            </div>
        </div>
    );
};

/** B — interval bracket: volume drops to its own full-width row as a min—max track. */
export const VariantBracket = ({ week, units, displayTotal, actualVolume, label, isCurrentWeek }: VolumeHeaderProps) => {
    const isRange = displayTotal.min !== displayTotal.max;
    return (
        <div className="px-3 sm:px-5 py-2.5 border-b border-rule">
            <div className="flex items-center gap-4">
                <div className="font-display font-bold text-ink text-3xl sm:text-4xl leading-none w-14 sm:w-16 flex-none">
                    {String(week.weekNumber).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                    <DateLine week={week} isCurrentWeek={isCurrentWeek} />
                    <div className="text-xs text-pencil">{label}</div>
                </div>
                <LoggedLine actualVolume={actualVolume} />
            </div>
            {isRange ? (
                <div className="flex items-center gap-2 mt-2" aria-label={`Weekly volume ${displayTotal.formatted} ${units}`}>
                    <span className="font-data font-bold text-sm text-ink tabular-nums">{displayTotal.min}</span>
                    <span className="relative flex-1 h-px bg-pencil/50" aria-hidden="true">
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-data text-[10px] font-bold text-ink bg-card border border-rule px-1.5 tabular-nums">
                            {displayTotal.average}
                        </span>
                    </span>
                    <span className="font-data font-bold text-sm text-ink tabular-nums">{displayTotal.max}</span>
                    <span className="font-data text-[10px] text-pencil">{units}</span>
                </div>
            ) : (
                <div className="mt-2">
                    <span className="font-data font-bold text-sm text-ink bg-card border border-rule px-2 py-0.5 tabular-nums">
                        {displayTotal.formatted} {units} · exact
                    </span>
                </div>
            )}
            <DebugState displayTotal={displayTotal} units={units} />
        </div>
    );
};

/** C — volume stamp: total becomes a tilted docket chip docked left of the numeral. */
export const VariantStamp = ({ week, units, displayTotal, actualVolume, label, isCurrentWeek }: VolumeHeaderProps) => {
    const isRange = displayTotal.min !== displayTotal.max;
    return (
        <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2.5 border-b border-rule">
            <span
                className={`flex-none -rotate-2 border px-2 py-1 font-data font-bold text-xs tabular-nums whitespace-nowrap ${
                    isRange ? 'border-marker text-marker' : 'border-ink text-ink'
                }`}
            >
                {displayTotal.formatted} {units}
            </span>
            <div className="font-display font-bold text-ink text-3xl sm:text-4xl leading-none w-14 sm:w-16 flex-none">
                {String(week.weekNumber).padStart(2, '0')}
            </div>
            <div className="flex-1 min-w-0">
                <DateLine week={week} isCurrentWeek={isCurrentWeek} />
                <div className="text-xs text-pencil">{label}</div>
                <DebugState displayTotal={displayTotal} units={units} />
            </div>
            <LoggedLine actualVolume={actualVolume} />
        </div>
    );
};
