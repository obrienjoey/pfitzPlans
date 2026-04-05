export interface PlanInfo {
    id: string;
    name: string;
    type: 'Marathon' | 'Half Marathon' | '5K' | '10K';
    weeks: number;
    path: string;
}

export const AVAILABLE_PLANS: PlanInfo[] = [
    {
        id: 'frr_5k_01',
        name: 'FRR 5K Sched 1 / 30–40 mi',
        type: '5K',
        weeks: 14,
        path: 'plans/frr_5k_01.yaml'
    },
    {
        id: 'frr_5k_02',
        name: 'FRR 5K Sched 2 / 45–55 mi',
        type: '5K',
        weeks: 14,
        path: 'plans/frr_5k_02.yaml'
    },
    {
        id: 'frr_5k_03',
        name: 'FRR 5K Sched 3 / 60–70 mi',
        type: '5K',
        weeks: 14,
        path: 'plans/frr_5k_03.yaml'
    },
    {
        id: 'frr_8k10k_01',
        name: 'FRR 8K-10K Sched 1 / 30–42 mi',
        type: '10K',
        weeks: 14,
        path: 'plans/frr_8k10k_01.yaml'
    },
    {
        id: 'frr_8k10k_02',
        name: 'FRR 8K-10K Sched 2 / 38–57 mi',
        type: '10K',
        weeks: 14,
        path: 'plans/frr_8k10k_02.yaml'
    },
    {
        id: 'frr_8k10k_03',
        name: 'FRR 8K-10K Sched 3 / 43–76 mi',
        type: '10K',
        weeks: 14,
        path: 'plans/frr_8k10k_03.yaml'
    },
    {
        id: 'pfitz_half_12_63',
        name: 'Pfitzinger 12 wk / 47–63 mi',
        type: 'Half Marathon',
        weeks: 12,
        path: 'plans/pfitz_half_12_63.yaml'
    },
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
];
