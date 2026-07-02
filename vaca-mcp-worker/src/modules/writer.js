/**
 * VaCa MCP Worker — Airtable Writer
 *
 * Modes:
 *   dry_run    → no writes, returns field preview
 *   shadow     → writes to PROD base (live test against real tables)
 *   production → writes to PROD base
 *
 * All writes use ?typecast=true. 429 → one retry after 1.1s.
 */

import { toLeadsFields, toCollectorFields } from '../config/airtableFields.js';
import { sendAlert }                        from './telegram.js';

const TABLE_ENV_KEY = {
  leads_crm:      'AIRTABLE_LEADS_TABLE_ID',
  collector_crm:  'AIRTABLE_COLLECTORS_TABLE_ID',
  analytics_only: 'AIRTABLE_ANALYTICS_TABLE_ID',
  dead_letter:    'AIRTABLE_DEADLETTER_TABLE_ID'
};

export async function write(scored, routing, mode, env) {
  if (!['dry_run', 'shadow', 'production'].includes(mode)) {
    throw new Error(`SAFETY ABORT: Unknown mode "${mode}"`);
  }

  if (mode === 'dry_run') {
    return {
      success:        true,
      mode:           'dry_run',
      record_id:      null,
      would_write_to: routing.destination,
      also_write:     routing.also_write || null,
      fields_preview: toLeadsFields(scored)
    };
  }

  if (!env.AIRTABLE_TOKEN) {
    throw new Error('SAFETY ABORT: AIRTABLE_TOKEN secret is not set.');
  }
  const baseId = env.AIRTABLE_PROD_BASE_ID;
  if (!baseId || !String(baseId).startsWith('app')) {
    throw new Error(`SAFETY ABORT: AIRTABLE_PROD_BASE_ID is missing or invalid ("${baseId}")`);
  }

  const result = { success: true, mode, destination: routing.destination, base: baseId };

  if (routing.destination === 'dead_letter') {
    const dlqId = env[TABLE_ENV_KEY.dead_letter];
    if (dlqId && !String(dlqId).toUpperCase().includes('REPLACE')) {
      const rec = await airtableCreate(baseId, dlqId, toLeadsFields(scored), env.AIRTABLE_TOKEN);
      result.dlq_record_id = rec.id;
    } else {
      result.dlq_skipped = true;
      result.dlq_reason  = 'AIRTABLE_DEADLETTER_TABLE_ID not configured';
    }
    return result;
  }

  if (routing.destination === 'analytics_only') {
    const analyticsId = env[TABLE_ENV_KEY.analytics_only];
    if (analyticsId && !String(analyticsId).toUpperCase().includes('REPLACE')) {
      const rec = await airtableCreate(baseId, analyticsId, toLeadsFields(scored), env.AIRTABLE_TOKEN);
      result.analytics_record_id = rec.id;
    } else {
      result.analytics_skipped = true;
      result.analytics_reason  = 'AIRTABLE_ANALYTICS_TABLE_ID not configured';
    }
    return result;
  }

  const primaryTableId = env[TABLE_ENV_KEY[routing.destination] || TABLE_ENV_KEY.leads_crm];
  const primaryFields  = routing.destination === 'collector_crm'
    ? toCollectorFields(scored)
    : toLeadsFields(scored);

  const primaryRecord = await airtableCreate(baseId, primaryTableId, primaryFields, env.AIRTABLE_TOKEN);
  result.record_id = primaryRecord.id;

  if (routing.also_write) {
    const secTableId = env[TABLE_ENV_KEY[routing.also_write]];
    const secFields  = routing.also_write === 'collector_crm'
      ? toCollectorFields(scored)
      : toLeadsFields(scored);
    const secRecord = await airtableCreate(baseId, secTableId, secFields, env.AIRTABLE_TOKEN);
    result.secondary_record_id   = secRecord.id;
    result.secondary_destination = routing.also_write;
  }

  if (routing.alert) {
    result.telegram = await sendAlert(scored, routing, env);
  }

  return result;
}

async function airtableCreate(baseId, tableId, fields, token, attempt = 0) {
  if (!tableId) throw new Error('Airtable table ID is missing');

  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}?typecast=true`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ records: [{ fields }] })
    }
  );

  if (res.status === 429 && attempt === 0) {
    await sleep(1100);
    return airtableCreate(baseId, tableId, fields, token, 1);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message || body?.error || JSON.stringify(body);
    throw new Error(`Airtable ${res.status} on table ${tableId}: ${msg}`);
  }
  return body.records?.[0] || {};
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
