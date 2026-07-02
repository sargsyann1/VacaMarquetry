/**
 * VaCa MCP Worker — DRY RUN Test Runner
 *
 * Runs all 20 fixtures directly against the Worker modules (no HTTP, no wrangler).
 * Verifies enum values, routing decisions, and validation behaviour.
 *
 * Usage:
 *   node --input-type=module test/runner.js
 *   -- or --
 *   node test/runner.js   (if package.json has "type": "module")
 *
 * Expected: 20/20 PASS
 */

import { validate }  from '../src/modules/validator.js';
import { normalize } from '../src/modules/normalizer.js';
import { score }     from '../src/modules/scorer.js';
import { route }     from '../src/modules/router.js';
import { fixtures }  from './fixtures.js';

// ─── ALLOWED enum sets (duplicated here for assertion, not business logic) ────
import { ALLOWED }   from '../src/config/enums.js';

let passed = 0;
let failed = 0;
const errors = [];

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  VaCa MCP Worker — DRY RUN Test Suite');
console.log('══════════════════════════════════════════════════════════════\n');

for (const fx of fixtures) {
  const issues = [];

  // ── Detect lead type (same logic as index.js) ─────────────────────────────
  const raw = fx.payload;
  const source = fx.source;
  const leadType = detectLeadType(source, raw);

  // ── 1. Validate ───────────────────────────────────────────────────────────
  const validation = validate(leadType, raw);

  if (fx.expectReject) {
    // Expect validation to fail
    if (validation.valid) {
      issues.push(`Expected rejection but validation passed`);
    } else if (fx.expectedError) {
      const hasError = validation.errors.some(e => e.field === fx.expectedError);
      if (!hasError) {
        issues.push(`Expected error on field "${fx.expectedError}" but got: ${validation.errors.map(e => e.field).join(', ')}`);
      }
    }
    printResult(fx, issues, { status: 'rejected', errors: validation.errors });
    continue;
  }

  if (!validation.valid) {
    issues.push(`Unexpected rejection: ${validation.errors.map(e => e.msg).join('; ')}`);
    printResult(fx, issues, { status: 'rejected' });
    continue;
  }

  // ── 2. Normalize ──────────────────────────────────────────────────────────
  const { payload: normPayload } = normalize(leadType, raw);

  // ── 3. Score ──────────────────────────────────────────────────────────────
  const scored = score(leadType, normPayload);

  // ── 4. Route ──────────────────────────────────────────────────────────────
  const routing = route(leadType, scored);

  // ── 5. Enum assertions ────────────────────────────────────────────────────
  for (const field of ['lead_type', 'lead_source', 'interaction_type', 'lead_heat']) {
    const val     = scored[field];
    const allowed = ALLOWED[field];
    if (val && allowed && !allowed.has(val)) {
      issues.push(`ENUM FAIL: ${field} = "${val}" is not in allowed set [${[...allowed].join(', ')}]`);
    }
  }

  // ── 6. expected.* assertions ──────────────────────────────────────────────
  if (fx.expected) {
    for (const [k, expected] of Object.entries(fx.expected)) {
      if (k === 'routing') {
        if (routing.destination !== expected) {
          issues.push(`routing.destination: expected "${expected}", got "${routing.destination}"`);
        }
      } else if (k === 'alert') {
        if (routing.alert !== expected) {
          issues.push(`routing.alert: expected ${expected}, got ${routing.alert}`);
        }
      } else {
        const actual = scored[k];
        if (actual !== expected) {
          issues.push(`${k}: expected "${expected}", got "${actual}"`);
        }
      }
    }
  }

  printResult(fx, issues, {
    lead_type:           scored.lead_type,
    lead_source:         scored.lead_source,
    interaction_type:    scored.interaction_type,
    intent_score_scaled: scored.intent_score_scaled,
    lead_heat:           scored.lead_heat,
    routing:             routing.destination,
    alert:               routing.alert,
    reason:              routing.reason
  });
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────────────────────');
console.log(`  Results: ${passed} PASS  |  ${failed} FAIL  |  ${fixtures.length} total`);
console.log('──────────────────────────────────────────────────────────────\n');

if (failed > 0) {
  console.log('FAILED FIXTURES:\n');
  for (const e of errors) {
    console.log(`  ❌ ${e.id} — ${e.name}`);
    for (const issue of e.issues) console.log(`     • ${issue}`);
    console.log();
  }
  process.exit(1);
} else {
  console.log('  ✅ All tests passed. Ready for shadow mode.\n');
  process.exit(0);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printResult(fx, issues, detail) {
  const ok  = issues.length === 0;
  const tag = ok ? '✅' : '❌';
  const summary = typeof detail === 'object'
    ? Object.entries(detail).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' | ')
    : String(detail);
  console.log(`${tag} [${fx.id}] ${fx.name}`);
  if (Object.keys(detail || {}).length > 0) console.log(`     ${summary}`);
  if (!ok) {
    for (const issue of issues) console.log(`     ⚠  ${issue}`);
    errors.push({ id: fx.id, name: fx.name, issues });
    failed++;
  } else {
    passed++;
  }
}

function detectLeadType(source, raw) {
  const s = String(source || '').toLowerCase();
  if (['whatsapp','contact','artwork_inquiry','portrait_inquiry','cookie_consent'].includes(s)) return s;
  if (raw.artwork_title || raw.artwork_slug)              return 'artwork_inquiry';
  if (raw.subject_type || raw.portrait_size || raw._files?.length) return 'portrait_inquiry';
  if (raw.visitor_id && raw.session_id)                   return 'cookie_consent';
  if (raw.incoming_message || raw.artwork_context)        return 'whatsapp';
  return 'contact';
}
