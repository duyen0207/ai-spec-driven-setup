#!/usr/bin/env node
/**
 * ai-spec-driven-setup CLI — dependency-free, Node 18+.
 * Config-driven: reads spec.config.json at the repo root; NO hard-coded domains/statuses/repos.
 *
 * Runs INSIDE a generated <app>-specs/ repo (the folder that owns spec.config.json):
 *
 *   node tools/specs.mjs feature  --id <DOMAIN-slug> [--title "…"] [--status live] [--origin reverse-engineered]
 *        Scaffold a FEATURE directly. Used by reverse-spec (documenting existing production code).
 *        Features are otherwise created only by `archive` folding an Add-change — the only two writers of specs/features/.
 *
 *   node tools/specs.mjs change   --task <CODE> --type <Add|Modify|…> --brief <slug> --target <FEATURE-ID>[,<ID>] [--title "…"]
 *        Scaffold a CHANGE folder specs/changes/<Type>-<CODE>-<brief>/ (no timestamp; date is stamped on archive).
 *
 *   node tools/specs.mjs index    Regenerate SPECS_INDEX.md + CHANGES_INDEX.md.
 *   node tools/specs.mjs check    Validate every feature + change against schema + spec.config.json (CI gate).
 *   node tools/specs.mjs archive <change-folder>    FOLD a shipped change into its target feature(s):
 *        Add → create the feature; Modify/Remove/Fix → patch it (match by "### Requirement: <title>");
 *        prepend a history line, drop the pending_changes pointer, move the change to specs/changes/archive/<date>-<name>/.
 *
 * The delta format (borrowed from OpenSpec) makes fold DETERMINISTIC — no AI needed to merge.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ------------------------------------------------------------------ tiny utils
const C = { red: s => `\x1b[31m${s}\x1b[0m`, green: s => `\x1b[32m${s}\x1b[0m`, yellow: s => `\x1b[33m${s}\x1b[0m`, dim: s => `\x1b[2m${s}\x1b[0m`, bold: s => `\x1b[1m${s}\x1b[0m` };
const die = (msg) => { console.error(C.red('✗ ' + msg)); process.exit(1); };
const ok = (msg) => console.log(C.green('✓ ') + msg);
const info = (msg) => console.log(C.dim('  ' + msg));
const today = () => new Date().toISOString().slice(0, 10);

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2); const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}
const flag = (v) => (v && v !== true ? String(v).trim() : null);
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');

// ------------------------------------------------------------------ repo root + config
function findRepoRoot(start) {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, 'spec.config.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) die('no spec.config.json found (walked up from cwd) — run inside a generated <app>-specs/ repo');
    dir = parent;
  }
}
const REPO_ROOT = findRepoRoot(process.cwd());
const CONFIG = (() => { try { return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'spec.config.json'), 'utf8')); } catch (e) { die('cannot read spec.config.json: ' + e.message); } })();
const SPECS = path.join(REPO_ROOT, 'specs');
const FEATURES = path.join(SPECS, 'features');
const CHANGES = path.join(SPECS, 'changes');
const ARCHIVE = path.join(CHANGES, 'archive');
const FTPL = path.join(REPO_ROOT, 'skeletons');   // fill-in blanks the engine scaffolds new features/changes from

const cfg = {
  app: CONFIG.app || 'app-unknown',
  domains: CONFIG.domains || [],
  statuses: CONFIG.statuses || ['draft', 'live'],
  shipped: CONFIG.shipped_statuses || ['implemented', 'live'],
  changeTypes: CONFIG.change_types || ['Add', 'Modify', 'Remove', 'Fix'],
  changeStatuses: CONFIG.change_statuses || ['proposed', 'in-dev', 'merged', 'archived'],
  stages: CONFIG.acceptance_stages || ['happy', 'full'],
  repos: CONFIG.repos || [],
};

// ------------------------------------------------------------------ tiny YAML (flat scalars + single-level "- item" lists + inline [])
function parseMeta(text) {
  const o = {}; let listKey = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '');
    if (!line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) { o[listKey].push(strip(item[1])); continue; }
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m; const val = rawVal.trim();
    if (val === '' || val === '[]') { o[key] = []; listKey = val === '' ? key : null; }
    else { o[key] = strip(val); listKey = null; }
  }
  return o;
}
function strip(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v === 'null' || v === '~') return null;
  if (v === 'true') return true; if (v === 'false') return false;
  return v;
}

// ------------------------------------------------------------------ markdown section helpers (fold engine)
const headerRe = (lvl) => new RegExp('^#{' + lvl + '}[ \\t]+(.+?)[ \\t]*$');
/** Split text at headings of EXACTLY `level`. Returns { pre, secs:[{title, body}] }; body INCLUDES its heading line. */
function split(text, level) {
  const re = headerRe(level); const pre = []; const secs = []; let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(re);
    if (m) { if (cur) secs.push(cur); cur = { title: m[1].trim(), lines: [line] }; }
    else if (cur) cur.lines.push(line);
    else pre.push(line);
  }
  if (cur) secs.push(cur);
  return { pre: pre.join('\n'), secs: secs.map(s => ({ title: s.title, body: s.lines.join('\n') })) };
}
const reqTitle = (t) => t.replace(/^Requirement:\s*/i, '').trim();
/** Shift every heading in `text` shallower by `by` levels (min 1). '###' → '##'. */
function promote(text, by = 1) {
  return text.split(/\r?\n/).map(l => {
    const m = l.match(/^(#{1,6})([ \t].*)?$/);
    if (!m) return l;
    return '#'.repeat(Math.max(1, m[1].length - by)) + (m[2] || '');
  }).join('\n');
}
/** Apply added/modified/removed requirement ops to a feature spec's "## Requirements" section. */
function foldRequirements(specText, ops) {
  const top = split(specText, 2);
  let idx = top.secs.findIndex(s => s.title.toLowerCase() === 'requirements');
  if (idx === -1) { top.secs.push({ title: 'Requirements', body: '## Requirements' }); idx = top.secs.length - 1; }
  const inner = split(top.secs[idx].body, 3);
  let reqs = inner.secs.filter(s => /^requirement:/i.test(s.title));
  const others = inner.secs.filter(s => !/^requirement:/i.test(s.title));
  for (const t of ops.removed) reqs = reqs.filter(r => reqTitle(r.title) !== t);
  for (const m of ops.modified) {
    const i = reqs.findIndex(r => reqTitle(r.title) === m.title);
    if (i >= 0) reqs[i] = { title: 'Requirement: ' + m.title, body: m.block };
    else reqs.push({ title: 'Requirement: ' + m.title, body: m.block });
  }
  for (const b of ops.added) reqs.push({ title: '', body: b });
  const parts = [inner.pre.trimEnd(), ...others.map(o => o.body.trimEnd()), ...reqs.map(r => r.body.trimEnd())].filter(Boolean);
  top.secs[idx] = { title: 'Requirements', body: parts.join('\n\n') };
  return [top.pre.trimEnd(), ...top.secs.map(s => s.body.trimEnd())].filter(Boolean).join('\n\n') + '\n';
}
/** From a change's "## <FEATURE-ID>" block body, collect delta ops for a Modify/Remove/Fix fold. */
function collectDelta(blockBody) {
  const ops = { added: [], modified: [], removed: [] };
  for (const sub of split(blockBody, 3).secs) {
    const k = /^(added|modified|removed) requirements/i.exec(sub.title);
    if (!k) continue;
    const kind = k[1].toLowerCase();
    for (const r of split(sub.body, 4).secs) {
      if (!/^requirement:/i.test(r.title)) continue;
      const title = reqTitle(r.title);
      if (kind === 'removed') ops.removed.push(title);
      else if (kind === 'added') ops.added.push(promote(r.body, 1));
      else ops.modified.push({ title, block: promote(r.body, 1) });
    }
  }
  return ops;
}

// ------------------------------------------------------------------ meta.yml line surgery (controlled template format)
const setScalar = (yaml, key, val) => yaml.replace(new RegExp('^(' + key + '):[ \\t]*.*$', 'm'), `$1: ${val}`);
function prependListItem(yaml, key, itemText) {
  const lines = yaml.split(/\r?\n/); const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(new RegExp('^(' + key + '):[ \\t]*(\\[\\])?[ \\t]*$'));
    if (m) { out.push(`${key}:`); out.push(`  - ${itemText}`); continue; }
    out.push(l);
  }
  return out.join('\n');
}
function removeListItemsContaining(yaml, key, substr) {
  const lines = yaml.split(/\r?\n/); const out = []; let inKey = false;
  for (const l of lines) {
    if (new RegExp('^' + key + ':').test(l)) { inKey = true; out.push(l); continue; }
    if (inKey) {
      if (/^\s+-\s+/.test(l)) { if (l.includes(substr)) continue; out.push(l); continue; }
      if (l.trim() === '') { out.push(l); continue; }
      inKey = false; // a new key started
    }
    out.push(l);
  }
  return out.join('\n');
}

// ------------------------------------------------------------------ fs helpers
const listDirs = (base) => fs.existsSync(base) ? fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name) : [];
function fillTemplate(tplPath, vars) {
  let t = fs.readFileSync(tplPath, 'utf8');
  return t.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
}
function domainOf(id) {
  if (!cfg.domains.length) return null;
  const d = cfg.domains.find(dm => id === dm || id.startsWith(dm + '-'));
  return d || null;
}

