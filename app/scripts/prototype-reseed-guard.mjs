// PROTOTYPE (THROWAWAY) — snapshot-with-guard reseed model.
// Answers: "does guard-based TRUST of the persisted schedule feel right, and does it
// cover same-config reload vs. config-change fresh start?" This is a simplified, faithful
// model of the store flow in src/store/usePlanStore.ts + src/components/PlanViewer.tsx.
//
// NOT production code. State lives in memory (persistence is the thing being checked).
//
// Run:  node scripts/prototype-reseed-guard.mjs     (from app/)

// --- storage (stands in for localStorage 'plan-storage') ---
const store = { currentSchedule: null, workoutLogs: {} };

// --- current configuration (what the user has selected) ---
const config = { planId: null, raceDateKey: null };

const dateKey = (d) => (d ? d.toISOString().slice(0, 10) : null);

// Canonical generator — stands in for calculateSchedule(). Always returns a fresh,
// UNMODIFIED schedule. (A real canonical must not be reused across calls.)
function canonical(planId, raceDateKey) {
  return {
    fp: { planId, raceDateKey },
    sourceVersion: 1,
    weeks: [{ id: 'w0', workouts: [{ t: 'RunA' }, { t: 'RunB' }, { t: 'RunC' }] }],
  };
}

const hydrate = () => (store.currentSchedule ? structuredClone(store.currentSchedule) : null);

// THE GUARD. Decide which schedule the UI shows: TRUST the persisted schedule when its
// fingerprint matches the current config, otherwise regenerate (fresh start).
// Pure — does not mutate storage.
function resolve() {
  const persisted = hydrate();
  const match = persisted && persisted.fp
    && persisted.fp.planId === config.planId
    && persisted.fp.raceDateKey === config.raceDateKey;
  if (match) {
    return { source: 'trusted-persisted', schedule: persisted };
  }
  return { source: 'regenerated-canonical', schedule: canonical(config.planId, config.raceDateKey) };
}

const persist = (s) => { store.currentSchedule = structuredClone(s); };

// Mirrors PlanViewer's load effect — but under the guard it must NOT blindly setSchedule(null)
// or setSchedule(canonical); it asks resolve() first and only commits a fresh canonical on mismatch.
function onLoad() {
  const r = resolve();
  if (r.source === 'regenerated-canonical') persist(r.schedule); // write canonical once so later same-config reloads trust it
  return r;
}

function reorder(a, b) {
  const r = resolve(); // same-config reload path: trusts persisted (reordered) schedule
  const w = r.schedule.weeks[0].workouts;
  const tmp = w[a]; w[a] = w[b]; w[b] = tmp;
  persist(r.schedule); // persist mutation, fingerprint unchanged
  return r.schedule;
}

const changePlan = (id) => { config.planId = id; };
const changeDate = (key) => { config.raceDateKey = key; };

let step = 0;
function dump(label) {
  const r = resolve();
  step += 1;
  console.log(`--- ${step}. ${label} ---`);
  console.log('  config           :', JSON.stringify(config));
  console.log('  persisted fp     :', store.currentSchedule ? JSON.stringify(store.currentSchedule.fp) : '(none)');
  console.log('  resolve source   :', r.source);
  console.log('  shown order      :', r.schedule.weeks[0].workouts.map((x) => x.t).join(' -> '), '\n');
}

console.log('PROTOTYPE — snapshot-with-guard reseed model\n');

changePlan('P'); changeDate('2026-12-01');
dump('first load — nothing persisted');
reorder(0, 2);
dump('user reorders RunA <-> RunC (persisted, fp unchanged)');
onLoad();
dump('SAME-CONFIG reload -> trusted, reorder restored');
changeDate('2027-03-01');
onLoad();
dump('RACE DATE CHANGED -> regenerated canonical (fresh start, reorder gone)');
changePlan('Q');
onLoad();
dump('PLAN CHANGED -> regenerated canonical (fresh start)');
changePlan('P'); changeDate('2026-12-01');
onLoad();
dump('back to original config after a fresh start -> persisted fp differs, so again canonical');
reorder(0, 1);
onLoad();
dump('reorder under P/2026-12-01 then same-config reload binds to it');

console.log('Verdict from prototype: guard-based trust preserves reorders across same-config reloads and\n' +
  'cleanly resets on config change — matching the chosen destination.');
