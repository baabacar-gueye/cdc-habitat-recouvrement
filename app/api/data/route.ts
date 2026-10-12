import {env} from 'cloudflare:workers';
import {listData,mutate} from '@/db/service.mjs';
import {authorizedUser} from '@/lib/auth.mjs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
function db(){if(!env.DB)throw new Error('Base indisponible');return env.DB;}
const denied=()=>Response.json({error:'Connexion requise ou compte non autorisé.'},{status:403,headers});
export async function GET(request:Request){
 let user;try{user=await authorizedUser(request,env,db());if(!user)return denied();}catch{return denied();}
 try{return Response.json({...await listData(db()),currentUser:user},{headers});}
 catch(e){console.error('data',e);return Response.json({error:'La base est momentanément indisponible.'},{status:503,headers});}
}
export async function POST(request:Request){
 let user;try{user=await authorizedUser(request,env,db());if(!user)return denied();}catch{return denied();}
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Requête interdite.'},{status:403,headers});
 if(!(request.headers.get('content-type')??'').startsWith('application/json'))return Response.json({error:'Format invalide.'},{status:415,headers});
 try{
  const b=await request.json() as Record<string,any>;
  if(!b||typeof b!=='object'||Array.isArray(b))throw new Error('Action invalide.');
  const agentActions=['collection_interaction','collection_promise_status','collection_status','collection_update'];
  if(user.role==='agent'&&!agentActions.includes(b.action))return Response.json({error:'Droits insuffisants.'},{status:403,headers});
  if(user.role==='superviseur'&&b.action==='payment')return Response.json({error:'Versement réservé au responsable.'},{status:403,headers});
  if(['collection_create','collection_complete','collection_promise'].includes(b.action))return Response.json({error:'Enregistrez une action réalisée pour prévoir une relance ou un engagement.'},{status:400,headers});
  if(b.action==='collection_interaction'){b.agent=user.email;if(b.planNext!==false&&b.nextDate&&!b.nextResponsible)b.nextResponsible=user.email;}
  return Response.json(await mutate(db(),b,user.email),{headers});
 }catch(e){console.error('mutation',e);const message=e instanceof Error?e.message:'';const business=/invalide|introuvable|obligatoire|déjà|concurrente|modifiée|Saisissez|Renseignez|supérieur|reconnue|Nom du|terminée|clôturée/.test(message);return Response.json({error:business?message:'Enregistrement impossible. Vos données saisies sont conservées.'},{status:business?400:503,headers});}
}