// ------------------------------------------------------------------ command: feature (scaffold a feature directly)
function cmdFeature(args) {
  const id = flag(args.id); if (!id) die('--id <DOMAIN-slug> is required');
  const domain = domainOf(id);
  if (cfg.domains.length && !domain) die(`--id must start with a domain from spec.config.json.domains: ${cfg.domains.join(', ')}`);
  const dir = path.join(FEATURES, id);
  if (fs.existsSync(dir)) die(`feature already exists: specs/features/${id}`);
  const status = flag(args.status) || (cfg.statuses.includes('live') ? 'live' : cfg.statuses[cfg.statuses.length - 1]);
  const origin = flag(args.origin) || 'reverse-engineered';
  const stage = flag(args.stage) || cfg.stages[0];
  const title = flag(args.title) || (domain ? id.slice(domain.length + 1) : id).replace(/-/g, ' ');
  const vars = {
    ID: id, APP: cfg.app, DOMAIN: domain ?? 'null', TITLE: title, STATUS: status,
    ORIGIN: origin, ACCEPTANCE_STAGE: stage, DATE: today(),
    HISTORY_FIRST: `${today()} · — · created (${origin})`,
  };
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ['meta.yml', 'spec.md', 'acceptance.md', 'tech.md']) fs.writeFileSync(path.join(dir, f), fillTemplate(path.join(FTPL, 'feature', f), vars));
  ok(`created feature ${C.bold('specs/features/' + id)}`);
  info('next: author spec.md → acceptance.md → tech.md per rules/, then `node tools/specs.mjs check`');
}

