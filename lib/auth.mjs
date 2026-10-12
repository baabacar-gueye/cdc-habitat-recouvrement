const enc=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const fromHex=s=>new Uint8Array(s.match(/../g).map(x=>parseInt(x,16)));
export const randomToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const tokenHash=async token=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(token))));
export const validEmail=email=>typeof email==='string'&&email.length<=200&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const safeOrigin=request=>{
 const origin=request.headers.get('origin');
 return origin!==null&&origin===new URL(request.url).origin&&request.headers.get('sec-fetch-site')!=='cross-site';
};
export const noStore={'Cache-Control':'no-store'};
export const errorResponse=(error,status=400)=>Response.json({error},{status,headers:noStore});
export const sessionCookie=(token,maxAge=28800)=>`__Host-cdc_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
const cookieToken=request=>{
 const pair=(request.headers.get('cookie')??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('__Host-cdc_session='));
 const token=pair?.slice('__Host-cdc_session='.length);
 return token&&/^[a-f0-9]{64}$/.test(token)?token:null;
};
export async function authorizedUser(request,config,db){
 const token=cookieToken(request);
 if(!token)return null;
 const hash=await tokenHash(token);
 return db.prepare("SELECT u.email,u.name,u.role FROM sessions s JOIN app_users u ON u.email=s.email WHERE s.token_hash=? AND s.expires_at>? AND u.active=1 AND u.password_hash IS NOT NULL").bind(hash,new Date().toISOString()).first();
}
export async function makeSession(db,email){
 const token=randomToken(),hash=await tokenHash(token),now=new Date();
 await db.prepare('INSERT INTO sessions(token_hash,email,expires_at) VALUES(?,?,?)').bind(hash,email,new Date(now.getTime()+8*3600000).toISOString()).run();
 return sessionCookie(token);
}
export async function removeSession(db,request){
 const token=cookieToken(request);
 if(token)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await tokenHash(token)).run();
}
export async function hashPassword(password){
 if(typeof password!=='string'||password.length<12||password.length>128||enc.encode(password).length>512)
  throw new Error('Le mot de passe doit contenir entre 12 et 128 caractères.');
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},key,256);
 return 'pbkdf2-sha256$600000$'+hex(salt)+'$'+hex(new Uint8Array(bits));
}
export async function verifyPassword(password,stored){
 if(typeof password!=='string'||!stored||password.length>128)return false;
 const [algo,count,salt,digest]=stored.split('$');
 if(algo!=='pbkdf2-sha256'||count!=='600000'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(digest))return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const output=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromHex(salt),iterations:600000,hash:'SHA-256'},key,256));
 const expected=fromHex(digest);let diff=0;for(let i=0;i<output.length;i++)diff|=output[i]^expected[i];return diff===0;
}
