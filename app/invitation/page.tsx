"use client";
import {useState} from 'react';
import {Building2,LockKeyhole} from 'lucide-react';
import {Input} from '@/components/ui/input';
export default function Invitation(){
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');
  if(password!==confirm){setError('Les deux mots de passe ne correspondent pas.');return;}
  setSaving(true);
  const token=new URLSearchParams(window.location.search).get('token');
  try{
   const r=await fetch('/api/auth/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})});
   if(!r.ok){const d=await r.json() as {error?:string};throw new Error(d.error||'Invitation invalide.');}
   window.history.replaceState(null,'','/');
   window.location.assign('/');
  }catch(e){setError(e instanceof Error?e.message:'Invitation invalide.');setSaving(false);}
 };
 return <main className="login-page"><div className="login-brand"><span><Building2 size={31}/></span><div>CDC HABITAT<small>ESPACE RECOUVREMENT</small></div></div>
  <section className="login-card" aria-labelledby="invitation-title"><div className="login-icon"><LockKeyhole size={27}/></div>
   <p className="login-kicker">INVITATION PERSONNELLE</p><h1 id="invitation-title">Choisir mon mot de passe</h1>
   <p>Ce lien personnel est valable 48 heures et ne peut être utilisé qu’une fois.</p>
   {error&&<p role="alert" className="login-error">{error}</p>}
   <form onSubmit={submit} className="login-form">
    <label>Mot de passe (12 caractères minimum)<Input type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
    <label>Confirmer le mot de passe<Input type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>
    <button className="login-button" type="submit" disabled={saving}>{saving?'Activation…':'Activer mon compte'}</button>
   </form>
  </section>
 </main>;
}