// ------------------------------------------------------------------ command: change (scaffold a change folder)
function cmdChange(args) {
  const task = flag(args.task); if (!task) die('--task <CODE> is required (e.g. --task OPCS-142)');
  const type = flag(args.type); if (!type) die(`--type is required, one of: ${cfg.changeTypes.join(', ')}`);
  if (!cfg.changeTypes.includes(type)) die(`--type must be one of: ${cfg.changeTypes.join(', ')}`);
  const brief = slugify(flag(args.brief) || ''); if (!brief) die('--brief <slug> is required (short kebab summary)');
  const targets = (flag(args.target) || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!targets.length) die('--target <FEATURE-ID>[,<ID>] is required (the feature(s) this change folds into)');
  const title = flag(args.title) || `${type} ${task}`;
  const name = `${type}-${task}-${brief}`;
  const dir = path.join(CHANGES, name);
  if (fs.existsSync(dir)) die(`change already exists: specs/changes/${name}`);
  const vars = {
    TASK: task, TYPE: type, TITLE: title, STAGE: cfg.stages[0], DATE: today(),
    TARGETS_YAML: targets.map(t => `  - ${t}`).join('\n'),
    FEATURE_BLOCKS: targets.map(t => `## ${t}\n\n<!-- ${type === 'Add' ? 'New feature: author the FULL spec at H3 (### Problem / context, ### Requirements with #### Requirement:, …). fold promotes to H2.' : 'Delta: use ### ADDED/MODIFIED/REMOVED Requirements, each with #### Requirement: <title> (match live titles for MODIFIED/REMOVED).'} -->\n`).join('\n'),
  };
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ['meta.yml', 'spec.md', 'acceptance.md']) fs.writeFileSync(path.join(dir, f), fillTemplate(path.join(FTPL, 'change', f), vars));
  ok(`created change ${C.bold('specs/changes/' + name)}`);
  info(`type=${type} → ${type === 'Add' ? 'fold will CREATE the target feature(s)' : 'fold will PATCH the target feature(s)'}`);
  info('next: fill the delta/spec + Out-of-scope fence, then hand THIS folder (not the feature spec) to the coding AI');
}

