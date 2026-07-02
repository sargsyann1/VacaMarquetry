/**
 * VaCa MCP Worker — Telegram Alert Module
 *
 * Sends HTML-formatted alert messages to the VaCa operations Telegram chat.
 * Only called when routing.alert === true.
 *
 * Required env:
 *   TELEGRAM_BOT_TOKEN — set via: wrangler secret put TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID   — set in wrangler.toml [vars] (not sensitive)
 *
 * Returns: { sent, status, telegram_response } or { skipped, reason }
 */

export async function sendAlert(scored, routing, env) {
  const token  = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { skipped: true, reason: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured' };
  }

  const level   = routing.alert_level || '🔔 VaCa Lead Alert';
  const score   = scored.intent_score_scaled ?? '—';
  const maxScore = 10;

  const lines = [
    `<b>${level}</b>`,
    ``,
    `<b>Type:</b>   ${scored.lead_type || '—'}`,
    `<b>Heat:</b>   ${scored.lead_heat}  (${score}/${maxScore})`,
    `<b>Source:</b> ${scored.source_page || scored.artwork_page_url || '—'}`,
  ];

  if (scored.artwork_title)       lines.push(`<b>Artwork:</b> ${scored.artwork_title}`);
  if (scored.name)                lines.push(`<b>Name:</b>   ${scored.name}`);
  if (scored.email)               lines.push(`<b>Email:</b>  ${scored.email}`);
  if (scored.budget)              lines.push(`<b>Budget:</b> ${scored.budget}`);
  if (scored.subject_type)        lines.push(`<b>Subject:</b> ${scored.subject_type}`);
  if (scored.incoming_message)    lines.push(`<b>WA Msg:</b> ${String(scored.incoming_message).slice(0, 300)}`);
  if (scored.message)             lines.push(`<b>Msg:</b>    ${String(scored.message).slice(0, 300)}`);

  const text = lines.join('\n');

  let res, body;
  try {
    res  = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    body = await res.json().catch(() => ({}));
  } catch (err) {
    // Never let Telegram failure break the Airtable write
    return { sent: false, error: err.message };
  }

  return {
    sent:              res.ok,
    status:            res.status,
    telegram_response: body.ok ?? false
  };
}
