import yaml from 'js-yaml';
import Ajv from 'ajv';
import type { Plan } from '../types';
import schema from '../data/plan-schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

export const fetchPlan = async (path: string): Promise<Plan> => {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load plan from ${path}`);
    }
    const text = await response.text();
    const data = yaml.load(text) as unknown;

    const valid = validate(data);
    if (!valid) {
        console.error('Validation errors:', validate.errors);
        throw new Error(`Plan validation failed: ${ajv.errorsText(validate.errors)}`);
    }

    return data as unknown as Plan;
};