// ------------------------------------------------------------------ command: archive (fold a change into its feature(s))
function cmdArchive(args) {
  const name = args._[1]; if (!name) die('usage: archive <change-folder-name>');
  const dir = path.join(CHANGES, name);
  if (!fs.existsSync(dir)) die(`no such change: specs/changes/${name}`);
  const meta = parseMeta(fs.readFileSync(path.join(dir, 'meta.yml'), 'utf8'));
  const type = meta.type; const task = meta.task_code || '—'; const stage = meta.acceptance_stage || cfg.stages[0];
  const targets = meta.depends_on || [];
  if (!targets.length) die('change meta.depends_on is empty — nothing to fold into');
  const changeSpec = fs.readFileSync(path.join(dir, 'spec.md'), 'utf8');
  const blocks = Object.fromEntries(split(changeSpec, 2).secs.map(s => [s.title.trim(), s.body]));
  const changeAcc = fs.existsSync(path.join(dir, 'acceptance.md')) ? fs.readFileSync(path.join(dir, 'acceptance.md'), 'utf8') : '';

  for (const t of targets) {
    const block = blocks[t];
    if (block === undefined) die(`change spec.md has no "## ${t}" block for target ${t}`);
    const featDir = path.join(FEATURES, t);
    const exists = fs.existsSync(featDir);
    if (type === 'Add') {
      if (exists) die(`type=Add but feature already exists: ${t} (use Modify)`);
      createFeatureFromAdd(t, block, changeAcc, meta);
      ok(`folded → CREATED feature ${C.bold('specs/features/' + t)}`);
    } else {
      if (!exists) die(`type=${type} but feature does not exist: ${t} (use Add to create it)`);
      patchFeature(t, block, changeAcc, meta);
      ok(`folded → patched feature ${C.bold('specs/features/' + t)}`);
    }
  }

  // move change → archive/<date>-<name>, mark archived
  fs.mkdirSync(ARCHIVE, { recursive: true });
  const dest = path.join(ARCHIVE, `${today()}-${name}`);
  let m = fs.readFileSync(path.join(dir, 'meta.yml'), 'utf8');
  m = setScalar(m, 'status', 'archived');
  fs.writeFileSync(path.join(dir, 'meta.yml'), m);
  fs.renameSync(dir, dest);
  ok(`archived change → ${C.bold('specs/changes/archive/' + today() + '-' + name)}`);
  info('run `node tools/specs.mjs index` then `check`');
}

