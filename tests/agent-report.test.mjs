import assert from 'node:assert/strict';
import {agentPerformance,csvRows,reportHtml} from '../app/collection-report.mjs';
const actions=[
 {due_date:'2026-10-04',responsible:' Fatou ',kind:'Appel téléphonique',status:'Terminée'},
 {due_date:'2026-10-06',responsible:'fatou',kind:'Email',status:'À faire'},
 {due_date:'2026-10-08',responsible:'Fatou',kind:'SMS',status:'À faire'},
 {due_date:'2026-10-05',responsible:'Ibrahima',kind:'WhatsApp',status:'Annulée'},
 {due_date:'2026-10-06',responsible:'Ibrahima',kind:'WhatsApp',status:'En cours'},
];
const calls=[
 {id:'first',agent:'Fatou',client_id:'c1',channel:'Appel téléphonique',call_date:'2026-10-04',outcome:'Client a répondu — autre résultat',client_response:'Payera',promise_id:'p1',created_at:'2026-10-04T10:00:00Z'},
 {id:'repeat',agent:'fatou',client_id:'c1',channel:'Email',call_date:'2026-10-06',outcome:'Client a répondu — autre résultat',promise_id:'p1',created_at:'2026-10-06T11:00:00Z'},
 {id:'manual-confirmation',agent:'Ibrahima',client_id:'c2',channel:'WhatsApp',call_date:'2026-10-06',outcome:'Client a répondu — autre résultat',promise_id:'p2',created_at:'2026-10-06T11:00:00Z'},
 {id:'outside',agent:'Fatou',client_id:'c3',channel:'SMS',call_date:'2026-09-30',outcome:'Sans réponse',created_at:'2026-09-30T10:00:00Z'},
];
const promises=[{id:'p1',client_id:'c1',amount:15000000,created_at:'2026-10-04T10:00:00Z'},{id:'p2',client_id:'c2',amount:2000000,created_at:'2026-10-01T10:00:00Z'}];
const p=agentPerformance(actions,calls,promises,'2026-10-01','2026-10-07','Tous les canaux','2026-10-07');
assert.equal(p.summary.length,2);
const f=p.summary.find(x=>x.key==='fatou'),i=p.summary.find(x=>x.key==='ibrahima');
assert.equal(f.realized,2);assert.equal(f.clients,1);assert.equal(f.commitmentCount,1);assert.equal(f.commitmentAmount,15000000);
assert.equal(f.plannedDue,2);assert.equal(f.completedDue,1);assert.equal(f.overdue,1);assert.equal(f.rate,50);
assert.equal(i.realized,1);assert.equal(i.commitmentAmount,0);assert.equal(i.plannedDue,1);assert.equal(i.overdue,1);
assert.equal(p.attributedPromises.length,1);
const email=agentPerformance(actions,calls,promises,'2026-10-01','2026-10-07','Email','2026-10-07');assert.equal(email.summary.find(x=>x.key==='fatou').realized,1);assert.equal(email.attributedPromises.length,0);
const csv=csvRows([['Agent','Montant'],['=cmd','15 000']]);assert.ok(csv.includes("'=cmd"));
const html=reportHtml('Agents','Période', [{title:'Résultats',rows:[['Agent'],['<script>']]}]);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
console.log('PASS: agent attribution, unique commitments, manual confirmations excluded, completion rate, overdue, period/channel filters, safe exports.');
