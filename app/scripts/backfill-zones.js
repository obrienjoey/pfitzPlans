import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const plansDir = path.join(__dirname, '../public/plans');

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Title → zone mapping. Mirrors the fallback branches of getPaceZone() in
 * src/lib/paceCalculator.ts (explicit-zone branch excluded) so the
 * materialized `zone:` field always agrees with the heuristic.
 * Returns a schema-valid zone or null (rest / tune-up / goal race / unknown).
 */
export const zoneForTitle = (title) => {
    // Strip YAML quoting that survives into the raw line (e.g. - title: "VO₂max …").
    const t = norm(title.trim().replace(/^["']|["']$/g, ''));
    if (t.includes('tune-up')) return null;
    if (t.includes('half marathon goal race')) return null;
    if (t.startsWith('goal marathon')) return 'Marathon';
    if (t.includes('goal race')) return null;
    if (t.startsWith('marathon-pace')) return 'Marathon';
    if (t.startsWith('lt') || t.startsWith('lactate threshold')) return 'Lactate Threshold';
    if (t.startsWith('recovery') || t.startsWith('2 recovery runs')) return 'Recovery';
    if (t.startsWith('general aerobic') || t.startsWith('gen-aerobic')) return 'General Aerobic';
    if (
        t.startsWith('endurance') ||
        t.startsWith('long run') ||
        t.startsWith('med-long run') ||
        t.startsWith('progression long run')
    ) return 'Long Run';
    if (t.startsWith('vo2max') || t.startsWith('vo₂max') || t.startsWith('speed') || t.startsWith('race pace')) return 'VO2 Max';
    return null;
};

const KEY_RE = /^\s*[A-Za-z_][A-Za-z0-9_-]*:(\s|$)/;
const ITEM_RE = /^\s*- /;
const indentOf = (line) => line.match(/^\s*/)[0].length;

const run = (write) => {
    const files = fs.readdirSync(plansDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml')).sort();
    let totalInserted = 0;
    let totalAlready = 0;
    const allUnzoned = [];

    for (const file of files) {
        const fp = path.join(plansDir, file);
        const raw = fs.readFileSync(fp, 'utf8');
        const eol = raw.includes('\r\n') ? '\r\n' : '\n';
        const lines = raw.split(eol);
        const out = [];
        let inserted = 0;
        let already = 0;
        const unzoned = [];

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const m = line.match(/^(\s*)- title:(?: (.*))?$/);
            if (!m) {
                out.push(line);
                i++;
                continue;
            }
            const dashIndent = m[1];

            // Accumulate the title value. Two shapes exist in the plans:
            //   - title: General aerobic {8:13}     (flow plain scalar + continuations)
            //   - title: |-                         (block scalar — title is the indented block)
            //       Lactate threshold
            //       {9:14} ...
            let titleText = m[2] ?? '';
            let j = i + 1;
            if (/^[|>][+-]?[0-9]?\s*(#.*)?$/.test(titleText)) {
                titleText = '';
                while (j < lines.length) {
                    const nx = lines[j];
                    if (/^\s*$/.test(nx)) break;
                    if (indentOf(nx) <= dashIndent.length) break;
                    titleText += (titleText ? ' ' : '') + nx.trim();
                    j++;
                }
            } else {
                // plain-multiline title continuations (see loop below)
                while (j < lines.length) {
                    const nx = lines[j];
                    if (/^\s*$/.test(nx) || /^\s*#/.test(nx)) break;
                    if (ITEM_RE.test(nx)) break;
                    if (/^---/.test(nx) || /^\.\.\./.test(nx)) break;
                    if (KEY_RE.test(nx)) break;
                    titleText += ' ' + nx.trim();
                    j++;
                }
            }
            for (let k = i; k < j; k++) out.push(lines[k]);

            // Scan the sibling mapping for an existing zone:, skipping block-scalar
            // bodies (description: |- …) so prose can never false-positive.
            let hasZone = false;
            let k = j;
            while (k < lines.length) {
                const lk = lines[k];
                if (/^\s*$/.test(lk) || /^\s*#/.test(lk)) {
                    k++;
                    continue;
                }
                if (indentOf(lk) <= dashIndent.length) break;
                const km = lk.match(/^\s*([A-Za-z_][A-Za-z0-9_-]*):(.*)$/);
                if (km) {
                    if (km[1] === 'zone') {
                        hasZone = true;
                        break;
                    }
                    if (/[|>]\s*(#.*)?$/.test(km[2])) {
                        const keyIndent = indentOf(lk);
                        k++;
                        while (k < lines.length && (/^\s*$/.test(lines[k]) || indentOf(lines[k]) > keyIndent)) k++;
                        continue;
                    }
                }
                k++;
            }

            const zone = zoneForTitle(titleText);
            if (hasZone) {
                already++;
            } else if (zone) {
                out.push(`${dashIndent}  zone: ${zone}`);
                inserted++;
            } else {
                unzoned.push(titleText.slice(0, 70));
            }
            i = j;
        }

        if (write && inserted > 0) fs.writeFileSync(fp, out.join(eol));
        console.log(`${file}: +${inserted} zones, ${already} already zoned, ${unzoned.length} unzoned`);
        for (const u of unzoned) console.log(`    unzoned: ${u}`);
        totalInserted += inserted;
        totalAlready += already;
        allUnzoned.push(...unzoned.map((u) => `${file}: ${u}`));
    }

    console.log(`\nTotal: +${totalInserted} inserted, ${totalAlready} already zoned`);
    if (!write && totalInserted > 0) console.log('Dry run — pass --write to apply.');
    return { totalInserted, unzoned: allUnzoned };
};

const write = process.argv.includes('--write');
run(write);
