# Contact and social website release — November 9, 2026

Published at https://stelliapp.com/ and https://stelliapp.com/contact.html.

Deployment source: `/private/tmp/stelli-contact-release-20261109/source`, exact committed SHA `3755630cd3aba9de354f2c81d6222e89a2a107b8`. Canonical source `/Users/eddiev/Dev/crowdcueweb` fast-forwarded to that commit; source pushed to `codex/launch-safety-policy-20261102`. Only `functions:stelli-website:contactStelli` and Hosting deployed, explicitly to Dev then production. No app functions, Firestore rules, Auth identities, subscriber records or media assets were changed.

## Behavior

- Dedicated Contact us page with name, email and message; fixed support inbox with visitor Reply-To and direct email fallback.
- Homepage launch-signup section removed; navigation and existing launch CTAs lead to Contact us.
- Beta-access links removed, including the invitation fallback.
- Owner-supplied Instagram and TikTok links in Home, Contact and About footers.
- Existing launch subscriber records and subscription endpoint retained.
- Existing live playback guide and disclosure release `1909407` merged intact. Production homepage before release matched that branch by SHA256; comparison against it limits changes to the requested contact/social scope.

## Verification

All five contact/signup tests passed in the local Firebase Emulator; no skipped tests. Full syntax checks and public bundle build passed. Existing Firebase email secrets bound through the deployment; no credentials recorded in source or evidence.

Dev run `qa_contact_20261109_a`: real Mac browser submitted the form; success shown after provider acceptance. Foreign-origin and invalid-input checks returned403 and400. Contact at390px had no horizontal overflow; fresh-cache homepage also verified at390px, with the guide and Contact us navigation retained. One production smoke submission likewise showed success. Inbox receipt/delivery event is not separately confirmed because the existing provider credential is sending-only and the isolated browser has no authenticated dashboard session.

Twelve production file hashes match the deployed source, including the preserved how-to page, script and stylesheet. Apple association route still returns200/application-json. No media files changed; no new media playback acceptance is claimed.

`_websiteContactRateLimits.expiresAt` TTL configured in each project. Activation state, deployed function revisions and source references are recorded in `qa-evidence/contact-2026-11-09/deployment.json`. The timestamp is48hours after each attempt; Firestore TTL removal is asynchronous.

Evidence: `docs/qa-evidence/contact-2026-11-09/`. Deployment logs remain under `/private/tmp/stelli-contact-release-20261109/`. Unrelated `.DS_Store`, Firebase cache and local summary changes were preserved and excluded from commits.
