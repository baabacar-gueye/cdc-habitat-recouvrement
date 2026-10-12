"use client";
import {useState} from 'react';
import {Building2,LockKeyhole,ArrowRight,Mail} from 'lucide-react';
import {Input} from '@/components/ui/input';

export default function Login(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setError('');
  try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
   if(!r.ok){const d=await r.json() as {error?:string};throw new Error(d.error||'Connexion impossible.');}
   window.location.assign('/');
  }catch(e){setError(e instanceof Error?e.message:'Connexion impossible.');setSaving(false);}
 };
 return <main className="login-page"><div className="login-brand"><span><Building2 size={31}/></span><div>CDC HABITAT<small>ESPACE RECOUVREMENT</small></div></div>
  <section className="login-card" aria-labelledby="login-title">
   <div className="login-icon"><LockKeyhole size={27}/></div>
   <p className="login-kicker">ACCÈS À L’ÉQUIPE</p>
   <h1 id="login-title">Connexion</h1>
   <p>Accédez aux dossiers clients, aux relances et au suivi des engagements avec votre compte professionnel.</p>
   {error&&<p className="login-error" role="alert">{error}</p>}
   <form onSubmit={submit} className="login-form">
    <label>Adresse email professionnelle<Input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required/></label>
    <label>Mot de passe<Input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>
    <button className="login-button" type="submit" disabled={saving}>{saving?'Connexion…':'Se connecter'} <ArrowRight size={18}/></button>
   </form>
   <div className="login-help"><Mail size={17}/><span>Première connexion ou mot de passe oublié ? Demandez une invitation à votre responsable.</span></div>
  </section>
  <footer className="login-footer">CDC HABITAT · Accès réservé aux collaborateurs autorisés</footer>
 </main>;
}
