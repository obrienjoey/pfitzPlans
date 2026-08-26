import { type PlanInfo } from '../config';
import { usePlanStore } from '../store/usePlanStore';
import clsx from 'clsx';

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
        <div className="space-y-8 w-full max-w-2xl mx-auto mb-10">
            {sortedEntries.map(([type, plans]) => (
                <section key={type} className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">{type}</h3>
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
                                            : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-white transition-colors pr-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 opacity-80" aria-hidden="true">
                                                    <path d="M3.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0v-4.392l1.657-.348a6.449 6.449 0 014.271.572 7.948 7.948 0 005.965.524l2.078-.64A.75.75 0 0018 12.25v-8.5a.75.75 0 00-.904-.734l-2.38.501a7.25 7.25 0 01-4.186-.363l-.502-.2a8.75 8.75 0 00-5.053-.439l-1.475.31V2.75z" />
                                                </svg>
                                                <span>{plan.name}</span>
                                            </div>
                                            {isSelected && (
                                                <div className="bg-rose-500 flex-shrink-0 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                            {plan.description}
                                        </p>
                                    </div>
                                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400/80 mt-3 uppercase tracking-wider">
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
