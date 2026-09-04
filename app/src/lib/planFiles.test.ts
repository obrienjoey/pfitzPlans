import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import type { Plan } from '../types';
import { getPaceZone } from './paceCalculator';
import schema from '../data/plan-schema.json';

const plansDir = path.resolve(import.meta.dirname, '../../public/plans');

const planFiles = fs
    .readdirSync(plansDir)
    .filter((f) => f.endsWith('.yaml'))
    .sort();

const loadPlans = (): Array<{ file: string; plan: Plan }> =>
    planFiles.map((file) => {
        const text = fs.readFileSync(path.join(plansDir, file), 'utf8');
        // Same loader settings as the runtime parser (parser.ts).
        return { file, plan: yaml.load(text, { schema: yaml.JSON_SCHEMA }) as Plan };
    });

describe('plan files', () => {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    it('every plan file is schema-valid', () => {
        for (const { file, plan } of loadPlans()) {
            const valid = validate(plan);
            expect(valid, `${file}: ${ajv.errorsText(validate.errors)}`).toBe(true);
        }
    });

    it('workout titles never embed their instructions after " with "', () => {
        for (const { file, plan } of loadPlans()) {
            for (const week of plan.schedule) {
                for (const workout of week.workouts) {
                    expect(
                        workout.title.includes(' with '),
                        `${file}: move the detail into \`description\` instead of the title: "${workout.title}"`
                    ).toBe(false);
                }
            }
        }
    });

    // Workouts that need a pace target carry an explicit `zone:` field.
    // Only rest days, tune-ups, goal races and dress rehearsals are exempt.
    it('every trainable workout has an explicit zone', () => {
        const EXEMPT = /rest|cross-train|tune-up|goal race|dress rehearsal/i;
        for (const { file, plan } of loadPlans()) {
            for (const week of plan.schedule) {
                for (const workout of week.workouts) {
                    if (EXEMPT.test(workout.title)) continue;
                    expect(
                        workout.zone,
                        `${file}: "${workout.title}" needs an explicit \`zone:\` (run scripts/backfill-zones.js --write)`
                    ).toBeTruthy();
                }
            }
        }
    });

    // The materialized `zone:` fields must agree with the getPaceZone()
    // title heuristic, so old clients and new plans resolve identically.
    it('explicit zones agree with the getPaceZone() fallback', () => {
        for (const { file, plan } of loadPlans()) {
            for (const week of plan.schedule) {
                for (const workout of week.workouts) {
                    if (!workout.zone) continue;
                    expect(
                        getPaceZone(workout.title, workout.tags),
                        `${file}: "${workout.title}" zones as ${workout.zone} but heuristic says ${getPaceZone(workout.title, workout.tags)}`
                    ).toBe(workout.zone);
                }
            }
        }
    });
});