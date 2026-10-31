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

The homepage uses approved D&D v10, baseball v5 and Sunset Sessions v4 brand videos. Web encodes retain their edits/audio; the original masters remain in the app marketing project. `scripts/media-sources.json` records source checksums. Do not replace a master when updating website derivatives.

Build: `python3 scripts/build_site.py`. Hosting serves only `dist/`, built from an explicit public-file allowlist. Internal Markdown, deployment records and backend source are not included. Keep the existing Auth, invitation and association-file routes intact.

Launch signup: same-origin `POST /api/launch-updates` routes to `subscribeToLaunchUpdates` in the independent `stelli-website` Functions codebase. It saves email, explicit launch-update consent, source and first signup time in the private `websiteLaunchSubscribers` Firestore collection. Duplicate email addresses are idempotent. Browser origins, input length, consent, a hidden bot field and per-address rate limits are checked. Existing app data and Firestore rules are not deployed or changed by this site release. Only the server Admin SDK writes the signup collection; client rules must continue to deny unmatched collections.

No outbound emails or campaigns are sent by signup. Launch messaging is a later action using the opted-in list. Exclude documents with `qaRunId` from a mailing export. Reserved `qa_...@stelli-demo.example` fixture addresses are tagged automatically. Removing a real subscription is currently handled through support@stelliapp.com, as disclosed on the form.

Validation: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8182 npm test --prefix functions`, then check the HTTP endpoint and browser form through the local Hosting emulator. Use named `qa_` fixtures in cloud development. Promote an exact committed SHA: deploy only `functions:stelli-website` and `hosting` to `crowdcue-dev`, verify, then deploy the same SHA to `crowdcue-775b5`. Never use `release_envs.sh` for website iteration. Never bulk-delete fixture or subscriber data.
