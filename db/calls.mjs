const fail=m=>{throw new Error(m)};
const text=(v,max=3000)=>typeof v==='string'&&v.length<=max?v.trim():fail('Champ texte invalide.');
function date(v){const s=text(v,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)fail('Date invalide.');return s;}
const channels=['Appel téléphonique','Email','WhatsApp','SMS'];
export async function recordCall(db,b,actor){
 const cid=text(b.clientId,200),sid=b.saleId?text(b.saleId,200):null;
 if(!await db.prepare('SELECT id FROM clients WHERE id=?').bind(cid).first())fail('Client introuvable.');
 if(sid&&!await db.prepare('SELECT id FROM sales WHERE id=? AND client_id=?').bind(sid,cid).first())fail('Parcelle invalide pour ce client.');
 const id=text(b.requestId,200);if(!/^[0-9a-f-]{36}$/i.test(id))fail('Référence invalide.');
 const channel=text(b.channel??'Appel téléphonique',60);if(!channels.includes(channel))fail('Canal invalide.');
 const callDate=date(b.callDate);if(callDate>new Date().toISOString().slice(0,10))fail('Date d’appel invalide : choisissez une date passée ou aujourd’hui.');
 const outcome=text(b.outcome,80);if(!['Client non joint','Demande de rappel','Prévoit de payer','Client joint — autre résultat','Sans réponse','Demande de relance','Engagement de paiement','Client a répondu — autre résultat'].includes(outcome))fail('Résultat invalide.');
 const summary=text(b.summary);if(!summary)fail('Résumé de l’action obligatoire.');
 const clientResponse=text(b.clientResponse??'');
 const agent=text(b.agent??'',200)||actor;
 if(b.hasCommitment!==undefined&&typeof b.hasCommitment!=='boolean'||b.planNext!==undefined&&typeof b.planNext!=='boolean')fail('Choix de suivi invalide.');
 const recall=['Demande de rappel','Demande de relance'].includes(outcome),payment=b.hasCommitment??['Prévoit de payer','Engagement de paiement'].includes(outcome);
 const nextDate=b.planNext===false?null:b.nextDate?date(b.nextDate):null;if(b.planNext===true&&!nextDate)fail('Date de la prochaine action obligatoire.');if(recall&&!nextDate)fail('Date de rappel obligatoire.');if(nextDate&&nextDate<callDate)fail('Date de rappel invalide : elle précède l’action.');
 const nextChannel=text(b.nextChannel??channel,60);if(!channels.includes(nextChannel))fail('Canal de relance invalide.');
 const paymentDate=payment?date(b.paymentDate):null;if(paymentDate&&paymentDate<callDate)fail('Date de paiement invalide : elle précède l’action.');
 let promisedAmount=null;if(payment&&b.promisedAmount!==''&&b.promisedAmount!=null){promisedAmount=Math.round(Number(b.promisedAmount)*100);if(!Number.isSafeInteger(promisedAmount)||promisedAmount<=0||promisedAmount>1e14)fail('Montant promis invalide.');if(!sid)fail('Parcelle obligatoire pour enregistrer le montant promis.');}
 const effectiveNextDate=b.planNext===undefined?(nextDate??paymentDate):nextDate;
 const nextTitle=effectiveNextDate?(b.nextTitle!==undefined?text(b.nextTitle,250):payment?'Vérifier le paiement annoncé':channel==='Appel téléphonique'?'Rappeler le client':'Relancer le client'):'';if(effectiveNextDate&&!nextTitle)fail('Intitulé de la prochaine action obligatoire.');
 const nextResponsible=effectiveNextDate?(text(b.nextResponsible??'',200)||agent):'';
 const prev=await db.prepare('SELECT * FROM call_logs WHERE id=?').bind(id).first();if(prev){if(prev.action_id!==(b.taskId||null)||prev.client_id!==cid||prev.call_date!==callDate||prev.outcome!==outcome||prev.summary!==summary||prev.sale_id!==sid||prev.next_date!==effectiveNextDate||prev.payment_date!==paymentDate||prev.promised_amount!==promisedAmount||(b.nextTitle!==undefined&&prev.next_title!==nextTitle)||(b.nextResponsible!==undefined&&prev.next_responsible!==nextResponsible)||prev.next_channel!==nextChannel||prev.channel!==channel||prev.client_response!==clientResponse||prev.agent!==agent||(b.existingPromiseId&&prev.promise_id!==b.existingPromiseId))fail('Référence déjà utilisée.');return{id};}
 let task=null;if(b.taskId){task=await db.prepare('SELECT * FROM collection_actions WHERE id=? AND client_id=?').bind(text(b.taskId,200),cid).first();if(!task)fail('Action introuvable.');if(task.version!==b.version)fail('Cette action a été modifiée. Rechargez avant de réessayer.');if(!['À faire','En cours'].includes(task.status))fail('Action déjà clôturée.');if(task.kind!==channel)fail('Type d’action invalide pour ce canal.');}
 // A confirmation links to an existing commitment and does not add its amount a second time.
 let existingPromise=null;if(b.existingPromiseId){existingPromise=await db.prepare('SELECT * FROM promises WHERE id=? AND client_id=?').bind(text(b.existingPromiseId,200),cid).first();if(!existingPromise||existingPromise.status!=='En attente'||existingPromise.sale_id!==sid||existingPromise.amount!==promisedAmount||existingPromise.due_date!==paymentDate)fail('Engagement existant invalide : choisissez sa parcelle, son montant et sa date.');if(existingPromise.version!==b.promiseVersion)fail('Cet engagement a été modifié. Rechargez.');}
 const now=new Date().toISOString(),conditions=[],guardValues=[];
 if(task){conditions.push('EXISTS (SELECT 1 FROM collection_actions WHERE id=? AND version=?)');guardValues.push(task.id,b.version);}
 if(existingPromise){conditions.push("EXISTS (SELECT 1 FROM promises WHERE id=? AND version=? AND status='En attente')");guardValues.push(existingPromise.id,b.promiseVersion);}
 const guard=conditions.length?' WHERE '+conditions.join(' AND '):'';
 const insert=(table,cols,values)=>db.prepare(`INSERT INTO ${table} (${cols}) SELECT ${values.map(()=>'?').join(',')}${guard}`).bind(...values,...guardValues);
 const promiseId=existingPromise?.id??(promisedAmount!==null?crypto.randomUUID():null),commands=[];
 if(promiseId&&!existingPromise)commands.push(insert('promises','id,client_id,sale_id,amount,due_date,status,comment,result,created_at,updated_at,actor',[promiseId,cid,sid,promisedAmount,paymentDate,'En attente','Engagement recueilli par '+channel+' du '+callDate+' : '+(clientResponse||summary),'',now,now,actor]));
 commands.push(insert('call_logs','id,client_id,sale_id,action_id,channel,next_channel,next_title,next_responsible,client_response,promise_id,call_date,outcome,summary,next_date,payment_date,promised_amount,agent,actor,created_at',[id,cid,sid,task?.id??null,channel,nextChannel,nextTitle,nextResponsible,clientResponse,promiseId,callDate,outcome,summary,effectiveNextDate,paymentDate,promisedAmount,agent,actor,now]));
 const nextId=effectiveNextDate?crypto.randomUUID():null;
 if(effectiveNextDate)commands.push(insert('collection_actions','id,client_id,sale_id,title,kind,due_date,priority,responsible,status,comment,result,completed_at,created_at,updated_at,actor',[nextId,cid,sid,nextTitle,nextChannel,effectiveNextDate,task?.priority??'Normale',nextResponsible,'À faire','Suite à l’action du '+callDate+' : '+outcome,'',null,now,now,actor]));
 commands.push(insert('audit','id,sale_id,action,before,after,created_at,actor',[crypto.randomUUID(),sid,'Action de recouvrement réalisée',task?JSON.stringify(task):null,JSON.stringify({id,clientId:cid,channel,clientResponse,outcome,callDate,summary,nextDate:effectiveNextDate,paymentDate,promisedAmount,promiseId,agent,nextId,nextTitle,nextResponsible}),now,actor]));
 if(task)commands.push(db.prepare("UPDATE collection_actions SET status='Terminée',result=?,completed_at=?,updated_at=?,actor=?,version=version+1 WHERE id=? AND version=?"+(existingPromise?" AND EXISTS (SELECT 1 FROM promises WHERE id=? AND version=? AND status='En attente')":'')).bind(outcome+' — '+summary+(clientResponse?'\nRéponse du client : '+clientResponse:''),callDate+'T12:00:00.000Z',now,actor,task.id,b.version,...(existingPromise?[existingPromise.id,b.promiseVersion]:[])));
 const res=await db.batch(commands);if(!res.at(-1).meta.changes)fail('Modification concurrente : rechargez.');return{id,nextId,promiseId};
}
