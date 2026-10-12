import source from './import-source.json' with {type:'json'};
import {mutateCollection} from './collection.mjs';
export const sourceAudit=source.audit;
export async function bootstrap(db){
 if(await db.prepare("SELECT value FROM settings WHERE key = 'initial_import'").first())return;
 const commands=[];
 for(const c of source.clients)commands.push(db.prepare('INSERT OR IGNORE INTO clients (id,first,last,nin,phone,email,address) VALUES (?,?,?,?,?,?,?)').bind(c.id,c.first,c.last,c.nin,c.phone,c.email,c.address));
 for(const s of source.sales)commands.push(db.prepare('INSERT OR IGNORE INTO sales (id,client_id,sheet,source_row,program,zone,lot,position,area,price_m2,price,baseline,baseline_fees,source_balance,date,flags,raw) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(s.id,s.clientId,s.sheet,s.sourceRow,s.program,s.zone,s.lot,s.position,s.area??null,s.priceM2??null,s.price,s.baseline,s.baselineFees,s.sourceBalance,s.date,JSON.stringify(s.flags),JSON.stringify(s.raw)));
 for(let i=0;i<commands.length;i+=50)await db.batch(commands.slice(i,i+50));
 await db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('initial_import',?)").bind(JSON.stringify({at:new Date().toISOString(),count:source.sales.length})).run();
}
const json=x=>x?JSON.parse(x):null;
export async function listData(db){
 await bootstrap(db);
 const [s,p,n,a,actions,promises,calls]=await Promise.all([
 db.prepare('SELECT s.*,c.first,c.last,c.nin,c.phone,c.email,c.address,c.version AS client_version FROM sales s JOIN clients c ON c.id=s.client_id ORDER BY s.date DESC,s.id').all(),
 db.prepare('SELECT * FROM payments ORDER BY date DESC,created_at DESC').all(),
 db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all(),
 db.prepare('SELECT * FROM audit ORDER BY created_at DESC LIMIT 300').all(),db.prepare('SELECT * FROM collection_actions ORDER BY due_date,id').all(),db.prepare('SELECT * FROM promises ORDER BY due_date,id').all(),db.prepare('SELECT * FROM call_logs ORDER BY call_date DESC,created_at DESC').all()]);
 const rows=s.results.map(r=>{
  const payments=p.results.filter(x=>x.sale_id===r.id);const extra=payments.filter(x=>x.kind==='terrain').reduce((t,x)=>t+x.amount,0);const feeExtra=payments.filter(x=>x.kind==='frais').reduce((t,x)=>t+x.amount,0);
  const flags=json(r.flags).filter(f=>!(f==='Identité manquante'&&(r.first||r.last))&&!(f==='Téléphone manquant'&&r.phone)&&f!=='Versements supérieurs au prix');
  if(r.price!==null&&r.baseline!==null&&r.baseline+extra>r.price)flags.push('Versements supérieurs au prix');
  return {...r,flags,raw:json(r.raw),payments,notes:n.results.filter(x=>x.sale_id===r.id),paid:r.baseline===null?null:r.baseline+extra,fees:r.baseline_fees===null?null:r.baseline_fees+feeExtra,balance:r.price===null||r.baseline===null?null:r.price-r.baseline-extra};
 });
 return {rows,actions:actions.results,promises:promises.results,calls:calls.results,audit:sourceAudit,activity:a.results.map(x=>({...x,before:json(x.before),after:json(x.after)}))};
}
function fail(message){throw new Error(message)}
const text=(v,max=200)=>typeof v==='string'&&v.length<=max?v.trim():fail('Champ texte invalide.');
export function money(value,required=true){if((value===''||value==null)&&!required)return null; if(typeof value!=='number'&&typeof value!=='string')fail('Montant invalide.'); const n=Number(value);if(!Number.isFinite(n)||n<0||n>1e12)fail('Montant invalide.');return Math.round(n*100);}
function validDate(v){const s=text(v,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)fail('Date invalide.');return s;}
export async function mutate(db,b,actor){
 await bootstrap(db); const now=new Date().toISOString();const uuid=()=>crypto.randomUUID();actor=text(actor,300);
 if(typeof b.action==='string'&&b.action.startsWith('collection_'))return mutateCollection(db,b,actor);
 if(b.action==='payment'){
  const id=text(b.saleId);const s=await db.prepare('SELECT * FROM sales WHERE id=?').bind(id).first();if(!s)fail('Dossier introuvable.');
  const amount=money(b.amount);if(amount<=0)fail('Le versement doit être supérieur à zéro.');if(!['terrain','frais'].includes(b.kind))fail('Nature du versement invalide.');
  if(s.baseline===null&&b.kind==='terrain')fail('Renseignez le cumul initial avant de saisir un versement.');
  const requestId=text(b.requestId);if(!/^[0-9a-f-]{36}$/i.test(requestId))fail('Référence technique invalide.');
  const prev=await db.prepare('SELECT * FROM payments WHERE id=?').bind(requestId).first();if(prev){if(prev.sale_id!==id||prev.amount!==amount||prev.kind!==b.kind||prev.date!==b.date||prev.mode!==b.mode||prev.reference!==b.reference)fail('Référence déjà utilisée.');return{id:requestId};}
  const payment={id:requestId,saleId:id,amount,kind:b.kind,date:validDate(b.date),mode:text(b.mode,60),reference:text(b.reference,150)};
  await db.batch([
   db.prepare('INSERT INTO payments (id,sale_id,amount,kind,date,mode,reference,created_at,actor) VALUES (?,?,?,?,?,?,?,?,?)').bind(payment.id,id,amount,payment.kind,payment.date,payment.mode,payment.reference,now,actor),
   db.prepare('INSERT INTO audit (id,sale_id,action,before,after,created_at,actor) VALUES (?,?,?,?,?,?,?)').bind(uuid(),id,'Versement ajouté',null,JSON.stringify(payment),now,actor)]);
  return {id:requestId};
 }
 if(b.action==='note'){
  const id=text(b.saleId);if(!await db.prepare('SELECT id FROM sales WHERE id=?').bind(id).first())fail('Dossier introuvable.');const content=text(b.content,3000);if(!content)fail('Saisissez une note.');
  const nid=uuid();await db.prepare('INSERT INTO notes (id,sale_id,content,created_at,actor) VALUES (?,?,?,?,?)').bind(nid,id,content,now,actor).run();return{id:nid};
 }
 if(b.action==='client'){
  const id=text(b.clientId);const before=await db.prepare('SELECT * FROM clients WHERE id=?').bind(id).first();if(!before)fail('Client introuvable.');if(before.version!==b.version)fail('Cette fiche a été modifiée. Rechargez-la avant de réessayer.');
  const c={first:text(b.first),last:text(b.last),nin:text(b.nin,100),phone:text(b.phone,100),email:text(b.email,200),address:text(b.address,1000)};if(!c.first&&!c.last)fail('Renseignez au moins un nom.');
  if(c.nin&&await db.prepare('SELECT id FROM clients WHERE nin=? AND id<>?').bind(c.nin,id).first())fail('Ce NIN appartient déjà à un autre client. Vérifiez avant de regrouper les dossiers.');
  const result=await db.batch([
   db.prepare('INSERT INTO audit (id,sale_id,action,before,after,created_at,actor) SELECT ?,?, ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM clients WHERE id=? AND version=?)').bind(uuid(),b.saleId??null,'Client modifié',JSON.stringify(before),JSON.stringify(c),now,actor,id,b.version),
   db.prepare('UPDATE clients SET first=?,last=?,nin=?,phone=?,email=?,address=?,version=version+1 WHERE id=? AND version=?').bind(c.first,c.last,c.nin,c.phone,c.email,c.address,id,b.version)]);
  if(!result[1].meta.changes)fail('Modification concurrente : rechargez la fiche.');return{id};
 }
 if(b.action==='sale'){
  const program=text(b.program,100),lot=text(b.lot,100);if(!program||!lot)fail('Programme et numéro de lot obligatoires.');
  if(await db.prepare('SELECT id FROM sales WHERE program=? AND lot=?').bind(program,lot).first())fail('Ce lot existe déjà dans ce programme.');
  const c={first:text(b.first),last:text(b.last),nin:text(b.nin,100),phone:text(b.phone,100),email:text(b.email),address:text(b.address,1000)};if(!c.first&&!c.last)fail('Nom du client obligatoire.');
  let existing=c.nin?await db.prepare('SELECT id FROM clients WHERE nin=? LIMIT 1').bind(c.nin).first():null;
  const clientId=existing?.id??uuid();const id=uuid();const price=money(b.price);const area=Number(b.area);if(!Number.isFinite(area)||area<=0||area>1e7)fail('Superficie invalide.');
  const commands=[];if(!existing)commands.push(db.prepare('INSERT INTO clients (id,first,last,nin,phone,email,address) VALUES (?,?,?,?,?,?,?)').bind(clientId,c.first,c.last,c.nin,c.phone,c.email,c.address));
  commands.push(db.prepare('INSERT INTO sales (id,client_id,sheet,source_row,program,zone,lot,position,area,price_m2,price,baseline,baseline_fees,source_balance,date,flags,raw) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,clientId,'Saisie',null,program,text(b.zone),lot,text(b.position),area,price/100/area,price,0,0,null,validDate(b.date),'[]','{}'));
  commands.push(db.prepare('INSERT INTO audit (id,sale_id,action,before,after,created_at,actor) VALUES (?,?,?,?,?,?,?)').bind(uuid(),id,'Dossier créé',null,JSON.stringify({clientId,lot,program,price}),now,actor));await db.batch(commands);return{id};
 }
 fail('Action non reconnue.');
}
