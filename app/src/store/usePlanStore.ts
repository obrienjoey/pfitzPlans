import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlanState {
    selectedPlanId: string;
    raceDate: Date | null;
    units: 'mi' | 'km';
    goalTime: string;
    setPlanId: (id: string) => void;
    setRaceDate: (date: Date | null) => void;
    setUnits: (units: 'mi' | 'km') => void;
    setGoalTime: (time: string) => void;
}

export const usePlanStore = create<PlanState>()(
    persist(
        (set) => ({
            selectedPlanId: 'pfitz_18_55_4th',
            raceDate: null,
            units: 'km',
            goalTime: '4:00:00',
            setPlanId: (id) => set({ selectedPlanId: id }),
            setRaceDate: (date) => set({ raceDate: date }),
            setUnits: (units) => set({ units }),
            setGoalTime: (time) => set({ goalTime: time }),
        }),
        {
            name: 'plan-storage',
            // Custom serialization for Date
            partialize: (state) => ({
                selectedPlanId: state.selectedPlanId,
                raceDate: state.raceDate ? state.raceDate.toISOString() : null,
                units: state.units,
                goalTime: state.goalTime,
            }),
            onRehydrateStorage: () => (state) => {
                if (state && typeof state.raceDate === 'string') {
                    state.raceDate = new Date(state.raceDate);
                }
            },
            merge: (persistedState: any, currentState) => {
                return {
                    ...currentState,
                    ...persistedState,
                    raceDate: persistedState.raceDate ? new Date(persistedState.raceDate) : null,
                }
            }
        }
    )
);
