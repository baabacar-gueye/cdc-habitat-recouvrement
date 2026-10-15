import {env} from '@/lib/env.mjs';
import {authorizedUser,validEmail,safeOrigin,randomToken,tokenHash,noStore,errorResponse} from '@/lib/auth.mjs';
export const dynamic='force-dynamic';
const db=()=>{if(!env.DB)throw new Error('Base indisponible');return env.DB;};
async function admin(request:Request){
 const user=await authorizedUser(request,env,db());
 return user?.role==='admin'?user:null;
}
const roles=['admin','superviseur','agent'];
export async function GET(request:Request){
 const user=await admin(request);
 if(!user)return errorResponse('Accès réservé au responsable.',403);
 const team=await db().prepare("SELECT u.email,u.name,u.role,u.active,u.password_set_at,u.created_at,EXISTS(SELECT 1 FROM invitations i WHERE i.email=u.email AND i.used_at IS NULL AND i.expires_at>?) AS pending_invite FROM app_users u ORDER BY u.name").bind(new Date().toISOString()).all();
 return Response.json(team.results,{headers:noStore});
}
export async function POST(request:Request){
 const user=await admin(request);
 if(!user)return errorResponse('Accès réservé au responsable.',403);
 if(!safeOrigin(request))return errorResponse('Requête interdite.',403);
 const b=await request.json().catch(()=>null) as any,email=typeof b?.email==='string'?b.email.trim().toLowerCase():'',name=typeof b?.name==='string'?b.name.trim():'';
 if(!validEmail(email)||!name||name.length>150||!roles.includes(b?.role))return errorResponse('Nom, email ou rôle invalide.');
 const existing=await db().prepare('SELECT role FROM app_users WHERE email=?').bind(email).first() as {role:string}|null;
 if(existing&&existing.role!==b.role)return errorResponse('Modifiez le rôle dans la liste avant de renvoyer une invitation.');
 const apiKey=env.RESEND_API_KEY,from=env.INVITE_FROM,origin=env.APP_ORIGIN;
 if(!apiKey||!from?.includes('@')||from.includes('REMPLACER')||origin!=='https://recouvrement.cdc-habitat.sn')
  return errorResponse('Envoi des invitations non configuré. Contactez l’administrateur technique.',503);
 const token=randomToken(),hash=await tokenHash(token);
 const expiry=new Date(Date.now()+48*3600000).toISOString();
 await db().batch([
  db().prepare('INSERT INTO app_users(email,name,role,active) VALUES(?,?,?,1) ON CONFLICT(email) DO UPDATE SET name=excluded.name,role=excluded.role,active=1').bind(email,name,b.role),
  db().prepare('UPDATE invitations SET used_at=? WHERE email=? AND used_at IS NULL').bind(new Date().toISOString(),email),
  db().prepare('INSERT INTO invitations(token_hash,email,expires_at) VALUES(?,?,?)').bind(hash,email,expiry),
  db().prepare('INSERT INTO user_audit(id,actor,target_email,operation) VALUES(?,?,?,?)').bind(crypto.randomUUID(),user.email,email,'Invitation créée')
 ]);
 const link=origin+'/invitation?token='+token;
 let sent=false;
 try{
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
   body:JSON.stringify({from,to:[email],subject:'Invitation à l’espace recouvrement CDC HABITAT',
    text:`Bonjour ${name},\n\nVous êtes invité à accéder à l’espace de recouvrement CDC HABITAT. Ouvrez ce lien personnel pour choisir votre mot de passe (valable 48 heures) :\n\n${link}\n\nSi vous n’attendiez pas cette invitation, ignorez ce message.\n\nCDC HABITAT`})
  });
  sent=response.ok;
 }catch{sent=false;}
 if(!sent)return errorResponse('Email non envoyé. Vérifiez le service d’envoi, puis renvoyez l’invitation.',503);
 await db().prepare('UPDATE invitations SET sent_at=? WHERE token_hash=?').bind(new Date().toISOString(),hash).run();
 return Response.json({ok:true},{headers:noStore});
}
export async function PATCH(request:Request){
 const user=await admin(request);
 if(!user)return errorResponse('Accès réservé au responsable.',403);
 if(!safeOrigin(request))return errorResponse('Requête interdite.',403);
 const b=await request.json().catch(()=>null) as any,email=typeof b?.email==='string'?b.email.trim().toLowerCase():'';
 if(!validEmail(email)||!roles.includes(b?.role)||typeof b?.active!=='boolean')return errorResponse('Champs invalides.');
 if(email===user.email&&(!b.active||b.role!=='admin'))return errorResponse('Vous ne pouvez pas retirer vos propres droits.');
 const existing=await db().prepare('SELECT email,role,active FROM app_users WHERE email=?').bind(email).first() as {email:string;role:string;active:number}|null;
 if(!existing)return errorResponse('Compte introuvable.',404);
 if(existing.role==='admin'&&existing.active===1&&(!b.active||b.role!=='admin')){
  const count=await db().prepare("SELECT COUNT(*) AS total FROM app_users WHERE role='admin' AND active=1").first() as {total:number};
  if(count.total<=2)return errorResponse('Conservez au moins deux administrateurs actifs.');
 }
 const change=await db().prepare("UPDATE app_users SET role=?,active=? WHERE email=? AND (role!='admin' OR active!=1 OR (?=1 AND ?='admin') OR (SELECT COUNT(*) FROM app_users WHERE role='admin' AND active=1)>2)")
  .bind(b.role,b.active?1:0,email,b.active?1:0,b.role).run();
 if(!change.meta.changes)return errorResponse('Conservez au moins deux administrateurs actifs.');
 await db().batch([
  ...(!b.active?[db().prepare('DELETE FROM sessions WHERE email=?').bind(email),db().prepare('UPDATE invitations SET used_at=? WHERE email=? AND used_at IS NULL').bind(new Date().toISOString(),email)]:[]),
  db().prepare('INSERT INTO user_audit(id,actor,target_email,operation) VALUES(?,?,?,?)').bind(crypto.randomUUID(),user.email,email,b.active?'Rôle modifié':'Compte désactivé')
 ]);
 return Response.json({ok:true},{headers:noStore});
}