function createFeatureFromAdd(id, block, changeAcc, cmeta) {
  const domain = domainOf(id);
  if (cfg.domains.length && !domain) die(`Add target ${id} does not start with a known domain (${cfg.domains.join(', ')})`);
  const inner = block.split(/\r?\n/).slice(1).join('\n'); // drop the "## <ID>" line
  const body = promote(inner, 1).trim(); // H3 sections → H2
  const status = cfg.statuses.includes('live') ? 'live' : cfg.statuses[cfg.statuses.length - 1];
  const vars = {
    ID: id, APP: cfg.app, DOMAIN: domain ?? 'null', TITLE: cmeta.title || id, STATUS: status,
    ORIGIN: 'folded', ACCEPTANCE_STAGE: cmeta.acceptance_stage || cfg.stages[0], DATE: today(),
    HISTORY_FIRST: `${today()} · ${cmeta.task_code || '—'} · folded from change (created)`,
  };
  fs.mkdirSync(path.join(FEATURES, id), { recursive: true });
  const metaText = fillTemplate(path.join(FTPL, 'feature', 'meta.yml'), vars);
  fs.writeFileSync(path.join(FEATURES, id, 'meta.yml'), metaText);
  fs.writeFileSync(path.join(FEATURES, id, 'spec.md'), `# ${id} — spec\n\n${body}\n`);
  fs.writeFileSync(path.join(FEATURES, id, 'acceptance.md'), changeAcc || fillTemplate(path.join(FTPL, 'feature', 'acceptance.md'), vars));
  fs.writeFileSync(path.join(FEATURES, id, 'tech.md'), fillTemplate(path.join(FTPL, 'feature', 'tech.md'), vars));
}

function patchFeature(id, block, changeAcc, cmeta) {
  const featDir = path.join(FEATURES, id);
  const specPath = path.join(featDir, 'spec.md');
  const ops = collectDelta(block);
  fs.writeFileSync(specPath, foldRequirements(fs.readFileSync(specPath, 'utf8'), ops));
  // fold acceptance: append this change's criteria with provenance
  if (changeAcc.trim()) {
    const accPath = path.join(featDir, 'acceptance.md');
    const cur = fs.existsSync(accPath) ? fs.readFileSync(accPath, 'utf8').trimEnd() : `# ${id} — acceptance`;
    fs.writeFileSync(accPath, `${cur}\n\n## From ${cmeta.task_code || '—'} (${today()})\n\n${changeAcc.trim()}\n`);
  }
  // meta: prepend history, bump updated, set acceptance_stage, drop pending_changes pointer, keep shipped status
  let m = fs.readFileSync(path.join(featDir, 'meta.yml'), 'utf8');
  m = prependListItem(m, 'history', `"${today()} · ${cmeta.task_code || '—'} · ${(cmeta.title || 'change').replace(/"/g, "'")}"`);
  m = setScalar(m, 'updated', today());
  if (cmeta.acceptance_stage) {
    // a feature is only as mature as its least-mature part → take the LOWER stage (by config order)
    const cur = parseMeta(m).acceptance_stage;
    const iCur = cfg.stages.indexOf(cur), iNew = cfg.stages.indexOf(cmeta.acceptance_stage);
    const merged = (iCur >= 0 && iNew >= 0) ? cfg.stages[Math.min(iCur, iNew)] : cmeta.acceptance_stage;
    m = setScalar(m, 'acceptance_stage', merged);
  }
  if (cmeta.task_code) m = removeListItemsContaining(m, 'pending_changes', cmeta.task_code);
  fs.writeFileSync(path.join(featDir, 'meta.yml'), m);
}

