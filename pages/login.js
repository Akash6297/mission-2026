import { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) router.push('/');
    else alert("Invalid Credentials");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-[#16161a] p-8 rounded-[2.5rem] border border-white/5 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-black italic uppercase mb-8 text-center text-yellow-500">Mission Access</h1>
        
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-4 text-gray-500" size={20} />
            <input 
              type="text" placeholder="Username" 
              className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-yellow-500"
              onChange={e => setForm({...form, username: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-500" size={20} />
            <input 
              type={showPass ? "text" : "password"} 
              placeholder="Password" 
              className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-yellow-500"
              onChange={e => setForm({...form, password: e.target.value})}
            />
            <button 
              type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-4 text-gray-500 hover:text-white"
            >
              {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>
        </div>

        <button className="w-full bg-yellow-500 text-black font-black py-4 rounded-2xl mt-8 hover:bg-yellow-400 transition-all">ENTER COMMAND CENTER</button>
        
        <div className="mt-6 text-center text-xs space-y-2">
            <p className="text-gray-500">New Soldier? <a href="/signup" className="text-yellow-500 font-bold">Create Account</a></p>
            <p><a href="/forgot-password" className="text-gray-600 hover:text-white">Forgot Password?</a></p>
        </div>
      </form>
    </div>
  );
}