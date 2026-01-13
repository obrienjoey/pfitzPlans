import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { usePlanStore } from '../store/usePlanStore';
import { fetchPlan } from '../lib/parser';
import { calculateSchedule } from '../lib/calculator';
import { AVAILABLE_PLANS } from '../config';
import type { Plan, RenderedPlan } from '../types';
import { WeekCard } from './WeekCard';

export const PlanViewer = () => {
    const { selectedPlanId, raceDate } = usePlanStore();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [schedule, setSchedule] = useState<RenderedPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const planInfo = AVAILABLE_PLANS.find(p => p.id === selectedPlanId);
            if (!planInfo) return;

            setLoading(true);
            setError(null);
            try {
                const data = await fetchPlan(planInfo.path);
                setPlan(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load plan. Ensure the plan file exists in /public/plans.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedPlanId]);

    useEffect(() => {
        if (plan && raceDate) {
            setSchedule(calculateSchedule(plan, raceDate));
        }
    }, [plan, raceDate]);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-rose-500 rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="p-6 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl text-center">
            Error: {error}
        </div>
    );

    if (!schedule) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4">
                <div>
                    <div className="inline-block px-2 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider rounded mb-2">
                        Running Plan
                    </div>
                    <h2 className="text-3xl font-bold text-slate-100">{schedule.originalPlan.name}</h2>
                    <p className="text-slate-400 mt-2 max-w-2xl leading-relaxed">{schedule.originalPlan.description}</p>
                </div>
                <div className="text-left md:text-right bg-slate-900/50 p-4 rounded-xl border border-slate-800 min-w-[140px]">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Race Date</div>
                    {raceDate && (
                        <div className="flex flex-col md:items-end">
                            <div className="text-2xl font-bold text-rose-400 leading-none mb-1">
                                {format(raceDate, 'MMMM d')}
                            </div>
                            <div className="text-lg text-slate-100 font-medium leading-none mb-1">
                                {format(raceDate, 'yyyy')}
                            </div>
                            <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                                {format(raceDate, 'EEEE')}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {schedule.weeks.map(week => (
                    <WeekCard key={week.weeksToGoal} week={week} />
                ))}
            </div>
        </div>
    );
};
