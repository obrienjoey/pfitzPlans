export type Distance = number | [number, number];

export interface Workout {
    title: string;
    description?: string;
    distance?: Distance;
    tags?: string[];
}

export interface Week {
    description?: string;
    distance?: number;
    workouts: Workout[];
}

export type PlanType =
    | "Base"
    | "Multiple Distances"
    | "Marathon"
    | "Half Marathon"
    | "5K"
    | "10K"
    | "15k/10m"
    | "50K"
    | "100K"
    | "100M";

export interface Plan {
    id: string;
    name: string;
    description?: string;
    type: PlanType;
    units: "mi" | "km";
    source?: string;
    schedule: Week[];
}

export interface RenderedWorkout extends Workout {
    date: Date;
    dayOfWeek: number; // 0-6
}

export interface RenderedWeek {
    weekStart: Date;
    weekEnd: Date;
    weeksToGoal: number;
    weekNumber: number;
    originalWeek: Week;
    workouts: RenderedWorkout[];
}

export interface RenderedPlan {
    originalPlan: Plan;
    raceDate: Date;
    startDate: Date;
    weeks: RenderedWeek[];
}
