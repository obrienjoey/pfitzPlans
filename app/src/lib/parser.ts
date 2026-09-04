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
    // JSON_SCHEMA disables js-yaml's custom type coercions (e.g. !!js/function),
    // so a crafted plan file can only ever produce plain JSON-compatible data.
    const data = yaml.load(text, { schema: yaml.JSON_SCHEMA }) as unknown;

    const valid = validate(data);
    if (!valid) {
        console.error('Validation errors:', validate.errors);
        throw new Error(`Plan validation failed: ${ajv.errorsText(validate.errors)}`);
    }

    return data as unknown as Plan;
};
