import { type PlanInfo } from '../config';
import { usePlanStore } from '../store/usePlanStore';
import clsx from 'clsx';

/** Plan descriptions arrive as '"Title" from "Book" by Author' — drop the quote marks. */
const cleanDescription = (text: string | undefined): string => text?.replace(/"/g, '') ?? '';

/** Strip the book citation prefix so only the runner-facing differentiator remains.
 *  "5K Schedule 1: ... by Pete D. Pfitzinger and Philip Latter. This schedule is for
 *   runners who ..." → "This schedule is for runners who ..." (initials-safe). */
const summarize = (text: string | undefined): string => {
    const clean = cleanDescription(text).trim();
    if (!clean) return '';
    // Prefer the base-fitness sentence — it differentiates plans, the citation doesn't.
    const sentences = clean.split(/(?<=\.)\s+/);
    const base = sentences.find(s => /this schedule is for runners who/i.test(s));
    if (base) {
        const t = base.trim();
        return t.length > 140 ? `${t.slice(0, 137).trim()}…` : t;
    }
    // No fitness sentence (e.g. marathon entries): fall back to the book source.
    const source = clean.match(/from\s+(.+?)\s+by\s+(.+?)\s*\.?\s*$/i);
    if (source) {
        const book = source[1].trim();
        const author = source[2].trim();
        const t = `From ${book} — ${author}`;
        return t.length > 140 ? `${t.slice(0, 137).trim()}…` : t;
    }
    const first = sentences[0]?.trim() ?? clean;
    return first.length > 140 ? `${first.slice(0, 137).trim()}…` : first;
};

/** Shorten manifest titles now the section header already carries the distance.
 *  "Faster Road Racing: 5K Schedule 1" (under 5K) → "Schedule 1"
 *  "Pfitzinger/Douglas: Up to 55 miles per week, 18-week schedule" → "Up to 55 mi/wk" */
const shortTitle = (name: string): string => {
    let title = name;
    const colon = title.indexOf(':');
    if (title.toLowerCase().startsWith('faster road racing:') && colon >= 0) {
        title = title.slice(colon + 1).trim();
        // Strip leading distance ("5K ", "8K-10K ") now redundant with the group header
        title = title.replace(/^(5K|8K-10K|10K)\s+/i, '').trim();
    } else if (colon >= 0) {
        title = title.slice(colon + 1).trim();
    }
    title = title
        .replace(/miles per week/gi, 'mi/wk')
        .replace(/miles/gi, 'mi')
        .replace(/,\s*\d+-week schedule/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    return title || name;
};

export const PlanSelector = ({ selectedId, onSelect }: { selectedId: string, onSelect: (id: string) => void }) => {
    const { availablePlans } = usePlanStore();

    // Group by type
    const groupedPlans = availablePlans.reduce((acc, plan) => {
        if (!acc[plan.type]) acc[plan.type] = [];
        acc[plan.type].push(plan);
        return acc;
    }, {} as Record<string, PlanInfo[]>);

    // Order groups by race distance
    const typeOrder = ['5K', '10K', 'Half Marathon', 'Marathon'];
    const sortedEntries = Object.entries(groupedPlans).sort(
        ([a], [b]) => (typeOrder.indexOf(a) ?? 99) - (typeOrder.indexOf(b) ?? 99)
    );

    return (
        <div className="space-y-8 w-full mb-10">
            {sortedEntries.map(([type, plans]) => (
                <section key={type} className="space-y-3">
                    <h3 className="font-display font-semibold uppercase text-2xl text-ink tracking-wide">{type}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {plans.map(plan => {
                            const isSelected = selectedId === plan.id;
                            return (
                                <button
                                    key={plan.id}
                                    onClick={() => onSelect(plan.id)}
                                    aria-pressed={isSelected}
                                    className={clsx(
                                        "p-4 sm:p-5 border text-left transition-colors group flex flex-col justify-between h-full min-h-[112px] bg-card",
                                        isSelected
                                            ? "border-marker ring-1 ring-marker/40 shadow-[inset_3px_0_0_rgb(var(--marker))]"
                                            : "border-rule hover:border-pencil/60"
                                    )}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-1.5 gap-2">
                                            <span className={clsx(
                                                "font-display font-semibold uppercase text-xl leading-tight pr-1",
                                                isSelected ? "text-marker" : "text-ink group-hover:text-marker"
                                            )}>
                                                {shortTitle(plan.name)}
                                            </span>
                                            {isSelected && (
                                                <span aria-hidden="true" className="font-data flex-shrink-0 text-marker text-sm font-bold">✓</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-pencil mt-1 leading-relaxed line-clamp-2">
                                            {summarize(plan.description)}
                                        </p>
                                    </div>
                                    <div className="font-data text-xs font-semibold text-pencil mt-3 uppercase tracking-[0.12em]">
                                        {plan.weeks} weeks
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
};
