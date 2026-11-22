import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MAX_VIDEO_BYTES = 16384;
const TIKTOK_VIDEO_URL_RE = /^https:\/\/(?:www\.|m\.)?tiktok\.com\/@[^/\s]+\/video\/\d+(?:[?#].*)?$/;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function validateVideoPayload(rawBytes: Buffer): void {
  if (rawBytes.length === 0 || rawBytes.length > MAX_VIDEO_BYTES) {
    fail(`VIDEO.json size ${rawBytes.length} bytes is out of range (1..${MAX_VIDEO_BYTES}).`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBytes.toString('utf8'));
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    fail(`VIDEO.json is not valid JSON: ${detail}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    fail('VIDEO.json must be a non-null JSON object.');
  }

  const urlValue = (parsed as Record<string, unknown>).url;
  if (typeof urlValue !== 'string' || !TIKTOK_VIDEO_URL_RE.test(urlValue)) {
    fail('VIDEO.json "url" must be a canonical https://www.tiktok.com/@<handle>/video/<digits> URL.');
  }
}

function main(): void {
  const botDir: string = resolve(process.env.MAKEFUN_BOT_DIR || '.');
  const outputDir: string = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

  const inputPath: string = join(botDir, 'VIDEO.json');
  const outputPath: string = join(outputDir, 'VIDEO.json');

  let rawBytes: Buffer;
  try {
    rawBytes = readFileSync(inputPath);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    fail(`Failed to read ${inputPath}: ${detail}`);
  }

  validateVideoPayload(rawBytes);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, rawBytes);
}

main();
