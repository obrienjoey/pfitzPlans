import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { addDays, startOfDay, format } from 'date-fns';
import yaml from 'js-yaml';
import type { Plan } from '../../src/types';
import {
    ANCHOR_STRATEGIES,
    describeAlignment,
    findGoalPlacement
} from './raceAnchor';

/**
 * PROTOTYPE TUI — throwaway shell driving raceAnchor.ts.
 * Run with: npm run proto:race-anchor
 *
 *   [a]/[b]  strategy (swap / shift)
 *   [1..7]   race weekday (Sun..Sat)
 *   [<-][->] nudge race date by one day
 *   [p]      cycle plan fixture
 *   [q]      quit
 */

const B = '\x1b[1m';
const D = '\x1b[2m';
const R = '\x1b[31m';
const G = '\x1b[32m';
const Y = '\x1b[33m';
const X = '\x1b[0m';

interface Fixture {
    name: string;
    plan: Plan;
}

const syntheticPlan: Plan = {
    id: 'synthetic_3wk',
    name: 'Synthetic 3-week plan (goal race Sunday)',
    description: 'Fixture',
    type: 'Marathon',
    units: 'mi',
    schedule: Array.from({ length: 3 }, (_, w) => ({
        workouts: [
            { title: 'Rest' },
            { title: 'Mid-week LT run', distance: 7 },
            { title: 'General aerobic', distance: 6 },
            { title: 'Rest' },
            { title: 'General aerobic', distance: 5 },
            { title: 'Long run' as string, distance: w === 2 ? undefined : 16 - w * 2 },
            w === 2
                ? { title: 'Goal Marathon', tags: ['Race'] }
                : { title: 'Long run', distance: 18 - w * 2 }
        ]
    }))
};

const loadYamlPlan = (file: string): Plan =>
    yaml.load(readFileSync(join(process.cwd(), 'public', 'plans', file), 'utf8')) as unknown as Plan;

const FIXTURES: Fixture[] = [
    { name: 'synthetic 3-week', plan: syntheticPlan },
    { name: 'pfitz_18_55_4th.yaml', plan: loadYamlPlan('pfitz_18_55_4th.yaml') },
    { name: 'frr_5k_01.yaml', plan: loadYamlPlan('frr_5k_01.yaml') }
];

const WEEKDAY_SLOTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // plan index 0..6, weeks start Monday

interface State {
    strategyIdx: number;
    raceDate: Date;
    fixtureIdx: number;
    showAllWeeks: boolean;
}

const state: State = {
    strategyIdx: 1, // start on shift — the candidate
    raceDate: startOfDay(new Date(2026, 11, 19)), // Sat Dec 19 2026
    fixtureIdx: 0,
    showAllWeeks: false
};

