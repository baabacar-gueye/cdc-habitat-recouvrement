import {env} from '@/lib/env.mjs';
import {validEmail,safeOrigin,noStore,errorResponse,verifyPassword,makeSession} from '@/lib/auth.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!env.DB||!safeOrigin(request))return errorResponse('Requête refusée.',403);
 const body=await request.json().catch(()=>null) as any,email=typeof body?.email==='string'?body.email.trim().toLowerCase():'',password=body?.password;
 if(!validEmail(email)||typeof password!=='string'||password.length>128)return errorResponse('Identifiants invalides.',401);
 const now=new Date(),when=now.toISOString();
 const attempt=await env.DB.prepare('SELECT attempts,window_start,blocked_until FROM login_attempts WHERE email=?').bind(email).first() as {attempts:number;window_start:string;blocked_until:string|null}|null;
 if(attempt?.blocked_until&&attempt.blocked_until>when)return errorResponse('Trop de tentatives. Réessayez dans 15 minutes.',429);
 const user=await env.DB.prepare('SELECT email,password_hash FROM app_users WHERE email=? AND active=1').bind(email).first() as {email:string;password_hash:string|null}|null;
 const valid=!!user&&await verifyPassword(password,user.password_hash);
 if(!valid){
  const inWindow=!!attempt&&Date.parse(attempt.window_start)>now.getTime()-15*60000;
  const count=inWindow?attempt!.attempts+1:1;
  const blocked=count>=5?new Date(now.getTime()+15*60000).toISOString():null;
  await env.DB.prepare('INSERT INTO login_attempts(email,attempts,window_start,blocked_until) VALUES (?,?,?,?) ON CONFLICT(email) DO UPDATE SET attempts=excluded.attempts,window_start=excluded.window_start,blocked_until=excluded.blocked_until').bind(email,count,inWindow?attempt!.window_start:when,blocked).run();
  return errorResponse('Identifiants invalides.',401);
 }
 await env.DB.prepare('DELETE FROM login_attempts WHERE email=?').bind(email).run();
 const cookie=await makeSession(env.DB,email);
 return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':cookie}});
}
