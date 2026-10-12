// Run after migrations to send individual password setup links to both admins.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
const apiKey=process.env.RESEND_API_KEY,from=process.env.INVITE_FROM;
if(!apiKey||!from?.includes('@')||from.includes('REMPLACER'))throw new Error('Configurez RESEND_API_KEY et INVITE_FROM.');
const admins=['mndiaye@cdc-habitat.sn','bgueye@cdc-habitat.sn'];
for(const email of admins){
 const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');
 const expires=new Date(Date.now()+48*3600000).toISOString(),now=new Date().toISOString();
 const temp=mkdtempSync(join(tmpdir(),'cdc-admin-'));
 try{
  const file=join(temp,'bootstrap.sql');
  writeFileSync(file,`UPDATE invitations SET used_at='${now}' WHERE email='${email}' AND used_at IS NULL;
INSERT INTO invitations(token_hash,email,expires_at) SELECT '${hash}',email,'${expires}' FROM app_users WHERE email='${email}' AND role='admin' AND active=1;`);
  execFileSync(join(process.cwd(),'node_modules/.bin/wrangler'),['d1','execute','cdc-habitat-recouvrement','--remote','--file',file],{stdio:['ignore','pipe','pipe']});
 }finally{rmSync(temp,{recursive:true,force:true});}
 const link='https://recouvrement.cdc-habitat.sn/invitation?token='+token;
 const response=await fetch('https://api.resend.com/emails',{method:'POST',
  headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
  body:JSON.stringify({from,to:[email],subject:'Activation de votre compte administrateur CDC HABITAT',
   text:`Bonjour,\n\nVous êtes administrateur de l’espace de recouvrement CDC HABITAT. Ouvrez ce lien personnel pour choisir votre mot de passe (validité 48 heures) :\n\n${link}\n\nCDC HABITAT`})
 });
 if(!response.ok)throw new Error('Invitation non envoyée à '+email+'. Vérifiez le fournisseur et relancez le script.');
 console.log('Invitation administrateur envoyée à '+email+'.');
}
