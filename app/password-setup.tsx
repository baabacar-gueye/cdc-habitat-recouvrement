"use client";
import {useState} from 'react';
import {Building2,LockKeyhole} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {Input} from '@/components/ui/input';

export default function PasswordSetup({mode}:{mode:'invitation'|'recovery'}){
 const recovery=mode==='recovery';
 const router=useRouter();
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');
  if(password!==confirm){setError('Les deux mots de passe ne correspondent pas.');return;}
  setSaving(true);
  const token=new URLSearchParams(window.location.search).get('token');
  try{
   const r=await fetch('/api/auth/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})});
   if(!r.ok){const d=await r.json() as {error?:string};throw new Error(d.error||'Lien invalide ou expiré.');}
   router.replace('/');
  }catch(e){setError(e instanceof Error?e.message:'Lien invalide ou expiré.');setSaving(false);}
 };
 return <main className="login-page"><div className="login-brand"><span><Building2 size={31}/></span><div>CDC HABITAT<small>ESPACE RECOUVREMENT</small></div></div>
  <section className="login-card" aria-labelledby="password-setup-title"><div className="login-icon"><LockKeyhole size={27}/></div>
   <p className="login-kicker">{recovery?'RÉINITIALISATION SÉCURISÉE':'INVITATION PERSONNELLE'}</p>
   <h1 id="password-setup-title">{recovery?'Choisir un nouveau mot de passe':'Choisir mon mot de passe'}</h1>
   <p>Ce lien personnel est valable {recovery?'30 minutes':'48 heures'} et ne peut être utilisé qu’une fois.</p>
   {error&&<p role="alert" className="login-error">{error}</p>}
   <form onSubmit={submit} className="login-form">
    <label>Nouveau mot de passe (12 caractères minimum)<Input type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
    <label>Confirmer le mot de passe<Input type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>
    <button className="login-button" type="submit" disabled={saving}>{saving?'Enregistrement…':recovery?'Changer mon mot de passe':'Activer mon compte'}</button>
   </form>
  </section>
 </main>;
}
