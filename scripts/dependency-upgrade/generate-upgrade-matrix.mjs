#!/usr/bin/env node
/* global process, console */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const semver = require('semver');

const repoRoot = process.cwd();
const pkgPath = path.join(repoRoot, 'package.json');
const outPath = path.join(repoRoot, 'reports', 'dependency-upgrade-matrix.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const dependencies = pkg.dependencies ?? {};
const devDependencies = pkg.devDependencies ?? {};

const allEntries = [
  ...Object.entries(dependencies).map(([name, current]) => ({ name, section: 'dependencies', current })),
  ...Object.entries(devDependencies).map(([name, current]) => ({ name, section: 'devDependencies', current })),
].sort((a, b) => a.name.localeCompare(b.name));

function npmView(spec, field, asJson = false) {
  const jsonFlag = asJson ? ' --json' : '';
  const cmd = `npm view ${JSON.stringify(spec)} ${field}${jsonFlag} --silent`;
  try {
    const raw = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    }).trim();
    if (!raw) return asJson ? null : '';
    return asJson ? JSON.parse(raw) : raw;
  } catch {
    return asJson ? null : '';
  }
}

function resolveVersion(spec) {
  const raw = npmView(spec, 'version', true);
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    const onlyValid = raw.filter((v) => typeof v === 'string' && semver.valid(v));
    if (!onlyValid.length) return '';
    return semver.rsort(onlyValid)[0];
  }
  return '';
}

const latestOverall = new Map();
for (const entry of allEntries) {
  if (String(entry.current).startsWith('file:')) continue;
  latestOverall.set(entry.name, resolveVersion(entry.name));
}

const pinnedTargets = {
  electron: {
    target: resolveVersion('electron@40'),
    reason: 'Pinned to latest 40.x after dev runtime bootstrap failure with electron 41 in this project/toolchain.',
  },
  vite: {
    target: resolveVersion('vite@7'),
    reason: 'Pinned to latest 7.x because electron-vite@5 only supports vite ^5 || ^6 || ^7.',
  },
  '@vitejs/plugin-react': {
    target: resolveVersion('@vitejs/plugin-react@5'),
    reason: 'Pinned to latest 5.x to remain compatible with vite 7.x until electron-vite supports vite 8.',
  },
  eslint: {
    target: resolveVersion('eslint@9'),
    reason: 'Pinned to latest 9.x because eslint-plugin-react@7.37.5 does not declare eslint 10 support.',
  },
};

const eslintTargetMajor = semver.major(semver.coerce(pinnedTargets.eslint.target));
pinnedTargets['@eslint/js'] = {
  target: resolveVersion(`@eslint/js@${eslintTargetMajor}`),
  reason: `Pinned to eslint major ${eslintTargetMajor} for toolchain alignment.`,
};

const targetVersionByName = new Map();
const rows = allEntries.map((entry) => {
  const current = String(entry.current);
  const isLocalFile = current.startsWith('file:');

  const latest = isLocalFile ? 'local-file' : latestOverall.get(entry.name) || 'lookup-failed';
  const pin = pinnedTargets[entry.name];
  const target = isLocalFile ? current : pin?.target || latest;
  const blockerReason = pin?.reason || null;

  targetVersionByName.set(entry.name, target);

  return {
    package: entry.name,
    section: entry.section,
    current,
    latest,
    target,
    blockerReason,
  };
});

const metaCache = new Map();
function packageMeta(name, version) {
  const key = `${name}@${version}`;
  if (metaCache.has(key)) return metaCache.get(key);
  const value = npmView(`${name}@${version}`, 'peerDependencies peerDependenciesMeta', true) || {};
  metaCache.set(key, value);
  return value;
}

const collisions = [];
for (const row of rows) {
  if (String(row.current).startsWith('file:')) continue;
  if (!row.target || row.target === 'lookup-failed') continue;

  const meta = packageMeta(row.package, row.target);
  const peerDependencies = meta?.peerDependencies ?? {};
  const peerMeta = meta?.peerDependenciesMeta ?? {};

  if (typeof peerDependencies !== 'object' || Array.isArray(peerDependencies)) continue;

  for (const [peerName, peerRange] of Object.entries(peerDependencies)) {
    const peerTarget = targetVersionByName.get(peerName);
    const isOptional = Boolean(peerMeta?.[peerName]?.optional);

    if (!peerTarget || isOptional || String(peerTarget).startsWith('file:')) continue;

    const coerced = semver.coerce(peerTarget);
    const satisfies = coerced ? semver.satisfies(coerced.version, peerRange, { includePrerelease: true, loose: true }) : false;

    if (!satisfies) {
      collisions.push({
        package: row.package,
        packageTarget: row.target,
        peer: peerName,
        required: peerRange,
        target: peerTarget,
      });
    }
  }
}

const report = {
  generatedAtUtc: new Date().toISOString(),
  policy: {
    strategy: 'latest-compatible-set',
    phase: 'phase-1',
    temporaryPins: Object.fromEntries(Object.entries(pinnedTargets).map(([name, v]) => [name, v.target])),
  },
  matrix: rows,
  collisions,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

console.log(`Wrote ${outPath}`);
console.log(`Packages analyzed: ${rows.length}`);
console.log(`Collisions detected: ${collisions.length}`);
