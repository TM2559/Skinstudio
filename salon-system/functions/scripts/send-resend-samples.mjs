#!/usr/bin/env node
/**
 * Odešle všechny tři typy e-mailů z email/mail.jsx přes Resend (stejné HTML jako v produkci).
 *
 *   cd functions
 *   npm run send-samples -- tomas@2559.cz
 *
 * Vyžaduje v functions/.env: RESEND_API_KEY, RESEND_FROM (volitelně RESEND_REPLY_TO).
 */
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const functionsRoot = path.join(__dirname, '..');

function loadEnvFile() {
  const p = path.join(functionsRoot, '.env');
  if (!existsSync(p)) return;
  const raw = readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadEnvFile();

const to = process.argv[2];
if (!to || !to.includes('@')) {
  console.error('Použití: npm run send-samples -- vas@email.cz');
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;
if (!apiKey || !from) {
  console.error('Chybí RESEND_API_KEY nebo RESEND_FROM v souboru functions/.env');
  process.exit(1);
}

const entry = path.join(__dirname, '_send-samples-runner.mjs');
const outfile = path.join(__dirname, '.send-samples-bundle.mjs');

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile,
  loader: { '.jsx': 'jsx' },
  jsx: 'automatic',
  absWorkingDir: functionsRoot,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@react-email/components',
    '@react-email/render',
    'resend',
  ],
});

const { run } = await import(pathToFileURL(outfile).href);
const replyTo = process.env.RESEND_REPLY_TO || undefined;

try {
  const results = await run({
    to,
    apiKey,
    from,
    replyTo,
  });
  for (const r of results) {
    if (r.ok) console.log('OK', r.subject, r.id || '');
    else console.error('CHYBA', r.subject, r.error);
  }
} finally {
  try {
    unlinkSync(outfile);
  } catch {
    /* ignore */
  }
}
