/**
 * One-off: import existing Twilio SMS/WhatsApp history into the inbox
 * (conversations + messages). Idempotent on Twilio SID — safe to re-run.
 *
 *   ACC=AC… TOK=<auth token> DB_PASSWORD=… node scripts/backfill-twilio-history.mjs
 *
 * Notes: preserves original timestamps; historical messages are stored as read
 * (no unread inflation). Media URLs aren't imported (they need Twilio auth to
 * fetch); the message still shows with a 📎 marker if it had media.
 */
import twilio from "twilio";
import pkg from "pg";

const ACC = process.env.ACC, TOK = process.env.TOK;
if (!ACC || !TOK) { console.error("Set ACC and TOK."); process.exit(1); }
const client = twilio(ACC, TOK);

const db = new pkg.Client({
  host: "aws-1-eu-north-1.pooler.supabase.com", port: 5432,
  user: "postgres.pegajpwahlzlhtmltovy", password: process.env.DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await db.connect();

function normalisePhone(raw) {
  if (!raw) return "";
  const s = raw.replace(/^whatsapp:/i, "").trim().replace(/[\s\-().]/g, "");
  if (s.startsWith("+44")) return s;
  if (s.startsWith("0")) return "+44" + s.slice(1);
  return s;
}
function variants(e164) {
  const set = new Set([e164]);
  if (e164.startsWith("+44")) { set.add("0" + e164.slice(3)); set.add(e164.slice(1)); set.add(e164.slice(3)); }
  return [...set];
}
const isWa = (a) => (a || "").toLowerCase().startsWith("whatsapp:");

const convCache = new Map();   // contactPhone -> { id, customerId }
async function resolveConversation(contactPhone) {
  if (convCache.has(contactPhone)) return convCache.get(contactPhone);
  const vs = variants(contactPhone);
  const cust = await db.query(`select id from customers where phone = any($1) limit 1`, [vs]);
  const customerId = cust.rows[0]?.id ?? null;
  const found = await db.query(`select id, customer_id from conversations where contact_phone=$1`, [contactPhone]);
  let id;
  if (found.rows[0]) {
    id = found.rows[0].id;
    if (!found.rows[0].customer_id && customerId) await db.query(`update conversations set customer_id=$1 where id=$2`, [customerId, id]);
  } else {
    const ins = await db.query(`insert into conversations (contact_phone, customer_id) values ($1,$2) returning id`, [contactPhone, customerId]);
    id = ins.rows[0].id;
  }
  const rec = { id, customerId };
  convCache.set(contactPhone, rec);
  return rec;
}

console.log("Fetching messages from Twilio (this can take a moment)…");
let imported = 0, skipped = 0, total = 0;
const newest = new Map();   // convId -> { at, preview, direction, channel }

// Auto-paginates through the entire account history.
const all = await client.messages.list({ pageSize: 1000 });
total = all.length;
console.log(`Twilio returned ${total} messages. Importing…`);

// Oldest → newest so conversation rollups end on the latest message.
all.sort((a, b) => new Date(a.dateSent || a.dateCreated) - new Date(b.dateSent || b.dateCreated));

for (const m of all) {
  const inbound = String(m.direction || "").startsWith("inbound");
  const direction = inbound ? "inbound" : "outbound";
  const channel = isWa(m.from) || isWa(m.to) ? "whatsapp" : "sms";
  const customerAddr = inbound ? m.from : m.to;
  const contactPhone = normalisePhone(customerAddr);
  if (!contactPhone) { skipped++; continue; }

  const convo = await resolveConversation(contactPhone);
  const at = new Date(m.dateSent || m.dateCreated).toISOString();
  const status = m.status || (inbound ? "received" : "sent");
  const numMedia = parseInt(m.numMedia ?? "0", 10) || 0;
  const body = m.body || (numMedia > 0 ? "📎 Attachment" : "");

  const res = await db.query(
    `insert into messages (conversation_id, customer_id, twilio_sid, channel, direction, from_number, to_number, body, status, read_at, sent_at, delivered_at, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
     on conflict (twilio_sid) do nothing`,
    [convo.id, convo.customerId, m.sid, channel, direction, m.from, m.to, body, status,
     at, /* read_at: historical = already handled */
     direction === "outbound" ? at : null,
     status === "delivered" ? at : null,
     at],
  );
  if (res.rowCount > 0) imported++; else skipped++;

  const prev = newest.get(convo.id);
  if (!prev || new Date(at) > new Date(prev.at)) {
    newest.set(convo.id, { at, preview: body.replace(/\s+/g, " ").trim().slice(0, 120), direction, channel });
  }
}

// Roll each conversation forward to its latest message; historical = 0 unread.
for (const [convId, n] of newest) {
  await db.query(
    `update conversations set last_message_at=$1, last_message_preview=$2, last_message_direction=$3, last_channel=$4, unread_count=0, updated_at=now() where id=$5`,
    [n.at, n.preview, n.direction, n.channel, convId],
  );
}

console.log(`\nDone ✅  Twilio messages: ${total} | imported: ${imported} | already present/skipped: ${skipped}`);
console.log(`Conversations touched: ${newest.size}`);
await db.end();
