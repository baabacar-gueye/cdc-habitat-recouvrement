import test from 'node:test';
import assert from 'node:assert/strict';
import {randomToken,tokenHash,hashPassword,verifyPassword,sessionCookie,authorizedUser,safeOrigin} from '../lib/auth.mjs';
test('passwords use a random salt and reject incorrect values',async()=>{
 const a=await hashPassword('mot-de-passe-unique-2026'),b=await hashPassword('mot-de-passe-unique-2026');
 assert.notEqual(a,b);
 assert.equal(await verifyPassword('mot-de-passe-unique-2026',a),true);
 assert.equal(await verifyPassword('mauvais-mot-de-passe',a),false);
 await assert.rejects(hashPassword('court'));
});
test('session and invitation tokens are unpredictable and stored as hashes',async()=>{
 const token=randomToken();
 assert.match(token,/^[a-f0-9]{64}$/);
 assert.notEqual(token,randomToken());
 assert.notEqual(await tokenHash(token),token);
 assert.match(sessionCookie(token),/HttpOnly; Secure; SameSite=Lax/);
 const db={prepare:()=>({bind:hash=>({first:async()=>hash===await tokenHash(token)?{email:'agent@cdc-habitat.sn',role:'agent'}:null})})};
 const req=new Request('https://recouvrement.cdc-habitat.sn/api/data',{headers:{cookie:'__Host-cdc_session='+token}});
 assert.equal((await authorizedUser(req,{},db)).role,'agent');
 assert.equal(await authorizedUser(new Request(req.url),{},db),null);
});
test('unsafe origins are not accepted for account operations',()=>{
 assert.equal(safeOrigin(new Request('https://recouvrement.cdc-habitat.sn/api/auth/login',{headers:{origin:'https://recouvrement.cdc-habitat.sn'}})),true);
 assert.equal(safeOrigin(new Request('https://recouvrement.cdc-habitat.sn/api/auth/login',{headers:{origin:'https://evil.example'}})),false);
});
