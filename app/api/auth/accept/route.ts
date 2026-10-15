import {env} from '@/lib/env.mjs';
import {tokenHash,hashPassword,makeSession,safeOrigin,noStore,errorResponse} from '@/lib/auth.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!env.DB||!safeOrigin(request))return errorResponse('Requête refusée.',403);
 const body=await request.json().catch(()=>null) as any,token=body?.token,password=body?.password;
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return errorResponse('Invitation invalide ou expirée.');
 const hash=await tokenHash(token),now=new Date().toISOString();
 const invite=await env.DB.prepare('SELECT i.email FROM invitations i JOIN app_users u ON u.email=i.email WHERE i.token_hash=? AND i.used_at IS NULL AND i.expires_at>? AND u.active=1').bind(hash,now).first() as {email:string}|null;
 if(!invite)return errorResponse('Invitation invalide ou expirée.');
 let passHash;
 try{passHash=await hashPassword(password);}catch(e){return errorResponse(e instanceof Error?e.message:'Mot de passe invalide.');}
 const result=await env.DB.batch([
  env.DB.prepare('UPDATE invitations SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>?').bind(now,hash,now),
  env.DB.prepare('UPDATE app_users SET password_hash=?,password_set_at=? WHERE email=? AND active=1 AND EXISTS(SELECT 1 FROM invitations WHERE token_hash=? AND used_at=?)').bind(passHash,now,invite.email,hash,now),
  env.DB.prepare('DELETE FROM sessions WHERE email=?').bind(invite.email)
 ]);
 if(!result[0].meta.changes||!result[1].meta.changes)return errorResponse('Invitation déjà utilisée.');
 const cookie=await makeSession(env.DB,invite.email);
 return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':cookie}});
}
