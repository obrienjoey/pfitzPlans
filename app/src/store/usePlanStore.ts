import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlanState {
    selectedPlanId: string;
    raceDate: Date | null;
    units: 'mi' | 'km';
    setPlanId: (id: string) => void;
    setRaceDate: (date: Date | null) => void;
    setUnits: (units: 'mi' | 'km') => void;
}

export const usePlanStore = create<PlanState>()(
    persist(
        (set) => ({
            selectedPlanId: 'pfitz_18_55_4th',
            raceDate: null,
            units: 'km',
            setPlanId: (id) => set({ selectedPlanId: id }),
            setRaceDate: (date) => set({ raceDate: date }),
            setUnits: (units) => set({ units }),
        }),
        {
            name: 'plan-storage',
            // Custom serialization for Date
            partialize: (state) => ({
                selectedPlanId: state.selectedPlanId,
                raceDate: state.raceDate ? state.raceDate.toISOString() : null,
                units: state.units,
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
