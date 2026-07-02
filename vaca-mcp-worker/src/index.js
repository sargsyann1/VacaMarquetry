/**
 * VaCa Marquetry — MCP CRM Brain (Cloudflare Worker)
 */

import { validate }  from './modules/validator.js';
import { normalize } from './modules/normalizer.js';
import { score }     from './modules/scorer.js';
import { route }     from './modules/router.js';
import { write }     from './modules/writer.js';

const ALLOWED_MODES = new Set(['dry_run', 'shadow', 'production']);

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS')
        return corsWrap(new Response(null, { status: 204 }));

      if (request.method !== 'POST')
        return json({ error: 'POST only' }, 405);

      const modeHeader = request.headers.get('X-VaCa-Mode');
      const mode = ALLOWED_MODES.has(modeHeader)
        ? modeHeader
        : (env.VACA_MODE || 'shadow');

      const source = request.headers.get('X-VaCa-Source');
      const raw = await parseBody(request);

      const leadType = detectLeadType(source, raw);

      // 1. Validate
      const validation = validate(leadType, raw);
      if (!validation.valid) {
        return json({
          status: 'rejected',
          mode,
          lead_type: leadType,
          validation
        }, 400);
      }

      // 2. Normalize
      const { payload: normPayload, warnings: normWarnings } =
        normalize(leadType, raw);

      // 3. Score
      const scored = score(leadType, normPayload);

      // 4. Route
      const routing = route(leadType, scored);

      // 5. Write
      const result = await write(scored, routing, mode, env);

      return json({
        status: 'accepted',
        mode,
        lead_type: leadType,
        validation: {
          ...validation,
          warnings: [...validation.warnings, ...normWarnings]
        },
        normalized_payload: scored,
        routing,
        result
      }, 200);

    } catch (err) {
      console.error('[vaca-mcp-worker]', err.message);
      return json({ status: 'error', message: err.message }, 500);
    }
  }
};

//
// ✅ FIXED PARSE BODY (CRITICAL BUG FIX)
//
async function parseBody(request) {
  const ct = request.headers.get('content-type') || '';

  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData();

    const raw = {};
    const files = [];

    for (const [k, v] of fd.entries()) {

      const isFile =
        v &&
        typeof v === 'object' &&
        (
          'name' in v ||
          'type' in v ||
          'size' in v
        );

      if (isFile) {
        files.push({
          field: k,
          name: v?.name ?? null,
          type: v?.type ?? null,
          size: v?.size ?? null
        });
      } else {
        raw[k] = v;
      }
    }

    raw._files = files;
    return raw;
  }

  return request.json();
}

function detectLeadType(source, raw) {
  const s = String(source || '').toLowerCase();

  if (['whatsapp', 'contact', 'artwork_inquiry', 'portrait_inquiry', 'cookie_consent'].includes(s))
    return s;

  if (raw.artwork_title || raw.artwork_slug)
    return 'artwork_inquiry';

  if (raw.subject_type || raw.portrait_size || raw._files?.length)
    return 'portrait_inquiry';

  if (raw.visitor_id && raw.session_id)
    return 'cookie_consent';

  if (raw.incoming_message || raw.artwork_context)
    return 'whatsapp';

  return 'contact';
}

function json(data, status = 200) {
  return corsWrap(new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  ));
}

function corsWrap(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-VaCa-Mode, X-VaCa-Source');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  return res;
}