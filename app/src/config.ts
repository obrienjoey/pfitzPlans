export interface PlanInfo {
    id: string;
    name: string;
    type: 'Marathon' | 'Half Marathon';
    weeks: number;
    path: string;
}

export const AVAILABLE_PLANS: PlanInfo[] = [
    {
        id: 'pfitz_18_55_4th',
        name: 'Pfitzinger 18 wk / Up to 55 mi',
        type: 'Marathon',
        weeks: 18,
        path: 'plans/pfitz_18_55_4th.yaml'
    },
    {
        id: 'pfitz_18_70_4th',
        name: 'Pfitzinger 18 wk / 55–70 mi',
        type: 'Marathon',
        weeks: 18,
        path: 'plans/pfitz_18_70_4th.yaml'
    },
    {
        id: 'pfitz_half_12_63',
        name: 'Pfitzinger 12 wk / 47–63 mi',
        type: 'Half Marathon',
        weeks: 12,
        path: 'plans/pfitz_half_12_63.yaml'
    }
];