// ------------------------------------------------------------------ command: index
function cmdIndex() {
  // features
  let out = '# SPECS_INDEX\n\n> Auto-generated by `node tools/specs.mjs index`. Do not hand-edit.\n\n';
  const byDomain = {};
  for (const id of listDirs(FEATURES)) {
    const meta = parseMeta(fs.readFileSync(path.join(FEATURES, id, 'meta.yml'), 'utf8'));
    (byDomain[meta.domain || '(no domain)'] ??= []).push({ ...meta, id });
  }
  let total = 0;
  for (const d of Object.keys(byDomain).sort()) {
    out += `## ${d}\n\n| ID | Title | Status | Stage | Origin | Ticket |\n|---|---|---|---|---|---|\n`;
    for (const m of byDomain[d].sort((a, b) => a.id.localeCompare(b.id))) {
      const ticket = m.jira_url ? `[link](${m.jira_url})` : '—';
      out += `| [${m.id}](specs/features/${m.id}/spec.md) | ${m.title || ''} | \`${m.status || '?'}\` | \`${m.acceptance_stage || '?'}\` | ${m.origin || '?'} | ${ticket} |\n`;
      total++;
    }
    out += '\n';
  }
  if (!total) out += '_No features yet._\n\n';
  fs.writeFileSync(path.join(REPO_ROOT, 'SPECS_INDEX.md'), out);

  // changes
  let co = '# CHANGES_INDEX\n\n> Auto-generated by `node tools/specs.mjs index`. Do not hand-edit.\n\n## Active\n\n';
  co += '| Change | Task | Type | Status | Stage | Targets |\n|---|---|---|---|---|---|\n';
  let active = 0;
  for (const name of listDirs(CHANGES)) {
    if (name === 'archive') continue;
    const meta = parseMeta(fs.readFileSync(path.join(CHANGES, name, 'meta.yml'), 'utf8'));
    co += `| [${name}](specs/changes/${name}/) | ${meta.task_code || '?'} | \`${meta.type || '?'}\` | \`${meta.status || '?'}\` | \`${meta.acceptance_stage || '?'}\` | ${(meta.depends_on || []).join(', ')} |\n`;
    active++;
  }
  if (!active) co += '| _none_ | | | | | |\n';
  const archived = listDirs(ARCHIVE);
  co += `\n## Archived (${archived.length})\n\n`;
  for (const name of archived.sort().reverse()) co += `- \`${name}\`\n`;
  if (!archived.length) co += '_none yet._\n';
  fs.writeFileSync(path.join(REPO_ROOT, 'CHANGES_INDEX.md'), co);

  ok(`SPECS_INDEX.md (${total} feature[s]) + CHANGES_INDEX.md (${active} active, ${archived.length} archived) regenerated`);
}

