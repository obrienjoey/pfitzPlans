import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { RenderedPlan } from '../../types';
import { computeTodayState } from './todayShared';
import { VariantA } from './variantA';
import { VariantB } from './variantB';
import { VariantC } from './variantC';

/**
 * PROTOTYPE — throwaway UI answering: "How should today-awareness + race
 * countdown surface in the schedule view?" Three variants on the existing
 * route, switchable via the `?today=` URL param and a floating bottom bar:
 *
 *   A — Ambient chip   (countdown stat beside Race Date; no new surfaces)
 *   B — Today strip    (sticky elevated bar: workout + progress + T-minus)
 *   C — Timeline rail  (you-are-here marker across a week rail)
 *
 * Dev-only; mounted from PlanViewer. The existing DayCard today-ring stays
 * untouched as the shared baseline across all variants.
 */
const TODAY_VARIANT_META = [
    { key: 'A', name: 'Ambient countdown chip' },
    { key: 'B', name: 'Sticky today strip' },
    { key: 'C', name: 'Timeline rail' },
] as const;

interface TodayPrototypeProps {
    schedule: RenderedPlan;
    units: 'mi' | 'km';
}

export const TodayPrototype = ({ schedule, units }: TodayPrototypeProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const state = computeTodayState(schedule, units);

    let variant = (searchParams.get('today') || 'A').toUpperCase();
    if (!TODAY_VARIANT_META.some((m) => m.key === variant)) variant = 'A';

    const select = (key: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('today', key);
        setSearchParams(next, { replace: true });
    };

    // Floating switcher — ←/→ keys cycle unless typing in a field.
    const idx = Math.max(0, TODAY_VARIANT_META.findIndex((m) => m.key === variant));
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                select(TODAY_VARIANT_META[(idx - 1 + TODAY_VARIANT_META.length) % TODAY_VARIANT_META.length].key);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                select(TODAY_VARIANT_META[(idx + 1) % TODAY_VARIANT_META.length].key);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            {variant === 'A' && <VariantA state={state} />}
            {variant === 'B' && <VariantB state={state} />}
            {variant === 'C' && <VariantC state={state} totalWeeks={schedule.weeks.length} />}

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-slate-900/95 text-white rounded-full px-2 py-1.5 shadow-2xl border border-emerald-500/40">
                <button
                    onClick={() => select(TODAY_VARIANT_META[(idx - 1 + TODAY_VARIANT_META.length) % TODAY_VARIANT_META.length].key)}
                    className="px-2 py-1 rounded-full hover:bg-slate-700 text-lg leading-none"
                    title="Previous variant"
                >
                    ‹
                </button>
                <span className="px-2 text-xs font-bold whitespace-nowrap">
                    {variant} — {TODAY_VARIANT_META[idx].name}
                </span>
                <button
                    onClick={() => select(TODAY_VARIANT_META[(idx + 1) % TODAY_VARIANT_META.length].key)}
                    className="px-2 py-1 rounded-full hover:bg-slate-700 text-lg leading-none"
                    title="Next variant"
                >
                    ›
                </button>
            </div>
        </>
    );
};