const renderFrame = () => {
    const fixture = FIXTURES[state.fixtureIdx];
    const strategy = ANCHOR_STRATEGIES[state.strategyIdx];
    const rendered = strategy.render(fixture.plan, state.raceDate);
    const alignment = describeAlignment(rendered);
    const goal = findGoalPlacement(fixture.plan);

    const lines: string[] = [];
    lines.push('');
    lines.push(`${B}RACE-ANCHOR PROTOTYPE${X} ${D}— throwaway; answers how the grid re-anchors to non-Sunday races${X}`);
    lines.push('');
    lines.push(`${B}STRATEGY${X}  [a|b] ${state.strategyIdx === 0 ? G : Y}${strategy.id}${X} ${D}${strategy.label}${X}`);
    lines.push(`${B}RACE DAY${X}   ${format(state.raceDate, 'EEE yyyy-MM-dd')}  ${D}[1..7] weekday · [<-][->] nudge day${X}`);
    lines.push(
        `${B}FIXTURE${X}    ${fixture.name} (${fixture.plan.schedule.length} wks, goal @ W${goal.weekIndex + 1} ${WEEKDAY_SLOTS[goal.dayIndex]} slot)  ${D}[p] cycle${X}`
    );
    lines.push(`${B}PROGRAM START${X} ${format(rendered.startDate, 'EEE yyyy-MM-dd')}`);
    lines.push('');
    lines.push('');
    lines.push(
        `${B}WK   WEEK SPAN              LONG RUN       LR→RACE   NOTES${X}`
    );

    const visible = state.showAllWeeks ? alignment : alignment.slice(-8);
    if (!state.showAllWeeks && alignment.length > 8) {
        lines.push(`${D}     … ${alignment.length - 8} earlier weeks hidden — [s] show all${X}`);
    }

    for (const wk of visible) {
        const lrCell = wk.longRunLabel ?? D + '—' + X;
        const gapCell =
            wk.longRunDaysBeforeRace == null
                ? D + '—' + X
                : wk.longRunDaysBeforeRace < 0
                  ? D + `${wk.longRunDaysBeforeRace}d post?` + X
                  : wk.longRunMisaligned
                    ? `${R}${wk.longRunDaysBeforeRace}d ⚠${X}`
                    : `${G}${wk.longRunDaysBeforeRace}d${X}`;
        const notes: string[] = [];
        if (wk.hasGoalRace) notes.push(`${B}GOAL RACE${X}`);
        if (wk.postRaceDays > 0) notes.push(`${Y}${wk.postRaceDays}d after race${X}`);
        if (wk.longRunMisaligned) notes.push(`${R}LR off-rhythm${X}`);

        lines.push(
            `W${String(wk.weekNumber).padStart(2)}   ${wk.startDow} ${wk.spanLabel.padEnd(17)}  ${String(lrCell).padEnd(14)} ${gapCell.padEnd(9)}  ${notes.join(', ')}`
        );
    }

    lines.push('');
    lines.push(
        `${B}[a]${X} swap  ${B}[b]${X} shift  ${B}[1-7]${X} race Sun..Sat  ${B}[←]${X}/${B}[→]${X} ±day  ${B}[p]${X} fixture  ${B}[s]${X} all weeks  ${B}[q]${X} quit`
    );
    lines.push('');

    console.clear();
    console.log(lines.join('\n'));
};

const setRaceDow = (dow: number) => {
    // Move race date onto `dow` within its Mon-started week so nudging stays stable.
    const monday = addDays(state.raceDate, -((state.raceDate.getDay() + 6) % 7));
    state.raceDate = addDays(monday, (dow + 6) % 7);
};

const onKeystroke = (buf: Buffer): boolean => {
    const s = buf.toString();
    if (s === '\x1b[C') return (state.raceDate = addDays(state.raceDate, 1)), true;
    if (s === '\x1b[D') return (state.raceDate = addDays(state.raceDate, -1)), true;
    switch (s) {
        case 'a': state.strategyIdx = 0; return true;
        case 'b': state.strategyIdx = 1; return true;
        case 'p': state.fixtureIdx = (state.fixtureIdx + 1) % FIXTURES.length; return true;
        case 's': state.showAllWeeks = !state.showAllWeeks; return true;
        case 'q':
        case '\x03': return false;
        default:
            if (/^[1-7]$/.test(s)) { setRaceDow(parseInt(s, 10) - 1); return true; } // keys are 1-based, dow is 0-based
            return true;
    }
};

const quit = () => {
    console.clear();
    process.exit(0);
};

if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (chunk: Buffer) => {
        if (!onKeystroke(chunk)) quit();
        renderFrame();
    });
    renderFrame();
} else {
    // Headless smoke mode — apply piped keys, one frame per key, then exit.
    let input = '';
    process.stdin.on('data', (c: Buffer) => (input += c.toString()));
    process.stdin.on('end', () => {
        for (const ch of input.replace(/\r?\n/g, '')) {
            const key = ch === '<' ? '\x1b[D' : ch === '>' ? '\x1b[C' : ch;
            if (!onKeystroke(Buffer.from(key))) quit();
            renderFrame();
        }
        if (input.length === 0) renderFrame();
    });
}
