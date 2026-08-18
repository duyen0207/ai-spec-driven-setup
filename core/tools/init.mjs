#!/usr/bin/env node
/**
 * ai-spec-driven-setup — mechanical bootstrap bake. Dependency-free, Node 18+.
 * Generates a self-contained <app>-specs/ repo from a template + the core engine, in ONE command.
 * The `init-spec-repo` skill gathers inputs (app, language, domains, repos) then calls this; you can also run it directly.
 *
 *   node <toolkit>/core/tools/init.mjs --app checkout [--template default] [--language en]
 *        [--dest <dir>] [--domains A,B,C] [--repos web,api] [--with-seed] [--force]
 *
 * Produces <dest>/app-<app>-specs/ (self-contained: `cd` in and `node tools/specs.mjs check` — no toolkit needed).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const C = { red: s => `\x1b[31m${s}\x1b[0m`, green: s => `\x1b[32m${s}\x1b[0m`, dim: s => `\x1b[2m${s}\x1b[0m`, bold: s => `\x1b[1m${s}\x1b[0m` };
const die = (m) => { console.error(C.red('✗ ' + m)); process.exit(1); };
const ok = (m) => console.log(C.green('✓ ') + m);

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) out[k] = true; else { out[k] = n; i++; } }
    else out._.push(a);
  }
  return out;
}
const list = (v) => (v && v !== true ? String(v).split(',').map(s => s.trim()).filter(Boolean) : null);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLKIT = path.resolve(__dirname, '..', '..');           // core/tools -> toolkit root
const CORE = path.join(TOOLKIT, 'core');
const args = parseArgs(process.argv.slice(2));

let appRaw = args.app && args.app !== true ? String(args.app).trim().toLowerCase() : null;
if (!appRaw) die('--app <name> is required');
const app = appRaw.startsWith('app-') ? appRaw : `app-${appRaw}`;
if (!/^app-[a-z0-9-]+$/.test(app)) die('--app must be kebab-case (e.g. --app checkout → app-checkout)');

const template = (args.template && args.template !== true) ? String(args.template) : 'default';
const templateDir = path.join(TOOLKIT, 'templates', template);
if (!fs.existsSync(templateDir)) die(`no such template: ${template} (see templates/catalog.yml)`);

const destBase = (args.dest && args.dest !== true) ? path.resolve(String(args.dest)) : process.cwd();
const outDir = path.join(destBase, `${app}-specs`);
if (fs.existsSync(outDir) && !args.force) die(`${outDir} already exists (use --force to overwrite)`);
if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

const cp = (src, dst) => { if (fs.existsSync(src)) fs.cpSync(src, dst, { recursive: true }); };
fs.mkdirSync(outDir, { recursive: true });

// 1) template body (rules, skeletons, .claude, tools) + AGENTS.md; empty specs unless --with-seed
cp(path.join(templateDir, 'rules'), path.join(outDir, 'rules'));
cp(path.join(templateDir, 'skeletons'), path.join(outDir, 'skeletons'));
cp(path.join(templateDir, '.claude'), path.join(outDir, '.claude'));
cp(path.join(templateDir, 'tools'), path.join(outDir, 'tools'));
fs.mkdirSync(path.join(outDir, 'specs', 'features'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'specs', 'changes'), { recursive: true });
cp(path.join(templateDir, 'specs', 'AGENTS.md'), path.join(outDir, 'specs', 'AGENTS.md'));
if (args['with-seed']) {
  cp(path.join(templateDir, 'specs', 'features'), path.join(outDir, 'specs', 'features'));
  cp(path.join(templateDir, 'specs', 'changes'), path.join(outDir, 'specs', 'changes'));
  // retarget the demo's app to this repo's app so it validates cleanly
  for (const kind of ['features', 'changes']) {
    const base = path.join(outDir, 'specs', kind);
    if (!fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base)) {
      const mp = path.join(base, d, 'meta.yml');
      if (fs.existsSync(mp)) fs.writeFileSync(mp, fs.readFileSync(mp, 'utf8').replace(/^app:[ \t]*app-example[ \t]*$/m, `app: ${app}`));
    }
  }
}

// 2) core engine (baked in — the generated repo is self-contained)
cp(path.join(CORE, 'tools', 'specs.mjs'), path.join(outDir, 'tools', 'specs.mjs'));
cp(path.join(CORE, 'schema'), path.join(outDir, 'schema'));
cp(path.join(CORE, 'constitution.md'), path.join(outDir, 'constitution.md'));
cp(path.join(CORE, 'VERSION'), path.join(outDir, 'VERSION'));

// 3) spec.config.json from the template default, with overrides
const cfg = JSON.parse(fs.readFileSync(path.join(templateDir, 'spec.config.template.json'), 'utf8'));
cfg.app = app;
if (args.language && args.language !== true) cfg.language = String(args.language);
const domains = list(args.domains); if (domains) cfg.domains = domains;
const repos = list(args.repos); if (repos) cfg.repos = repos;
if (!cfg.template || !String(cfg.template).includes('@')) cfg.template = `${template}@1.0.0`;
fs.writeFileSync(path.join(outDir, 'spec.config.json'), JSON.stringify(cfg, null, 2) + '\n');

// 4) README (fill {{APP}})
if (fs.existsSync(path.join(templateDir, 'README.md'))) {
  fs.writeFileSync(path.join(outDir, 'README.md'), fs.readFileSync(path.join(templateDir, 'README.md'), 'utf8').replace(/\{\{APP\}\}/g, app));
}

// 5) generate the indexes + validate
ok(`baked ${C.bold(outDir)}`);
console.log(C.dim(`  template=${template}  language=${cfg.language}  domains=[${(cfg.domains || []).join(', ')}]  repos=[${(cfg.repos || []).join(', ')}]  seed=${!!args['with-seed']}`));
try {
  execFileSync('node', ['tools/specs.mjs', 'index'], { cwd: outDir, stdio: 'inherit' });
  execFileSync('node', ['tools/specs.mjs', 'check'], { cwd: outDir, stdio: 'inherit' });
} catch { /* check prints its own errors */ }
console.log('  next: `cd ' + path.relative(process.cwd(), outDir) + '` then use the skills (reverse-spec / new-spec) to fill it.');