// ------------------------------------------------------------------ command: check
function cmdCheck() {
  let errors = 0, warns = 0;
  const err = (id, m) => { console.log(C.red(`  ✗ ${id}: ${m}`)); errors++; };
  const warn = (id, m) => { console.log(C.yellow(`  ⚠ ${id}: ${m}`)); warns++; };

  const featureIds = new Set(listDirs(FEATURES));
  // features
  for (const id of featureIds) {
    const dir = path.join(FEATURES, id);
    const mp = path.join(dir, 'meta.yml');
    if (!fs.existsSync(mp)) { err(id, 'missing meta.yml'); continue; }
    const meta = parseMeta(fs.readFileSync(mp, 'utf8'));
    for (const k of ['id', 'app', 'title', 'status', 'origin', 'acceptance_stage']) if (meta[k] === undefined || meta[k] === '') err(id, `missing required field: ${k}`);
    if (meta.id && meta.id !== id) err(id, `meta.id (${meta.id}) != folder name`);
    if (meta.app && meta.app !== cfg.app) warn(id, `meta.app (${meta.app}) != spec.config app (${cfg.app})`);
    if (cfg.domains.length) {
      if (meta.domain && !cfg.domains.includes(meta.domain)) err(id, `unknown domain: ${meta.domain}`);
      if (meta.domain && id !== meta.domain && !id.startsWith(meta.domain + '-')) err(id, `id must start with its DOMAIN (${meta.domain}-…)`);
    }
    if (meta.status && !cfg.statuses.includes(meta.status)) err(id, `unknown status: ${meta.status}`);
    if (meta.origin && !['reverse-engineered', 'folded', 'spec-first'].includes(meta.origin)) err(id, `origin must be reverse-engineered|folded|spec-first: ${meta.origin}`);
    if (meta.acceptance_stage && !cfg.stages.includes(meta.acceptance_stage)) err(id, `unknown acceptance_stage: ${meta.acceptance_stage}`);
    for (const f of ['spec.md', 'acceptance.md', 'tech.md']) if (!fs.existsSync(path.join(dir, f))) err(id, `missing ${f}`);
    for (const g of (meta.related_code || [])) {
      if (cfg.repos.length && !new RegExp('^(' + cfg.repos.join('|') + '):').test(String(g))) err(id, `related_code must be "<repo>:<path>" with repo in [${cfg.repos.join(', ')}]: ${g}`);
    }
    for (const h of (meta.history || [])) if (!/^\d{4}-\d{2}-\d{2} /.test(String(h))) err(id, `history entry must start with a date: ${h}`);
    // GUARDRAIL: shipped feature should have full acceptance
    if (cfg.shipped.includes(meta.status) && meta.acceptance_stage === cfg.stages[0]) warn(id, `status '${meta.status}' is shipped but acceptance_stage is still '${meta.acceptance_stage}' — write the full acceptance`);
  }
  // changes
  for (const name of listDirs(CHANGES)) {
    if (name === 'archive') continue;
    const dir = path.join(CHANGES, name);
    const mp = path.join(dir, 'meta.yml');
    if (!fs.existsSync(mp)) { err(name, 'missing meta.yml'); continue; }
    const meta = parseMeta(fs.readFileSync(mp, 'utf8'));
    for (const k of ['task_code', 'type', 'title', 'status', 'acceptance_stage', 'depends_on']) if (meta[k] === undefined || meta[k] === '' || (Array.isArray(meta[k]) && !meta[k].length)) err(name, `missing required field: ${k}`);
    if (meta.type && !cfg.changeTypes.includes(meta.type)) err(name, `unknown type: ${meta.type}`);
    if (meta.status && !cfg.changeStatuses.includes(meta.status)) err(name, `unknown status: ${meta.status}`);
    if (meta.acceptance_stage && !cfg.stages.includes(meta.acceptance_stage)) err(name, `unknown acceptance_stage: ${meta.acceptance_stage}`);
    for (const f of ['spec.md', 'acceptance.md']) if (!fs.existsSync(path.join(dir, f))) err(name, `missing ${f}`);
    const spec = fs.existsSync(path.join(dir, 'spec.md')) ? fs.readFileSync(path.join(dir, 'spec.md'), 'utf8') : '';
    const blocks = new Set(split(spec, 2).secs.map(s => s.title.trim()));
    for (const t of (meta.depends_on || [])) {
      if (!blocks.has(t)) err(name, `spec.md missing a "## ${t}" block for target ${t}`);
      if (meta.type === 'Add' && featureIds.has(t)) warn(name, `type=Add but target ${t} already exists — fold will fail (use Modify)`);
      if (meta.type && meta.type !== 'Add' && !featureIds.has(t)) warn(name, `type=${meta.type} but target ${t} does not exist yet`);
    }
  }

  if (warns) console.log(C.yellow(`  ${warns} warning(s)`));
  if (errors) die(`${errors} problem(s) found`);
  ok(`all specs valid${warns ? C.yellow(` (${warns} warning[s])`) : ''}`);
}

// ------------------------------------------------------------------ main
const HELP = `ai-spec-driven-setup CLI — reads spec.config.json (config-driven)

  feature  --id <DOMAIN-slug> [--title "…"] [--status s] [--origin reverse-engineered|folded|spec-first] [--stage happy|full]
             scaffold a feature directly (reverse-spec path)
  change   --task <CODE> --type <${cfg.changeTypes.join('|')}> --brief <slug> --target <FEATURE-ID>[,<ID>] [--title "…"]
             scaffold a change folder specs/changes/<Type>-<CODE>-<brief>/
  index    regenerate SPECS_INDEX.md + CHANGES_INDEX.md
  check    validate features + changes against schema + spec.config.json
  archive <change-folder>   fold a shipped change into its target feature(s) (deterministic), then move it to changes/archive/
`;

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
try {
  switch (cmd) {
    case 'feature': case 'new-feature': cmdFeature(args); break;
    case 'change': case 'new-change': cmdChange(args); break;
    case 'index': cmdIndex(); break;
    case 'check': cmdCheck(); break;
    case 'archive': case 'fold': cmdArchive(args); break;
    default: console.log(HELP); if (cmd) die(`unknown command: ${cmd}`);
  }
} catch (e) { die(e.message || String(e)); }
