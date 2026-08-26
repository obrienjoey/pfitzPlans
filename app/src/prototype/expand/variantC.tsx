import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { RenderedPlan, RenderedWorkout } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { formatPlanLabel } from '../../lib/formatters';
import { Row, Sheet, paceFor, weeksIsCurrent } from './shared';

/**
 * PROTOTYPE Variant C — Bottom sheet. Tapping a day slides a mobile-native
 * detail sheet up from the bottom. One open at a time.
 */
export const VariantC = ({ schedule, units, paces }: { schedule: RenderedPlan; units: 'mi' | 'km'; paces?: TrainingPaces }) => {
    const [active, setActive] = useState<RenderedWorkout | null>(null);
    const close = () => setActive(null);
    const pace = active ? paceFor(active, paces, units) : null;

    return (
        <>
            <div className="space-y-5">
                {schedule.weeks.map((week) => (
                    <Sheet key={week.weekNumber} week={week} isCurrent={weeksIsCurrent(week)} row={(w) => (
                        <Row key={w.dayOfWeek} workout={w} units={units} isToday={false} revealed={active === w} onToggle={() => setActive(active === w ? null : w)} />
                    )} />
                ))}
            </div>

            {active &&
                createPortal(
                    <div className="fixed inset-0 z-[100]">
                        <div className="fixed inset-0 bg-ink/40" onClick={close} />
                        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-rule shadow-2xl animate-sheet-slide-up px-5 py-6">
                            <div className="w-10 h-1.5 bg-pencil/50 mx-auto mb-4 rounded-full" />
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="font-data text-[11px] uppercase tracking-wider text-pencil mb-1">
                                        {new Date(active.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </div>
                                    <h4 className="font-display font-semibold uppercase text-2xl text-ink leading-none">
                                        {formatPlanLabel(active.title, units)}
                                    </h4>
                                </div>
                                {active.distance && (
                                    <div className="font-data text-2xl font-bold text-ink flex-none">
                                        {typeof active.distance === 'number'
                                            ? `${active.distance} ${units}`
                                            : `${active.distance[0]}–${active.distance[1]} ${units}`}
                                    </div>
                                )}
                            </div>
                            {pace && (
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: pace.color }} />
                                    <span className="font-data text-xl font-bold" style={{ color: pace.color }}>{pace.text}</span>
                                    <span className="text-xs uppercase tracking-wider text-pencil font-data">{pace.zone}</span>
                                </div>
                            )}
                            {active.description && (
                                <p className="mt-4 text-sm text-ink leading-relaxed border-t border-rule pt-4">
                                    {formatPlanLabel(active.description, units)}
                                </p>
                            )}
                            <button
                                onClick={close}
                                className="mt-6 w-full py-3 bg-marker hover:bg-marker/90 text-paper font-data font-bold uppercase tracking-[0.12em] text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};
