import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import type { Plan } from '../types';
import schema from '../data/plan-schema.json';

const plansDir = path.resolve(import.meta.dirname, '../../public/plans');

const planFiles = fs
    .readdirSync(plansDir)
    .filter((f) => f.endsWith('.yaml'))
    .sort();

const loadPlans = (): Array<{ file: string; plan: Plan }> =>
    planFiles.map((file) => {
        const text = fs.readFileSync(path.join(plansDir, file), 'utf8');
        return { file, plan: yaml.load(text) as Plan };
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
});