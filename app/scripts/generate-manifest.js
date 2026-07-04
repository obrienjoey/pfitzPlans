import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plansDir = path.join(__dirname, '../public/plans');
const manifestPath = path.join(plansDir, 'manifest.json');

try {
    const files = fs.readdirSync(plansDir);
    const plans = [];

    for (const file of files) {
        if ((file.endsWith('.yaml') || file.endsWith('.yml')) && file !== 'manifest.json') {
            const filePath = path.join(plansDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const data = yaml.load(content);
            
            if (data && data.id) {
                plans.push({
                    id: data.id,
                    name: data.name,
                    description: data.description || '',
                    type: data.type,
                    weeks: data.schedule ? data.schedule.length : 0,
                    path: `plans/${file}`
                });
            }
        }
    }

    // Sort plans by ID to be deterministic
    plans.sort((a, b) => a.id.localeCompare(b.id));

    fs.writeFileSync(manifestPath, JSON.stringify(plans, null, 2), 'utf8');
    console.log(`Generated manifest with ${plans.length} plans at ${manifestPath}`);
} catch (err) {
    console.error('Error generating manifest:', err);
    process.exit(1);
}
