// Run after migrations to send individual password setup links to both admins.
import {getDb} from '../db/client.mjs';
import {randomBytes,createHash} from 'node:crypto';
const apiKey=process.env.RESEND_API_KEY,from=process.env.INVITE_FROM;
if(!apiKey||!from?.includes('@')||from.includes('REMPLACER'))throw new Error('Configurez RESEND_API_KEY et INVITE_FROM.');
const origin=process.env.APP_ORIGIN;
if(!origin)throw new Error('Configurez APP_ORIGIN.');
const db=getDb();
const admins=[['mndiaye@cdc-habitat.sn','Malick Ndiaye'],['bgueye@cdc-habitat.sn','bgueye@cdc-habitat.sn']];
for(const [email,name] of admins){
 const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');
 const expires=new Date(Date.now()+48*3600000).toISOString(),now=new Date().toISOString();
 await db.prepare('INSERT INTO app_users(email,name,role,active) VALUES(?,?,?,1) ON CONFLICT(email) DO NOTHING').bind(email,name,'admin').run();
 const user=await db.prepare('SELECT email FROM app_users WHERE email=? AND role=? AND active=1').bind(email,'admin').first();
 if(!user)throw new Error('Le compte administrateur '+email+' existe déjà avec un autre rôle ou est désactivé.');
 await db.batch([
  db.prepare('UPDATE invitations SET used_at=? WHERE email=? AND used_at IS NULL').bind(now,email),
  db.prepare('INSERT INTO invitations(token_hash,email,expires_at) VALUES(?,?,?)').bind(hash,email,expires)
 ]);
 const link=origin+'/invitation?token='+token;
 const response=await fetch('https://api.resend.com/emails',{method:'POST',
  headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
  body:JSON.stringify({from,to:[email],subject:'Activation de votre compte administrateur CDC HABITAT',
   text:`Bonjour,\n\nVous êtes administrateur de l’espace de recouvrement CDC HABITAT. Ouvrez ce lien personnel pour choisir votre mot de passe (validité 48 heures) :\n\n${link}\n\nCDC HABITAT`})
 });
 if(!response.ok)throw new Error('Invitation non envoyée à '+email+'. Vérifiez le fournisseur et relancez le script.');
 console.log('Invitation administrateur envoyée à '+email+'.');
}
