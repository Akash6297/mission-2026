import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query; // Gets the token from the URL
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Password updated successfully! Redirecting...");
      setTimeout(() => router.push('/login'), 2000);
    } else {
      setMsg(data.error || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4">
      <Head><title>Reset Your Key</title></Head>
      <form onSubmit={handleSubmit} className="bg-[#16161a] p-8 rounded-[3rem] border border-white/5 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-black italic uppercase mb-6 text-yellow-500">Secure New Key</h1>
        
        <div className="relative mb-6">
          <Lock className="absolute left-4 top-4 text-gray-500" size={20} />
          <input 
            type={showPass ? "text" : "password"} 
            placeholder="Enter New Password" 
            required 
            className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-yellow-500" 
            onChange={e => setPassword(e.target.value)} 
          />
          <button 
            type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-4 text-gray-500 hover:text-white"
          >
            {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
          </button>
        </div>

        <button disabled={loading} className="w-full bg-yellow-500 text-black font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all uppercase">
          {loading ? "Updating..." : "Update Password"}
        </button>

        {msg && (
          <div className="mt-4 flex items-center gap-2 justify-center text-sm text-yellow-500">
            <CheckCircle size={16} /> {msg}
          </div>
        )}
      </form>
    </div>
  );
}