const {test} = require('node:test');
const assert = require('node:assert/strict');
const {normalizeSignup, saveSignup} = require('../launch-signup');
test('requires explicit consent and a bounded email; traps automated submissions', () => {
  assert.throws(() => normalizeSignup({email: 'person@example.com'}));
  assert.throws(() => normalizeSignup({email: 'invalid', consent: true}));
  assert.throws(() => normalizeSignup({email: 'a'.repeat(255) + '@example.com', consent: true}));
  assert.deepEqual(normalizeSignup({website: 'bot.example'}), {honeypot: true});
  const a = normalizeSignup({email: ' Person@Example.com ', consent: true});
  const b = normalizeSignup({email: 'person@example.com', consent: true});
  assert.equal(a.id, b.id); assert.equal(a.email, 'person@example.com');
});
test('emulator: concurrent duplicate signups are idempotent and requests are rate limited', {skip: !process.env.FIRESTORE_EMULATOR_HOST}, async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST, /^(127\.0\.0\.1|localhost):/);
  const {initializeApp} = require('firebase-admin/app');
  const {getFirestore} = require('firebase-admin/firestore');
  initializeApp({projectId: 'demo-stelli-website'}); const db = getFirestore();
  const run = 'qa_website_' + Date.now(); const signup = normalizeSignup({email: `${run}@stelli-demo.example`, consent: true});
  await Promise.all([saveSignup(db, signup, run, Date.now(), run), saveSignup(db, signup, run, Date.now(), run)]);
  assert.equal((await db.collection('websiteLaunchSubscribers').doc(signup.id).get()).data().email, signup.email);
  for (let i = 0; i < 8; i++) await saveSignup(db, signup, run);
  await assert.rejects(saveSignup(db, signup, run), /rate-limit/);
});
