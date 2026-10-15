import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createDb} from '../db/client.mjs';

test('Neon adapter binds PostgreSQL parameters and reports writes', async()=>{
 const queries=[],transactions=[];
 const sql={
  async query(query,values){queries.push({query,values});return query.startsWith('SELECT')?[{id:'row'}]:[{changed:1}];},
  async transaction(statements){transactions.push(statements);return Promise.all(statements);}
 };
 const db=createDb(sql);
 assert.deepEqual(await db.prepare('SELECT id FROM clients WHERE email=?').bind('agent@example.com').first(),{id:'row'});
 assert.equal(queries[0].query,'SELECT id FROM clients WHERE email=$1');
 assert.deepEqual(queries[0].values,['agent@example.com']);
 const update=await db.prepare('UPDATE clients SET first=? WHERE id=?').bind('Agent','row').run();
 assert.equal(update.meta.changes,1);
 assert.equal(queries[1].query,'UPDATE clients SET first=$1 WHERE id=$2 RETURNING 1');

 const result=await db.batch([
  db.prepare('INSERT INTO audit(id,action) VALUES(?,?)').bind('audit-1','test'),
  db.prepare('DELETE FROM sessions WHERE token_hash=?').bind('token-hash')
 ]);
 assert.equal(transactions.length,1);
 assert.equal(transactions[0].length,2);
 assert.deepEqual(result.map(entry=>entry.meta.changes),[1,1]);
 assert.equal(queries[2].query,'INSERT INTO audit(id,action) VALUES($1,$2) RETURNING 1');
 assert.equal(queries[3].query,'DELETE FROM sessions WHERE token_hash=$1 RETURNING 1');
});
