const {test} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {normalizeContact, reserveContact, createContactHandler} = require('../contact');
const draft = () => ({name: ' Taylor ', email: ' Person@Example.com ', message: ' A question\nabout Stelli. ', requestId: randomUUID()});
test('contact validates boundaries and header injection, preserves multiline messages and traps bots', () => {
  const body = draft(); const result = normalizeContact(body);
  assert.equal(result.name, 'Taylor'); assert.equal(result.email, 'person@example.com'); assert.equal(result.message, 'A question\nabout Stelli.');
  for (const patch of [{name: ''}, {name: 'x'.repeat(101)}, {name: 'Taylor\r\nBcc: attacker@example.com'}, {email: 'bad'}, {email: 'x@y.com\nBcc:z@y.com'}, {message: ''}, {message: 'x'.repeat(5001)}, {requestId: 'bad'}]) assert.throws(() => normalizeContact({...body, ...patch}));
  assert.deepEqual(normalizeContact({website: 'bot.example'}), {honeypot: true});
});
function response() { return {code: 200, headers: {}, set(k, v) {this.headers[k] = v; return this;}, status(c) {this.code = c; return this;}, json(b) {this.body = b; return this;}, send(b) {this.body = b; return this;}}; }
function request(body, origin = 'https://stelliapp.com') { return {body, ip: 'qa-contact', method: 'POST', get: () => origin, is: t => t === 'application/json'}; }
test('HTTP rejects foreign origins, malformed input and bots without database or mail access', async () => {
  let calls = 0; const handler = createContactHandler({db: () => {calls++; throw Error();}, apiKey: () => {throw Error();}});
  let res = response(); await handler(request(draft(), 'https://attacker.example'), res); assert.equal(res.code, 403);
  res = response(); await handler(request({...draft(), message: ''}), res); assert.equal(res.code, 400);
  res = response(); await handler(request({website: 'bot.example'}), res); assert.equal(res.code, 200); assert.equal(calls, 0);
});
test('emulator: concurrency limit, fixed recipient, provider retry key and delivery failures', {skip: !process.env.FIRESTORE_EMULATOR_HOST}, async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST, /^(127\.0\.0\.1|localhost):/);
  const {initializeApp, deleteApp} = require('firebase-admin/app'); const {getFirestore} = require('firebase-admin/firestore');
  const app = initializeApp({projectId: 'demo-stelli-website'}, randomUUID()); const db = getFirestore(app);
  try {
    const address = 'qa_contact_' + randomUUID();
    const attempts = await Promise.allSettled(Array.from({length: 8}, () => reserveContact(db, address)));
    assert.equal(attempts.filter(a => a.status === 'fulfilled').length, 5);
    assert.equal(attempts.filter(a => a.status === 'rejected' && a.reason.message === 'rate-limit').length, 3);
    const calls = []; const handler = createContactHandler({db: () => db, apiKey: () => 'fake-local-only', send: async (url, opts) => {calls.push({url, ...opts}); return {ok: true, json: async () => ({id: 'mock-delivery'})};}});
    const req = request(draft()); req.ip = 'qa_contact_' + randomUUID();
    for (let i = 0; i < 2; i++) {const res = response(); await handler(req, res); assert.equal(res.code, 200);}
    const mail = JSON.parse(calls[0].body); assert.deepEqual(mail.to, ['support@stelliapp.com']); assert.equal(mail.reply_to, 'person@example.com'); assert.match(mail.text, /A question\nabout Stelli\./); assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
    const failure = createContactHandler({db: () => db, apiKey: () => 'fake-local-only', send: async () => ({ok: false})});
    const res = response(); await failure(req, res); assert.equal(res.code, 503); assert.match(res.body.error, /couldn’t send/);
  } finally {await deleteApp(app);}
});
