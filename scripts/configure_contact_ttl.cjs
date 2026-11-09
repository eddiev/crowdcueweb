#!/usr/bin/env node
// Narrow configuration for expiring contact abuse counters; no data deletion API.
const {createRequire} = require('node:module');
const path = require('node:path');
const req = createRequire(path.join(__dirname, '../functions/package.json'));
const {GoogleAuth} = req('google-auth-library');
const args = process.argv.slice(2);
const project = args[args.indexOf('--project') + 1];
if (!args.includes('--project') || !['crowdcue-dev', 'crowdcue-775b5'].includes(project)) throw Error('Specify an explicit Stelli project.');
(async () => {
  const client = await new GoogleAuth({scopes: ['https://www.googleapis.com/auth/cloud-platform']}).getClient();
  const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/collectionGroups/_websiteContactRateLimits/fields/expiresAt`;
  const before = (await client.request({url})).data;
  console.log(JSON.stringify({project, mode: args.includes('--apply') ? 'apply' : 'dry-run', ttl: before.ttlConfig || null}));
  if (args.includes('--apply') && !['ACTIVE', 'CREATING'].includes(before.ttlConfig?.state)) {
    const operation = (await client.request({url, method: 'PATCH', params: {updateMask: 'ttlConfig'}, data: {ttlConfig: {}}})).data;
    console.log(JSON.stringify({project, operation: operation.name}));
  }
})().catch(e => { console.error(e.response?.status || e.code || 'error', e.response?.data?.error?.message || 'Contact TTL configuration failed.'); process.exitCode = 1; });
