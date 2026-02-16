# crowdcueweb
Repository for the official CrowdCue website.

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
curl -i https://crowdcueapp.com/.well-known/apple-app-site-association
curl -i https://crowdcueapp.com/apple-app-site-association
```

Expected:
- `HTTP/2 200`
- `content-type: application/json`
- no redirect on the apex host endpoints
