import { useState } from 'react';
import Head from 'next/head';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    setMsg(data.message || data.error);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-[2rem] border border-white/5 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 italic uppercase">Reset Neural Key</h1>
        <input type="email" placeholder="Enter your email" required className="w-full bg-black border border-white/10 p-4 rounded-xl mb-4" onChange={e => setEmail(e.target.value)} />
        <button className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl">SEND RESET LINK</button>
        {msg && <p className="mt-4 text-yellow-500 text-center text-sm">{msg}</p>}
      </form>
    </div>
  );
}