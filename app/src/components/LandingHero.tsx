import { useMemo } from 'react';
import { usePlanStore } from '../store/usePlanStore';
import { calculateTrainingPaces, formatTimeHMS, parseTimeString } from '../lib/paceCalculator';
import { TimeInput } from './TimeInput';
import { DatePicker } from './DatePicker';

interface LandingHeroProps {
    defaultDate: Date;
}

/**
 * LandingHero — logbook-cover thesis for the empty state.
 *
 * Subject: Pfitzinger-based training plans (5K → Marathon).
 * Audience: self-coached runners who own the books and log miles.
 * Job: get them calibrated (recent result + race day + plan) and building.
 *
 * Signature: a live pace band — the paper wrist strip marathoners cut out
 * and wear on race day — recomputed from the benchmark input. One tactile
 * print artifact; everything around it stays quiet.
 */
export const LandingHero = ({ defaultDate }: LandingHeroProps) => {
    const selectedPlanId = usePlanStore(s => s.selectedPlanId);
    const availablePlans = usePlanStore(s => s.availablePlans);
    const raceInput = usePlanStore(s => s.raceInput);
    const raceDate = usePlanStore(s => s.raceDate);

    const planInfo = availablePlans.find(p => p.id === selectedPlanId);

    const preview = useMemo(() => {
        if (!raceInput) return null;
        const secs = parseTimeString(raceInput.time);
        if (!secs) return null;
        try {
            return calculateTrainingPaces(
                { distance: raceInput.distance, timeSeconds: secs },
                planInfo?.type ?? 'Marathon',
            );
        } catch {
            return null;
        }
    }, [raceInput, planInfo?.type]);

    const setRaceInputDistance = (distance: '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon') => {
        const state = usePlanStore.getState();
        state.setRaceInput(
            state.raceInput ? { ...state.raceInput, distance } : { distance, time: '45:00' },
        );
    };

    const setRaceInputTime = (time: string) => {
        const state = usePlanStore.getState();
        state.setRaceInput(
            state.raceInput ? { ...state.raceInput, time } : { distance: '10K', time },
        );
    };

    const buildSchedule = () => {
        usePlanStore.getState().setRaceDate(raceDate || defaultDate);
    };

    const shortResult = (t?: string) => (t ?? '').replace(/^0:/, '');

    const splits = preview
        ? [
              { label: '5K', time: preview.equivalents['5K'], isBase: raceInput?.distance === '5K' },
              { label: '10K', time: preview.equivalents['10K'], isBase: raceInput?.distance === '10K' },
              { label: 'HM', time: preview.equivalents['Half Marathon'], isBase: raceInput?.distance === 'Half Marathon' },
              { label: 'Mar', time: preview.equivalents['Marathon'], isBase: raceInput?.distance === 'Marathon' },
          ]
        : [];

    return (
        <div className="w-full max-w-4xl mx-auto mt-2 sm:mt-6 min-w-0 max-w-full">
            {/* Provenance eyebrow — encodes the true source, not decoration */}
            <p
                className="font-data text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-pencil animate-slide-up"
            >
                Advanced Marathoning · Faster Road Racing · Pfitzinger / Douglas
            </p>

            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 mt-4 items-start min-w-0">
                {/* Thesis */}
                <div className="animate-slide-up min-w-0 max-w-full" style={{ animationDelay: '60ms' }}>
                    <h2 data-testid="landing-thesis" className="font-display font-bold uppercase text-[2.6rem] min-[400px]:text-5xl sm:text-6xl leading-[0.92] tracking-wide text-ink text-balance max-w-full">
                        Train from what{' '}
                        <span className="pen-circle inline-block px-2 -mx-1 whitespace-nowrap">
                            you&rsquo;ve run
                        </span>
                    </h2>
                    <p className="text-pencil text-sm sm:text-[15px] leading-relaxed mt-4 max-w-md">
                        Pick a Pfitzinger schedule, enter a recent result, and get every
                        workout with pace targets dated to your race day.
                    </p>

                    {/* Calibration — parallel inputs, so no 01/02/03 sequence markers */}
                    <div className="mt-6 border border-rule bg-card p-4 sm:p-5 shadow-sm min-w-0 max-w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                            <div className="min-w-0 max-w-full">
                                <label
                                    htmlFor="landing-bench-dist"
                                    className="block font-data text-[10px] uppercase font-bold tracking-[0.14em] text-pencil mb-1.5"
                                >
                                    Recent result
                                </label>
                                <select
                                    id="landing-bench-dist"
                                    value={raceInput?.distance || '10K'}
                                    onChange={(e) =>
                                        setRaceInputDistance(
                                            e.target.value as '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon',
                                        )
                                    }
                                    className="w-full max-w-full truncate bg-paper border border-rule hover:border-pencil/60 px-3 py-2 text-sm font-data text-ink focus:ring-2 focus:ring-marker/60 outline-none transition-colors rounded-none"
                                >
                                    <option>5K</option>
                                    <option>10K</option>
                                    <option>15K</option>
                                    <option>Half Marathon</option>
                                    <option>Marathon</option>
                                </select>
                            </div>
                            <div className="min-w-0 max-w-full">
                                <span
                                    id="landing-bench-time-label"
                                    className="block font-data text-[10px] uppercase font-bold tracking-[0.14em] text-pencil mb-1.5"
                                >
                                    Finish time
                                </span>
                                <TimeInput
                                    value={raceInput?.time || ''}
                                    onChange={setRaceInputTime}
                                    raceDistance={raceInput?.distance}
                                    className="w-full max-w-full min-w-0 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mt-3 items-end min-w-0">
                            <div className="min-w-0 max-w-full">
                                <span
                                    id="landing-date-label"
                                    className="block font-data text-[10px] uppercase font-bold tracking-[0.14em] text-pencil mb-1.5"
                                >
                                    Race day
                                </span>
                                <DatePicker
                                    value={raceDate || defaultDate}
                                    onChange={(d) => usePlanStore.getState().setRaceDate(d)}
                                    placeholder="YYYY-MM-DD"
                                    className="w-full max-w-full min-w-0 text-sm"
                                />
                            </div>
                            <button
                                onClick={buildSchedule}
                                className="w-full max-w-full sm:w-auto py-2.5 px-6 bg-marker hover:bg-marker/90 active:bg-marker/80 text-paper font-data font-bold text-sm uppercase tracking-[0.12em] transition-colors rounded-none whitespace-normal min-[400px]:whitespace-nowrap"
                            >
                                Build my schedule
                            </button>
                        </div>
                    </div>

                    <p className="font-data text-[11px] text-pencil mt-3 tracking-wide">
                        Offline-ready · Shareable link · Exports to calendar
                    </p>
                </div>

                {/* Signature: live pace band */}
                <figure
                    className="lg:pt-2 animate-slide-up min-w-0 max-w-full"
                    style={{ animationDelay: '140ms' }}
                    aria-label="Live pace band preview"
                >
                    <div className="lg:-rotate-1 origin-top-left min-w-0 max-w-full">
                        <div className="bg-card border border-rule shadow-md overflow-hidden max-w-full">
                            <div className="h-1.5 bg-marker" aria-hidden="true" />
                            <div className="px-4 sm:px-5 pt-3 pb-4 min-w-0">
                                <div className="flex items-baseline justify-between gap-3 min-w-0">
                                    <figcaption className="font-data text-[10px] uppercase font-bold tracking-[0.16em] text-pencil truncate min-w-0">
                                        Pace band · cut here ✂
                                    </figcaption>
                                    <span className="font-data text-[10px] uppercase tracking-[0.16em] text-marker font-bold whitespace-nowrap shrink-0">
                                        {planInfo ? `${planInfo.type} · ${planInfo.weeks} wk` : 'Select plan ↓'}
                                    </span>
                                </div>

                                <div aria-live="polite" className="mt-3">
                                    {preview ? (
                                        <>
                                            <p className="font-data text-xs text-pencil">
                                                From your{' '}
                                                <span className="text-ink font-bold">
                                                    {shortResult(raceInput?.time)} {raceInput?.distance}
                                                </span>{' '}
                                                → goal{' '}
                                                <span className="text-ink font-bold">
                                                    {formatTimeHMS(
                                                        preview.equivalents[
                                                            planInfo?.type === 'Half Marathon'
                                                                ? 'Half Marathon'
                                                                : planInfo?.type === '5K'
                                                                  ? '5K'
                                                                  : planInfo?.type === '10K'
                                                                    ? '10K'
                                                                    : 'Marathon'
                                                        ],
                                                    )}
                                                </span>
                                            </p>
                                            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 min-w-0">
                                                {splits.map(s => (
                                                    <div
                                                        key={s.label}
                                                        className={
                                                            s.isBase
                                                                ? 'border border-marker bg-marker/5 px-2.5 py-2 min-w-0'
                                                                : 'border border-rule bg-paper/60 px-2.5 py-2 min-w-0'
                                                        }
                                                    >
                                                        <dt
                                                            className={
                                                                s.isBase
                                                                    ? 'font-data text-[10px] uppercase font-bold text-marker'
                                                                    : 'font-data text-[10px] uppercase font-bold text-pencil'
                                                            }
                                                        >
                                                            {s.label}
                                                            {s.isBase ? ' ★' : ''}
                                                        </dt>
                                                        <dd className="font-data font-bold text-base sm:text-lg text-ink tabular-nums leading-tight break-words">
                                                            {formatTimeHMS(s.time)}
                                                        </dd>
                                                    </div>
                                                ))}
                                            </dl>
                                            <p className="font-data text-[11px] text-pencil mt-3 tabular-nums">
                                                LT{' '}
                                                <span className="text-ink font-bold">
                                                    {preview.paces['Lactate Threshold']
                                                        ? `${Math.floor(preview.paces['Lactate Threshold'].min / 60)}:${String(Math.round(preview.paces['Lactate Threshold'].min % 60)).padStart(2, '0')}/km`
                                                        : '—'}
                                                </span>
                                                {'  ·  '}VO₂{' '}
                                                <span className="text-ink font-bold">
                                                    {preview.paces['VO2 Max']
                                                        ? `${Math.floor(preview.paces['VO2 Max'].min / 60)}:${String(Math.round(preview.paces['VO2 Max'].min % 60)).padStart(2, '0')}/km`
                                                        : '—'}
                                                </span>
                                                <span className="hidden sm:inline">
                                                    {'  ·  '}worn on race day, earned in training
                                                </span>
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-data text-xs text-pencil">
                                            Enter a recent finish time to tear off your band.
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Perforated tear edge */}
                            <div
                                className="pace-perf h-3 border-t border-rule bg-paper"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                    <p className="font-data text-[11px] text-pencil mt-3 lg:pl-1">
                        {planInfo ? planInfo.name : 'Choose a schedule below'} — every workout
                        dated to your race.
                    </p>
                </figure>
            </div>
        </div>
    );
};
