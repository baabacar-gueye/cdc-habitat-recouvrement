"use client";
import {useState} from 'react';
import Link from 'next/link';
import {ArrowRight,Building2,LockKeyhole} from 'lucide-react';
import {Input} from '@/components/ui/input';

export default function RecoveryRequest(){
 const [email,setEmail]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   const response=await fetch('/api/auth/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
   const result=await response.json() as {message?:string;error?:string};
   if(!response.ok)throw new Error(result.error||'La demande n’a pas pu être traitée.');
   setMessage(result.message||'Si un compte correspond à cette adresse, un lien vient d’être envoyé.');
  }catch(error){setError(error instanceof Error?error.message:'La demande n’a pas pu être traitée.');}
  finally{setSaving(false);}
 };
 return <main className="login-page"><div className="login-brand"><span><Building2 size={31}/></span><div>CDC HABITAT<small>ESPACE RECOUVREMENT</small></div></div>
  <section className="login-card" aria-labelledby="recovery-title"><div className="login-icon"><LockKeyhole size={27}/></div>
   <p className="login-kicker">RÉCUPÉRATION DU COMPTE</p><h1 id="recovery-title">Mot de passe oublié ?</h1>
   <p>Saisissez l’adresse email associée à votre compte. Si elle est enregistrée, vous recevrez un lien pour choisir un nouveau mot de passe.</p>
   {message&&<p role="status">{message}</p>}
   {error&&<p role="alert" className="login-error">{error}</p>}
   <form onSubmit={submit} className="login-form">
    <label>Adresse email professionnelle<Input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required/></label>
    <button className="login-button" type="submit" disabled={saving}>{saving?'Envoi…':'Envoyer le lien'} <ArrowRight size={18}/></button>
   </form>
   <div className="login-help"><Link href="/connexion">Retour à la connexion</Link></div>
  </section>
 </main>;
}
