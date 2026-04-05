import { AVAILABLE_PLANS, type PlanInfo } from '../config';
import clsx from 'clsx';

export const PlanSelector = ({ selectedId, onSelect }: { selectedId: string, onSelect: (id: string) => void }) => {
    // Group by type
    const groupedPlans = AVAILABLE_PLANS.reduce((acc, plan) => {
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
        <div className="space-y-8 w-full max-w-2xl mx-auto mb-10">
            {sortedEntries.map(([type, plans]) => (
                <section key={type} className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-300 border-b border-slate-700 pb-2">{type}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plans.map(plan => {
                            const isSelected = selectedId === plan.id;
                            return (
                                <button
                                    key={plan.id}
                                    onClick={() => onSelect(plan.id)}
                                    className={clsx(
                                        "p-5 rounded-2xl border text-left transition-all duration-200 group flex flex-col justify-between h-full min-h-[120px]",
                                        isSelected
                                            ? "bg-rose-500/10 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                            : "bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                                    )}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-lg text-slate-100 group-hover:text-white transition-colors pr-2">
                                                🏃 {plan.name}
                                            </div>
                                            {isSelected && (
                                                <div className="bg-rose-500 flex-shrink-0 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-slate-400 mt-2">
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
