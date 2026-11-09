const {createHash} = require('node:crypto');
const {Timestamp} = require('firebase-admin/firestore');
const digest = value => createHash('sha256').update(value).digest('hex');
const origins = new Set(['https://stelliapp.com', 'https://www.stelliapp.com', 'https://crowdcue-775b5.web.app', 'https://crowdcue-775b5.firebaseapp.com', 'https://crowdcue-dev.web.app', 'https://crowdcue-dev.firebaseapp.com']);
function normalizeContact(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('invalid');
  if (typeof body.website === 'string' && body.website.trim()) return {honeypot: true};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!name || name.length > 100 || /[\x00-\x1f\x7f]/.test(name) || email.length > 254 || !/^[^\s@\x00-\x1f\x7f]+@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f]+$/.test(email) || !message || message.length > 5000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId || '')) throw Error('invalid');
  return {name, email, message, requestId: body.requestId.toLowerCase()};
}
async function reserveContact(db, address, now = Date.now()) {
  const ref = db.collection('_websiteContactRateLimits').doc(digest(`${Math.floor(now / 3600000)}:${address || 'unknown'}`));
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref); const count = snap.exists ? snap.get('count') : 0;
    if (count >= 5) throw Error('rate-limit');
    tx.set(ref, {count: count + 1, expiresAt: Timestamp.fromMillis(now + 48 * 3600000)});
  });
}
function createContactHandler({db, apiKey, send = fetch, emulator = false}) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const origin = req.get('origin');
    const local = emulator && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || (!origins.has(origin) && !local)) return res.status(403).json({error: 'Please use the Stelli website to contact us.'});
    res.set('Access-Control-Allow-Origin', origin).set('Vary', 'Origin');
    if (req.method === 'OPTIONS') return res.set('Access-Control-Allow-Methods', 'POST').set('Access-Control-Allow-Headers', 'Content-Type').status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({error: 'Please submit the contact form.'});
    if (!req.is('application/json') || Buffer.byteLength(JSON.stringify(req.body || {})) > 22000) return res.status(400).json({error: 'Please check your name, email address, and message.'});
    let contact;
    try { contact = normalizeContact(req.body); } catch { return res.status(400).json({error: 'Please check your name, email address, and message.'}); }
    if (contact.honeypot) return res.status(200).json({ok: true});
    try {
      await reserveContact(db(), req.ip);
      // Fixed recipient/sender; user input is plain text and cannot alter headers.
      // Include content in the key so a changed draft is a distinct delivery.
      const key = digest(JSON.stringify(contact));
      const response = await send('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: {Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json', 'Idempotency-Key': `stelli-contact-${key}`},
        body: JSON.stringify({from: 'Stelli <noreply@stelliapp.com>', to: ['support@stelliapp.com'], reply_to: contact.email, subject: 'Stelli website — contact request', text: `Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`}),
      });
      if (!response.ok) throw Error('delivery-failed');
      const delivery = await response.json();
      if (typeof delivery.id !== 'string' || !delivery.id) throw Error('delivery-failed');
      return res.status(200).json({ok: true});
    } catch (error) {
      if (error.message === 'rate-limit') return res.status(429).set('Retry-After', '3600').json({error: 'Please try again later, or email support@stelliapp.com.'});
      // Do not log contact text, email addresses, API keys or provider responses.
      console.error('Website contact delivery unavailable');
      return res.status(503).json({error: 'We couldn’t send your message. Please try again or email support@stelliapp.com.'});
    }
  };
}
module.exports = {normalizeContact, reserveContact, createContactHandler};
