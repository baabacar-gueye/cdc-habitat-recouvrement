"use client";
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
type Role='admin'|'superviseur'|'agent';
type Member={email:string;name:string;role:Role;active:number;password_set_at:string|null;pending_invite:number};
const roleNames:Record<Role,string>={admin:'Administrateur',superviseur:'Superviseur',agent:'Agent de recouvrement'};
export default function Team(){
 const [members,setMembers]=useState<Member[]>([]),[email,setEmail]=useState(''),[name,setName]=useState(''),[role,setRole]=useState<Role>('agent'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
 const refresh=async()=>{const r=await fetch('/api/team',{cache:'no-store'});if(r.ok)setMembers(await r.json());else setError('Impossible de charger les comptes.');};
 useEffect(()=>{void refresh()},[]);
 const send=async(payload:{email:string;name:string;role:Role})=>{
  setError('');setNotice('');setSaving(true);
  try{const r=await fetch('/api/team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!r.ok)throw new Error(((await r.json()) as {error?:string}).error||'Invitation impossible.');
   setNotice('Invitation envoyée à '+payload.email+'. Le lien expire dans 48 heures.');
   setEmail('');setName('');await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Invitation impossible.');}finally{setSaving(false);}
 };
 const update=async(m:Member,changes:{role?:Role;active?:boolean})=>{
  setError('');setNotice('');
  const r=await fetch('/api/team',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:m.email,role:changes.role??m.role,active:changes.active??!!m.active})});
  if(!r.ok){setError(((await r.json()) as {error?:string}).error||'Modification impossible.');return;}
  setNotice('Compte mis à jour.');await refresh();
 };
 return <section className="panel"><h2>Gestion des comptes et des rôles</h2>
  <p>Invitez un collaborateur par email. Il choisira lui-même son mot de passe depuis un lien personnel valable 48 heures.</p>
  <form onSubmit={e=>{e.preventDefault();void send({email,name,role});}} className="form-grid">
   <label className="field"><span>Nom du collaborateur</span><Input value={name} onChange={e=>setName(e.target.value)} required/></label>
   <label className="field"><span>Adresse email</span><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label className="field"><span>Rôle</span><select value={role} onChange={e=>setRole(e.target.value as Role)}><option value="agent">Agent de recouvrement</option><option value="superviseur">Superviseur</option><option value="admin">Administrateur</option></select></label>
   <Button type="submit" disabled={saving}>{saving?'Envoi…':'Envoyer l’invitation'}</Button>
  </form>
  {error&&<p className="login-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  <div className="team-list">{members.map(m=><div className="team-member" key={m.email}>
   <div><strong>{m.name}</strong><small>{m.email} · {m.pending_invite?'Invitation en attente':m.password_set_at?'Compte activé':'Activation nécessaire'}{m.active?'':' · Désactivé'}</small></div>
   <div className="team-actions">
    <select aria-label={'Rôle de '+m.name} value={m.role} onChange={e=>void update(m,{role:e.target.value as Role})}>{Object.entries(roleNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
    <Button variant="outline" size="sm" onClick={()=>void send(m)} disabled={saving}>{m.password_set_at?'Réinitialiser l’accès':'Renvoyer'}</Button>
    <Button variant="outline" size="sm" onClick={()=>void update(m,{active:!m.active})}>{m.active?'Désactiver':'Réactiver'}</Button>
   </div>
  </div>)}</div>
 </section>;
}
