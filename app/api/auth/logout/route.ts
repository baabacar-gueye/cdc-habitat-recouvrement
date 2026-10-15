import {env} from '@/lib/env.mjs';
import {removeSession,safeOrigin,noStore,sessionCookie,errorResponse} from '@/lib/auth.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!env.DB||!safeOrigin(request))return errorResponse('Requête refusée.',403);
 await removeSession(env.DB,request);
 return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':sessionCookie('',0)}});
}
