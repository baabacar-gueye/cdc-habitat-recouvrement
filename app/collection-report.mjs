export const isOpen=a=>['À faire','En cours'].includes(a.status);
export const sumCommitments=promises=>({pending:promises.filter(p=>p.status==='En attente').reduce((s,p)=>s+p.amount,0),honored:promises.filter(p=>p.status==='Honorée').reduce((s,p)=>s+p.amount,0),cancelled:promises.filter(p=>p.status==='Annulée').reduce((s,p)=>s+p.amount,0)});
export function selectPeriod(items,dateKey,from,to,agentKey,agent='',channelKey='',channel='Tous les canaux'){
 return items.filter(a=>(!from||a[dateKey].slice(0,10)>=from)&&(!to||a[dateKey].slice(0,10)<=to)&&(!agent||String(a[agentKey]??'').toLowerCase().includes(agent.toLowerCase()))&&(!channelKey||channel==='Tous les canaux'||a[channelKey]===channel));
}
export function csvRows(rows){return '\uFEFF'+rows.map(row=>row.map(v=>{const s=String(v??'');return '"'+(/^[\s]*[=+@-]/.test(s)?"'":'')+s.replaceAll('"','""')+'"'}).join(';')).join('\r\n');}
export const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reportHtml(title,subtitle,sections){return '<!doctype html><html lang="fr"><meta charset="utf-8"><title>'+escapeHtml(title)+'</title><style>body{font:12px Arial;color:#17364b;margin:30px}h1{font-size:23px}h2{margin-top:26px;font-size:17px}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{padding:7px;border:1px solid #ccd6dd;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#edf3f6}thead{display:table-header-group}tr{break-inside:avoid}button{padding:10px 18px} @media print{button{display:none}body{margin:0}@page{size:A4 landscape;margin:12mm}}</style><h1>'+escapeHtml(title)+'</h1><p>'+escapeHtml(subtitle)+'</p><button onclick="window.print()">Imprimer / enregistrer en PDF</button>'+sections.map(s=>'<h2>'+escapeHtml(s.title)+'</h2><table><thead><tr>'+s.rows[0].map(v=>'<th>'+escapeHtml(v)+'</th>').join('')+'</tr></thead><tbody>'+s.rows.slice(1).map(r=>'<tr>'+r.map(v=>'<td>'+escapeHtml(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>').join('')+'</html>';}

// Operational performance: actions by their recorded agent, scheduled tasks by their current assignee.
// A promise belongs to the agent only when it was created in that recorded interaction.
export function agentPerformance(actions, interactions, promises, from, to, channel='Tous les canaux', today=new Date().toISOString().slice(0,10)){
 const inPeriod=d=>d&&(!from||d.slice(0,10)>=from)&&(!to||d.slice(0,10)<=to);
 const channelMatches=v=>channel==='Tous les canaux'||v===channel;
 const key=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR')||'__non_affecte__';
 const label=v=>String(v??'').trim().replace(/\s+/g,' ')||'Non affecté';
 const agents=new Map();
 const get=v=>{const k=key(v);if(!agents.has(k))agents.set(k,{key:k,name:label(v),realized:0,answered:0,clients:new Set(),byChannel:{'Appel téléphonique':0,Email:0,WhatsApp:0,SMS:0},commitmentCount:0,commitmentAmount:0,plannedDue:0,completedDue:0,overdue:0,upcoming:0});return agents.get(k)};
 const planned=actions.filter(a=>inPeriod(a.due_date)&&channelMatches(a.kind));
 for(const a of planned){const x=get(a.responsible);if(a.status==='Annulée')continue;if(a.due_date<=today){x.plannedDue++;if(a.status==='Terminée')x.completedDue++;else if(isOpen(a)&&a.due_date<today)x.overdue++;}else if(isOpen(a))x.upcoming++;}
 const realized=interactions.filter(c=>inPeriod(c.call_date)&&channelMatches(c.channel));
 const promiseById=new Map(promises.map(p=>[p.id,p]));
 const attributedPromises=[];const seen=new Set();
 for(const c of realized){const x=get(c.agent);x.realized++;if(c.client_id)x.clients.add(c.client_id);if(c.client_response||!['Sans réponse','Client non joint','Compte rendu antérieur'].includes(c.outcome))x.answered++;if(Object.hasOwn(x.byChannel,c.channel))x.byChannel[c.channel]++;
  const p=promiseById.get(c.promise_id);if(p&&!seen.has(p.id)&&p.created_at===c.created_at&&p.client_id===c.client_id){seen.add(p.id);x.commitmentCount++;x.commitmentAmount+=p.amount;attributedPromises.push({...p,agent:x.name,action_date:c.call_date,channel:c.channel});}
 }
 const summary=[...agents.values()].sort((a,b)=>b.realized-a.realized||b.commitmentAmount-a.commitmentAmount||a.name.localeCompare(b.name,'fr')).map(x=>({...x,clients:x.clients.size,rate:x.plannedDue?Math.round(x.completedDue/x.plannedDue*100):null}));
 return {summary,planned,realized,attributedPromises};
}
