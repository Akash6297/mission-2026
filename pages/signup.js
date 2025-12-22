import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok) {
        alert("Account Created! Redirecting to login...");
        router.push('/login');
    } else {
        alert(data.error || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 font-sans">
      <Head><title>Join Mission 2026</title></Head>
      <form onSubmit={handleSignup} className="bg-[#16161a] p-8 rounded-[3rem] border border-white/5 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
        <h1 className="text-3xl font-black italic uppercase mb-2 text-center">New Soldier</h1>
        <p className="text-gray-500 text-center text-xs uppercase tracking-widest mb-8 font-bold">Enlist for 2026 Missions</p>
        
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-4 text-gray-500" size={18} />
            <input required type="text" placeholder="Username" className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-yellow-500"
              onChange={e => setForm({...form, username: e.target.value})} />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-500" size={18} />
            <input required type="email" placeholder="Email Address" className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-yellow-500"
              onChange={e => setForm({...form, email: e.target.value})} />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-500" size={18} />
            <input required type={showPass ? "text" : "password"} placeholder="Password" className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-yellow-500"
              onChange={e => setForm({...form, password: e.target.value})} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-4 text-gray-500 hover:text-white">
              {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
        </div>

        <button disabled={loading} className="w-full bg-yellow-500 text-black font-black py-4 rounded-2xl mt-8 hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter">
          {loading ? "Registering..." : "Initialize Profile"} <ArrowRight size={18}/>
        </button>
        
        <p className="mt-6 text-center text-xs text-gray-500 uppercase font-bold">
            Already have an account? <a href="/login" className="text-yellow-500 underline ml-1">Login here</a>
        </p>
      </form>
    </div>
  );
}