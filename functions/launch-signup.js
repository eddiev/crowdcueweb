const {createHash} = require('node:crypto');
const {Timestamp, FieldValue} = require('firebase-admin/firestore');
const digest = value => createHash('sha256').update(value).digest('hex');

function normalizeSignup(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid');
  if (typeof body.website === 'string' && body.website.trim()) return {honeypot: true};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@\x00-\x1f]+@[^\s@\x00-\x1f]+\.[^\s@\x00-\x1f]+$/.test(email) || body.consent !== true) throw new Error('invalid');
  return {email, id: digest(email), source: body.source === 'contact' ? 'contact' : 'homepage'};
}

async function saveSignup(db, signup, address, now = Date.now(), qaRunId = null) {
  const hour = Math.floor(now / 3600000);
  const subscriber = db.collection('websiteLaunchSubscribers').doc(signup.id);
  const rate = db.collection('_websiteLaunchRateLimits').doc(digest(`${hour}:${address || 'unknown'}`));
  await db.runTransaction(async tx => {
    const [existing, limit] = await Promise.all([tx.get(subscriber), tx.get(rate)]);
    const count = limit.exists ? limit.data().count : 0;
    if (count >= 10) throw new Error('rate-limit');
    tx.set(rate, {count: count + 1, expiresAt: Timestamp.fromMillis(now + 48 * 3600000)});
    if (!existing.exists) {
      tx.create(subscriber, {email: signup.email, source: signup.source, status: 'subscribed', consent: 'Stelli launch updates', consentVersion: '2026-10-30', createdAt: FieldValue.serverTimestamp(), ...(qaRunId ? {qaRunId} : {})});
    }
  });
}
module.exports = {normalizeSignup, saveSignup};
