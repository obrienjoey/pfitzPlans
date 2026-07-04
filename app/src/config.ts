export interface PlanInfo {
    id: string;
    name: string;
    description: string;
    type: 'Marathon' | 'Half Marathon' | '5K' | '10K';
    weeks: number;
    path: string;
}

export const AVAILABLE_PLANS: PlanInfo[] = [
    {
        id: 'frr_5k_01',
        name: 'FRR 5K Sched 1 / 30–40 mi',
        description: 'Faster Road Racing Schedule 1: 14 weeks, peak volume 40 miles/week. Designed for runners comfortable with 30 miles per week, focusing on speed and endurance for a competitive 5K.',
        type: '5K',
        weeks: 14,
        path: 'plans/frr_5k_01.yaml'
    },
    {
        id: 'frr_5k_02',
        name: 'FRR 5K Sched 2 / 45–55 mi',
        description: 'Faster Road Racing Schedule 2: 14 weeks, peak volume 55 miles/week. For intermediate runners with a base of 40-45 miles per week, looking to elevate their 5K performance.',
        type: '5K',
        weeks: 14,
        path: 'plans/frr_5k_02.yaml'
    },
    {
        id: 'frr_5k_03',
        name: 'FRR 5K Sched 3 / 60–70 mi',
        description: 'Faster Road Racing Schedule 3: 14 weeks, peak volume 70 miles/week. For advanced runners looking to optimize performance through high-mileage training.',
        type: '5K',
        weeks: 14,
        path: 'plans/frr_5k_03.yaml'
    },
    {
        id: 'frr_8k10k_01',
        name: 'FRR 8K-10K Sched 1 / 30–42 mi',
        description: 'Faster Road Racing Schedule 1: 14 weeks, peak volume 42 miles/week. Focuses on lactate threshold and endurance for 8K/10K distances, targeting a base of 30-42 miles.',
        type: '10K',
        weeks: 14,
        path: 'plans/frr_8k10k_01.yaml'
    },
    {
        id: 'frr_8k10k_02',
        name: 'FRR 8K-10K Sched 2 / 38–57 mi',
        description: 'Faster Road Racing Schedule 2: 14 weeks, peak volume 57 miles/week. For intermediate runners training 38-57 miles per week looking to improve 8K/10K performance.',
        type: '10K',
        weeks: 14,
        path: 'plans/frr_8k10k_02.yaml'
    },
    {
        id: 'frr_8k10k_03',
        name: 'FRR 8K-10K Sched 3 / 43–76 mi',
        description: 'Faster Road Racing Schedule 3: 14 weeks, peak volume 76 miles/week. High-mileage, high-intensity training plan (43-76 miles/week) for advanced 8K/10K runners.',
        type: '10K',
        weeks: 14,
        path: 'plans/frr_8k10k_03.yaml'
    },
    {
        id: 'pfitz_half_12_63',
        name: 'Pfitzinger 12 wk / 47–63 mi',
        description: 'Pete Pfitzinger\'s 12-week half marathon schedule peaking at 63 miles/week. Designed for runners looking to build strong endurance and a robust lactate threshold.',
        type: 'Half Marathon',
        weeks: 12,
        path: 'plans/pfitz_half_12_63.yaml'
    },
    {
        id: 'pfitz_18_55_4th',
        name: 'Pfitzinger 18 wk / Up to 55 mi',
        description: 'Pete Pfitzinger\'s classic marathon schedule peaking at 55 miles/week. 18-week plan focusing on long runs, medium-long runs, and structured lactate threshold workouts.',
        type: 'Marathon',
        weeks: 18,
        path: 'plans/pfitz_18_55_4th.yaml'
    },
    {
        id: 'pfitz_18_70_4th',
        name: 'Pfitzinger 18 wk / 55–70 mi',
        description: 'Pete Pfitzinger\'s advanced 18-week marathon plan peaking at 70 miles/week. Designed for experienced runners looking to push their endurance boundaries.',
        type: 'Marathon',
        weeks: 18,
        path: 'plans/pfitz_18_70_4th.yaml'
    },
];
