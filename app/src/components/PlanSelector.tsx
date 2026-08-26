import { type PlanInfo } from '../config';
import { usePlanStore } from '../store/usePlanStore';
import clsx from 'clsx';

/** Plan descriptions arrive as '"Title" from "Book" by Author' — drop the quote marks. */
const cleanDescription = (text: string | undefined): string => text?.replace(/"/g, '') ?? '';

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
                                        "p-4 sm:p-5 border text-left transition-colors group flex flex-col justify-between h-full min-h-[120px] bg-card",
                                        isSelected
                                            ? "border-marker ring-1 ring-marker/40 bg-marker/5"
                                            : "border-rule hover:border-pencil/60"
                                    )}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-1.5 gap-2">
                                            <span className={clsx(
                                                "font-display font-semibold uppercase text-xl leading-tight pr-1",
                                                isSelected ? "text-marker" : "text-ink group-hover:text-marker"
                                            )}>
                                                {plan.name}
                                            </span>
                                            {isSelected && (
                                                <span aria-hidden="true" className="font-data flex-shrink-0 text-marker text-sm font-bold">✓</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-pencil mt-1 leading-relaxed line-clamp-3">
                                            {cleanDescription(plan.description)}
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
