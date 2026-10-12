import {recordCall} from './calls.mjs';
const fail=m=>{throw new Error(m)};
const txt=(v,n=200)=>typeof v==='string'&&v.length<=n?v.trim():fail('Champ texte invalide.');
const date=v=>{const s=txt(v,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)fail('Date invalide.');return s};
const kinds=['Appel téléphonique','WhatsApp','Email','SMS','Courrier','Rendez-vous','Mise en demeure','Autre'];
function requestId(b){const id=txt(b.requestId);if(!/^[0-9a-f-]{36}$/i.test(id))fail('Référence invalide.');return id}
async function target(db,b,requireSale=false){const cid=txt(b.clientId);if(!await db.prepare('SELECT id FROM clients WHERE id=?').bind(cid).first())fail('Client introuvable.');const sid=b.saleId?txt(b.saleId):null;if(requireSale&&!sid)fail('Parcelle obligatoire.');if(sid&&!await db.prepare('SELECT id FROM sales WHERE id=? AND client_id=?').bind(sid,cid).first())fail('Parcelle invalide pour ce client.');return {cid,sid};}
function actionFields(b){const title=txt(b.title,250);if(!title)fail('Intitulé obligatoire.');const kind=txt(b.kind,60);if(!kinds.includes(kind))fail('Type d’action invalide.');const priority=txt(b.priority,30);if(!['Normale','Haute','Urgente'].includes(priority))fail('Priorité invalide.');return{title,kind,due:date(b.dueDate),priority,responsible:txt(b.responsible,200),comment:txt(b.comment,3000)};}
function actionInsert(db,id,cid,sid,f,now,actor){return db.prepare("INSERT INTO collection_actions (id,client_id,sale_id,title,kind,due_date,priority,responsible,status,comment,result,completed_at,created_at,updated_at,actor) VALUES (?,?,?,?,?,?,?,?, 'À faire',?,'',NULL,?,?,?)").bind(id,cid,sid,f.title,f.kind,f.due,f.priority,f.responsible,f.comment,now,now,actor);}
export async function mutateCollection(db,b,actor){
 if(['collection_call','collection_interaction'].includes(b.action))return recordCall(db,b,actor);
 const now=new Date().toISOString(),uuid=()=>crypto.randomUUID();
 const audit=(id,sid,label,before,after)=>db.prepare('INSERT INTO audit (id,sale_id,action,before,after,created_at,actor) VALUES (?,?,?,?,?,?,?)').bind(id,sid,label,before?JSON.stringify(before):null,JSON.stringify(after),now,actor);
 if(b.action==='collection_create'){
  const {cid,sid}=await target(db,b),f=actionFields(b),id=requestId(b);
  const existing=await db.prepare('SELECT * FROM collection_actions WHERE id=?').bind(id).first();if(existing){if(existing.client_id!==cid||existing.title!==f.title)fail('Référence déjà utilisée.');return{id};}
  await db.batch([actionInsert(db,id,cid,sid,f,now,actor),audit(uuid(),sid,'Action de recouvrement créée',null,{id,clientId:cid,...f})]);return{id};
 }
 if(['collection_update','collection_complete','collection_status'].includes(b.action)){
  const id=txt(b.id),before=await db.prepare('SELECT * FROM collection_actions WHERE id=?').bind(id).first();if(!before)fail('Action introuvable.');if(before.version!==b.version)fail('Cette action a été modifiée. Rechargez avant de réessayer.');
  if(b.action==='collection_update'){
   if(['Terminée','Annulée'].includes(before.status))fail('Action terminée : créez une nouvelle action.');const f=actionFields(b);
   const res=await db.batch([db.prepare('INSERT INTO audit (id,sale_id,action,before,after,created_at,actor) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM collection_actions WHERE id=? AND version=?)').bind(uuid(),before.sale_id,'Action de recouvrement modifiée',JSON.stringify(before),JSON.stringify(f),now,actor,id,b.version),db.prepare('UPDATE collection_actions SET title=?,kind=?,due_date=?,priority=?,responsible=?,comment=?,updated_at=?,actor=?,version=version+1 WHERE id=? AND version=?').bind(f.title,f.kind,f.due,f.priority,f.responsible,f.comment,now,actor,id,b.version)]);if(!res[1].meta.changes)fail('Modification concurrente : rechargez.');return{id};
  }
  if(b.action==='collection_status'){
   const status=txt(b.status,30);if(!['À faire','En cours','Annulée'].includes(status))fail('Statut invalide.');if(before.status==='Terminée')fail('Action terminée : créez une nouvelle action.');const result=status==='Annulée'?txt(b.result,3000):before.result;if(status==='Annulée'&&!result)fail('Motif d’annulation obligatoire.');
   const res=await db.batch([db.prepare('INSERT INTO audit (id,sale_id,action,before,after,created_at,actor) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM collection_actions WHERE id=? AND version=?)').bind(uuid(),before.sale_id,'Statut de recouvrement modifié',JSON.stringify(before),JSON.stringify({status,result}),now,actor,id,b.version),db.prepare('UPDATE collection_actions SET status=?,result=?,updated_at=?,actor=?,version=version+1 WHERE id=? AND version=?').bind(status,result,now,actor,id,b.version)]);if(!res[1].meta.changes)fail('Modification concurrente : rechargez.');return{id};
  }
  if(['Terminée','Annulée'].includes(before.status))fail('Action déjà clôturée.');const result=txt(b.result,3000);if(!result)fail('Compte rendu obligatoire.');const statements=[];let next=null;
  const nextDue=b.nextDate?date(b.nextDate):null;if(nextDue){const title=txt(b.nextTitle,250);if(!title)fail('Intitulé de la prochaine action obligatoire.');next={id:uuid(),title,date:nextDue};statements.push(db.prepare("INSERT INTO collection_actions (id,client_id,sale_id,title,kind,due_date,priority,responsible,status,comment,result,completed_at,created_at,updated_at,actor) SELECT ?,?,?,?,?,?,?,?, 'À faire','','',NULL,?,?,? WHERE EXISTS (SELECT 1 FROM collection_actions WHERE id=? AND version=?)").bind(next.id,before.client_id,before.sale_id,title,before.kind,nextDue,before.priority,before.responsible,now,now,actor,id,b.version));}
  statements.push(db.prepare('INSERT INTO audit (id,sale_id,action,before,after,created_at,actor) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM collection_actions WHERE id=? AND version=?)').bind(uuid(),before.sale_id,'Action terminée',JSON.stringify(before),JSON.stringify({status:'Terminée',result,next}),now,actor,id,b.version));
  statements.push(db.prepare("UPDATE collection_actions SET status='Terminée',result=?,completed_at=?,updated_at=?,actor=?,version=version+1 WHERE id=? AND version=?").bind(result,now,now,actor,id,b.version));const res=await db.batch(statements);if(!res.at(-1).meta.changes)fail('Modification concurrente : rechargez.');return{id,nextId:next?.id??null};
 }
 if(b.action==='collection_promise'){
  const {cid,sid}=await target(db,b,true),id=requestId(b),amount=Math.round(Number(b.amount)*100);if(!Number.isSafeInteger(amount)||amount<=0||amount>1e14)fail('Montant invalide.');const due=date(b.dueDate),comment=txt(b.comment,3000);
  const prev=await db.prepare('SELECT * FROM promises WHERE id=?').bind(id).first();if(prev){if(prev.client_id!==cid||prev.sale_id!==sid||prev.amount!==amount||prev.due_date!==due)fail('Référence déjà utilisée.');return{id};}
  await db.batch([db.prepare("INSERT INTO promises (id,client_id,sale_id,amount,due_date,status,comment,result,created_at,updated_at,actor) VALUES (?,?,?,?,?,'En attente',?,'',?,?,?)").bind(id,cid,sid,amount,due,comment,now,now,actor),audit(uuid(),sid,'Engagement de paiement enregistré',null,{id,clientId:cid,amount,due,comment})]);return{id};
 }
 if(b.action==='collection_promise_status'){
  const id=txt(b.id),before=await db.prepare('SELECT * FROM promises WHERE id=?').bind(id).first();if(!before)fail('Engagement introuvable.');if(before.version!==b.version)fail('Cet engagement a été modifié. Rechargez avant de réessayer.');const status=txt(b.status,40);if(!['En attente','Honorée','Annulée'].includes(status))fail('Statut invalide.');const result=txt(b.result,3000);if(!result)fail('Commentaire de vérification obligatoire.');
  const res=await db.batch([db.prepare('INSERT INTO audit (id,sale_id,action,before,after,created_at,actor) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM promises WHERE id=? AND version=?)').bind(uuid(),before.sale_id,'Engagement de paiement vérifié',JSON.stringify(before),JSON.stringify({status,result}),now,actor,id,b.version),db.prepare('UPDATE promises SET status=?,result=?,updated_at=?,actor=?,version=version+1 WHERE id=? AND version=?').bind(status,result,now,actor,id,b.version)]);if(!res[1].meta.changes)fail('Modification concurrente : rechargez.');return{id};
 }
 fail('Action non reconnue.');
}
