# stelliapp
Repository for the official Stelli website.

## Local preview
Run a simple local server from the repo root:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## AASA hosting (Firebase)
This repo includes Firebase Hosting config to serve Apple App Site Association with the required JSON content-type.

Files:
- `/.well-known/apple-app-site-association`
- `/apple-app-site-association`
- `/firebase.json`
- `/.firebaserc`

Deploy:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only hosting --project crowdcue-775b5
```

Validate:

```bash
curl -i https://stelliapp.com/.well-known/apple-app-site-association
curl -i https://stelliapp.com/apple-app-site-association
```

Expected:
- `HTTP/2 200`
- `content-type: application/json`
- no redirect on the apex host endpoints

## Pre-launch homepage (October 30, 2026)

The homepage uses approved Sunset Sessions v4, Wedding Remote v4 (James officiant), Discover Museum v5, baseball v9 and D&D v10 brand videos. The demo carousel follows that order, shows three cards on desktop, two below 850px and one below 600px, and supports arrow controls, horizontal scrolling, and keyboard navigation. Videos load on demand into the existing native player; the carousel does not auto-advance. Web encodes retain their edits/audio; the original masters remain in the app marketing project. `scripts/media-sources.json` records source checksums. Do not replace a master when updating website derivatives.

Build: `python3 scripts/build_site.py`. Hosting serves only `dist/`, built from an explicit public-file allowlist. Internal Markdown, deployment records and backend source are not included. Keep the existing Auth, invitation and association-file routes intact.

Launch signup: same-origin `POST /api/launch-updates` routes to `subscribeToLaunchUpdates` in the independent `stelli-website` Functions codebase. It saves email, explicit launch-update consent, source and first signup time in the private `websiteLaunchSubscribers` Firestore collection. Duplicate email addresses are idempotent. Browser origins, input length, consent, a hidden bot field and per-address rate limits are checked. Existing app data and Firestore rules are not deployed or changed by this site release. Only the server Admin SDK writes the signup collection; client rules must continue to deny unmatched collections.

No outbound emails or campaigns are sent by signup. Launch messaging is a later action using the opted-in list. Exclude documents with `qaRunId` from a mailing export. Reserved `qa_...@stelli-demo.example` fixture addresses are tagged automatically. Removing a real subscription is currently handled through support@stelliapp.com, as disclosed on the form.

Validation: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8182 npm test --prefix functions`, then check the HTTP endpoint and browser form through the local Hosting emulator. Use named `qa_` fixtures in cloud development. Promote an exact committed SHA: deploy only `functions:stelli-website` and `hosting` to `crowdcue-dev`, verify, then deploy the same SHA to `crowdcue-775b5`. Never use `release_envs.sh` for website iteration. Never bulk-delete fixture or subscriber data.

## Contact page preparation (November 9, 2026)

Local launch-prep changes replace homepage signup with header/footer links to `contact.html` and remove beta-access links, including the invitation fallback. The Contact us page accepts name, email and message, with a direct support email fallback. Existing launch-subscriber records and the old signup endpoint are retained; no mailing or subscriber-data migration occurs.

`contact.js` posts to same-origin `/api/contact`, rewritten to `contactStelli`. The independent website Functions codebase uses existing `RESEND_API_KEY` to send plain-text mail from `noreply@stelliapp.com` to the fixed `support@stelliapp.com` inbox, with the visitor’s email as Reply-To. Provider acceptance is required before success. Same-payload retries reuse a provider idempotency key; errors preserve the draft. Only hashed hourly address counters are saved in `_websiteContactRateLimits`, not message bodies. Input bounds, allowed origins, a honeypot and five-attempt hourly limits apply. Configure its `expiresAt` TTL with `node scripts/configure_contact_ttl.cjs --project PROJECT` (preview), followed by the same command with `--apply`; the timestamp alone does not enable automatic deletion.

Verification: all five existing/new tests passed with the local Firestore Emulator (demo project; delivery mocked, no outbound mail). Browser-rendered contact layout inspected at default viewport and 390px mobile. Java runtime for local emulator: `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`, with `/opt/homebrew/opt/openjdk@21/bin` prepended to PATH. Frontend syntax and public bundle build checked.

Published November 9, 2026 from exact committed SHA `3755630cd3aba9de354f2c81d6222e89a2a107b8`, after Emulator tests and a real browser submission against cloud Dev. Owner-supplied social links added to homepage, Contact us and About footers: Instagram `https://www.instagram.com/stelli.app/` and TikTok `https://www.tiktok.com/@stelliapp`. Dev and production submissions showed success after the provider accepted the messages. Inbox receipt is not separately confirmed; the existing sending-only provider API key does not allow delivery-event reads. See `docs/CONTACT_RELEASE_2026-11-09.md` and its QA evidence for deployed file hashes, function read-back and screenshots. Deploy only the website codebase and Hosting. No app/backend deployment or existing subscriber removal is part of this preparation.
