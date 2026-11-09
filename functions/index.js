const {onRequest} = require('firebase-functions/v2/https');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {normalizeSignup, saveSignup} = require('./launch-signup');
initializeApp();
const origins = new Set(['https://stelliapp.com', 'https://www.stelliapp.com', 'https://crowdcue-775b5.web.app', 'https://crowdcue-775b5.firebaseapp.com', 'https://crowdcue-dev.web.app', 'https://crowdcue-dev.firebaseapp.com']);

exports.subscribeToLaunchUpdates = onRequest({region: 'us-central1', maxInstances: 3, concurrency: 20, memory: '256MiB', timeoutSeconds: 15, invoker: 'public'}, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const origin = req.get('origin');
  const local = process.env.FUNCTIONS_EMULATOR === 'true' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
  if (!origin || (!origins.has(origin) && !local)) return res.status(403).json({error: 'Please use the Stelli website to sign up.'});
  res.set('Access-Control-Allow-Origin', origin).set('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.set('Access-Control-Allow-Methods', 'POST').set('Access-Control-Allow-Headers', 'Content-Type').status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({error: 'Please submit the signup form.'});
  if (!req.is('application/json') || Buffer.byteLength(JSON.stringify(req.body || {})) > 2048) return res.status(400).json({error: 'Please enter a valid email address.'});
  let signup;
  try { signup = normalizeSignup(req.body); } catch { return res.status(400).json({error: 'Please enter a valid email address and agree to launch updates.'}); }
  if (signup.honeypot) return res.status(200).json({ok: true});
  try {
    // Reserved .example fixture addresses identify QA records without accepting arbitrary tags.
    const fixtureName = signup.email.endsWith('@stelli-demo.example') ? signup.email.split('@')[0] : '';
    const qaRunId = /^qa_[a-z0-9_]{1,80}$/.test(fixtureName) ? fixtureName : null;
    await saveSignup(getFirestore(), signup, req.ip, Date.now(), qaRunId);
    return res.status(200).json({ok: true});
  } catch (error) {
    if (error.message === 'rate-limit') return res.status(429).set('Retry-After', '3600').json({error: 'Please try again a little later.'});
    console.error('Launch signup could not be saved', {code: error.code || 'unknown'});
    return res.status(503).json({error: 'We couldn’t save your email. Please try again shortly.'});
  }
});

const {defineSecret} = require('firebase-functions/params');
const {createContactHandler} = require('./contact');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
exports.contactStelli = onRequest({region: 'us-central1', maxInstances: 3, concurrency: 20, memory: '256MiB', timeoutSeconds: 20, invoker: 'public', secrets: [RESEND_API_KEY]}, createContactHandler({db: getFirestore, apiKey: () => RESEND_API_KEY.value(), emulator: process.env.FUNCTIONS_EMULATOR === 'true'}));
