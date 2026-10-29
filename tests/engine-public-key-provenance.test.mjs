import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createPublicKey,verify} from 'node:crypto';
import {fileURLToPath} from 'node:url';import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
test('engine verification key is only a public Ed25519 key',()=>{
 const pem=readFileSync(join(root,'companion/engine/public-key.pem'),'utf8');
 assert.match(pem,/^-----BEGIN PUBLIC KEY-----/);assert.doesNotMatch(pem,/PRIVATE KEY/);
 assert.equal(createPublicKey(pem).asymmetricKeyType,'ed25519');
});
test('stored release signature and packaged public key agree',()=>{
 const release=JSON.parse(readFileSync(join(root,'public/engine-release.json'),'utf8'));
 const pem=readFileSync(join(root,'companion/engine/public-key.pem'),'utf8');
 const payload=JSON.parse(release.payload);
 assert.equal(payload.files.find(x=>x.path==='engine/public-key.pem')?.content,pem);
 assert.equal(verify(null,Buffer.from(release.payload),createPublicKey(pem),Buffer.from(release.signature,'base64')),true);
});
test('private PEM files remain ignored by repository rules',()=>{
 const rules=readFileSync(join(root,'.gitignore'),'utf8');
 assert.match(rules,/\*\.pem/);assert.match(rules,/!\/companion\/engine\/public-key\.pem/);
});
