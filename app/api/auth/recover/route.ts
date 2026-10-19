import {env} from '@/lib/env.mjs';
import {validEmail,safeOrigin,noStore,errorResponse,randomToken,tokenHash} from '@/lib/auth.mjs';
import {after} from 'next/server';

export const dynamic='force-dynamic';
const genericMessage='Si un compte actif correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.';

export async function POST(request:Request){
 if(!safeOrigin(request))return errorResponse('Requête refusée.',403);
 const body=await request.json().catch(()=>null);
 const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
 if(!validEmail(email))return Response.json({ok:true,message:genericMessage},{headers:noStore});

 const apiKey=env.RESEND_API_KEY,from=env.INVITE_FROM,origin=env.APP_ORIGIN;
 if(!apiKey||!from?.includes('@')||from.includes('REMPLACER')||origin!=='https://recouvrement.cdc-habitat.sn')
  return errorResponse('La récupération du mot de passe est temporairement indisponible. Contactez l’administrateur.',503);

 const db=env.DB;
 const now=new Date(),timestamp=now.toISOString(),cutoff=new Date(now.getTime()-60*60*1000).toISOString();
 const limit=await db.prepare(`INSERT INTO password_recovery_limits(email,attempts,window_start)
  SELECT email,1,? FROM app_users WHERE email=? AND active=1
  ON CONFLICT(email) DO UPDATE SET
   attempts=CASE WHEN password_recovery_limits.window_start<? THEN 1 ELSE password_recovery_limits.attempts+1 END,
   window_start=CASE WHEN password_recovery_limits.window_start<? THEN EXCLUDED.window_start ELSE password_recovery_limits.window_start END
  RETURNING email,attempts`).bind(timestamp,email,cutoff,cutoff).first() as {email:string;attempts:number}|null;
 if(!limit||limit.attempts>3)return Response.json({ok:true,message:genericMessage},{headers:noStore});

 const token=randomToken(),hash=await tokenHash(token),expiry=new Date(now.getTime()+30*60*1000).toISOString();
 const link=origin+'/recuperation?token='+token;
 after(async()=>{
  const user=await db.prepare('SELECT name FROM app_users WHERE email=? AND active=1').bind(email).first() as {name:string}|null;
  if(!user)return;
  await db.batch([
   db.prepare('UPDATE invitations SET used_at=? WHERE email=? AND used_at IS NULL').bind(timestamp,email),
   db.prepare('INSERT INTO invitations(token_hash,email,expires_at) VALUES(?,?,?)').bind(hash,email,expiry)
  ]);
  try{
   const response=await fetch('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({from,to:[email],subject:'Réinitialisation de votre mot de passe CDC HABITAT',
     text:`Bonjour ${user.name},\n\nUne demande de réinitialisation du mot de passe de votre compte CDC HABITAT a été effectuée. Utilisez ce lien personnel dans les 30 minutes pour choisir un nouveau mot de passe :\n\n${link}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet email. Votre mot de passe ne changera pas sans l’utilisation du lien.\n\nCDC HABITAT`})
   });
   if(!response.ok)throw new Error(`Email provider returned status ${response.status}`);
  }catch(error){
   await db.prepare('UPDATE invitations SET used_at=? WHERE token_hash=?').bind(new Date().toISOString(),hash).run();
   console.error('Password recovery email could not be sent:',error);
  }
 });
 return Response.json({ok:true,message:genericMessage},{headers:noStore});
}
