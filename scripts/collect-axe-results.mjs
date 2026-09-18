import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const rawDir = join(process.cwd(), 'test-results', 'a11y-raw');
const outFile = join(process.cwd(), 'a11y-results', 'axe-results.json');

if (!existsSync(rawDir)) {
  console.error(`No raw scans found at ${rawDir}. Run "npm test" first.`);
  process.exit(1);
}

const files = readdirSync(rawDir)
  .filter((file) => file.endsWith('.json'))
  .sort();

if (files.length === 0) {
  console.error(`No raw scans found at ${rawDir}. Run "npm test" first.`);
  process.exit(1);
}

const results = files.map((file) => JSON.parse(readFileSync(join(rawDir, file), 'utf8')));

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(results, null, 2)}\n`);

console.log(`Wrote ${results.length} scan(s) to ${outFile}`);
