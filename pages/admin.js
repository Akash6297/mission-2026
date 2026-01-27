import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  ShieldAlert, Send, Users, Trash2, Eye, Type, 
  ShieldCheck, UserCog, X, Calendar, CheckCircle, 
  Mail, BookOpen, Settings2, BellRing, BellOff 
} from 'lucide-react';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import dbConnect from '../lib/mongodb';
import User from '../models/User';

// 1. Updated getServerSideProps to include 'username'
export async function getServerSideProps(context) {
    const { req } = context;
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) return { redirect: { destination: '/login', permanent: false } };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await dbConnect();
        const user = await User.findById(decoded.id);
        
        if (!user || user.role !== 'admin') return { redirect: { destination: '/', permanent: false } };
        
        return { 
            props: { 
                adminId: decoded.id,
                username: user.username // Pass the admin's name here
            } 
        };
    } catch { return { redirect: { destination: '/login', permanent: false } }; }
}

export default function AdminDashboard({ adminId, username }) {
  const [activeTab, setActiveTab] = useState('users'); 
  const [users, setUsers] = useState([]);
  const [subject, setSubject] = useState("NEW MISSION UPDATE");
  const [message, setMessage] = useState("Hello {username}, we have a new announcement...");
  const [primaryColor, setPrimaryColor] = useState("#eab308"); 
  const [status, setStatus] = useState("");

  // MAIL CONTROL STATES
  const [mailActive, setMailActive] = useState(true);
  const [mailTarget, setMailTarget] = useState('both');

  const [calendar, setCalendar] = useState([]);
  const [calForm, setCalForm] = useState({ day: 1, subject: '', story: '' });
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => { 
    fetchUsers(); 
    fetchCalendar();
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
        const res = await fetch('/api/admin/global-settings');
        const data = await res.json();
        setMailActive(data.isMailActive);
        setMailTarget(data.mailTarget);
    } catch (err) { console.error("Error fetching global settings"); }
  };

  const saveGlobalSettings = async (isActive, target) => {
    try {
        await fetch('/api/admin/global-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isMailActive: isActive, mailTarget: target })
        });
        setMailActive(isActive);
        setMailTarget(target);
    } catch (err) { alert("Failed to update global settings"); }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  };

  const fetchCalendar = async () => {
    const res = await fetch('/api/admin/motivation');
    const data = await res.json();
    if (Array.isArray(data)) setCalendar(data);
  };

  const toggleRole = async (targetId, currentRole) => {
    if (targetId === adminId) return alert("Operation denied: Self-demotion blocked.");
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, newRole })
    });
    if (res.ok) fetchUsers();
  };

  const deleteUser = async (id) => {
    if (id === adminId) return alert("Operation denied: Self-destruction blocked.");
    if (!confirm("Confirm permanent deletion of soldier?")) return;
    await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: id })
    });
    fetchUsers();
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setStatus("Initiating Blast...");
    const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, color: primaryColor })
    });
    if (res.ok) setStatus("✅ ALL MAILS DISPATCHED!");
    else setStatus("❌ Transmission Failed.");
    setTimeout(() => setStatus(""), 3000);
  };

  const saveToCalendar = async () => {
    const res = await fetch('/api/admin/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: calForm.day, subject: calForm.subject, story: calForm.story })
    });
    if (res.ok) {
        alert("Pipeline Updated!");
        setCalForm({ ...calForm, subject: '', story: '' });
        fetchCalendar();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans transition-colors duration-500">
      <Head><title>ADMIN HQ | MISSION 2026</title></Head>
      
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-72 bg-[#0a0a0c] border-b lg:border-b-0 lg:border-r border-white/5 p-6 space-y-8 shrink-0">
            <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-600/20"><ShieldAlert size={24}/></div>
                <div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase">HQ Control</h2>
                    <p className="text-[8px] text-red-500 font-bold tracking-[0.3em]">SECURE ACCESS</p>
                </div>
            </div>

            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-4 lg:pb-0">
                {[
                    { id: 'users', label: 'User Registry', icon: <Users size={18}/> },
                    { id: 'email', label: 'Broadcast HQ', icon: <Mail size={18}/> },
                    { id: 'calendar', label: 'Motivation', icon: <Calendar size={18}/> },
                    { id: 'mail_control', label: 'Mail Control', icon: <Settings2 size={18}/> },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-10 lg:p-16 max-w-7xl">
            
            {/* TAB 1: USERS */}
            {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-10">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-yellow-500">User Registry</h1>
                        <p className="text-gray-500 text-sm italic">Control access and personnel roles.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {users.map(u => (
                            <div key={u._id} className={`p-6 rounded-[2.5rem] border ${u.role === 'admin' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-[#0f0f12] border-white/5'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-black text-gray-500">
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    {u._id !== adminId && (
                                        <button onClick={() => deleteUser(u._id)} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={18}/></button>
                                    )}
                                </div>
                                <h3 className="font-black text-lg uppercase tracking-tight truncate text-white">{u.username}</h3>
                                <p className="text-xs text-gray-500 mb-6 truncate">{u.email}</p>
                                <button onClick={() => toggleRole(u._id, u.role)} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${u.role === 'admin' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400'}`}>
                                    {u.role === 'admin' ? <ShieldCheck size={14}/> : <UserCog size={14}/>} {u.role} Access
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: BROADCAST */}
            {/* TAB 2: BROADCAST */}
{activeTab === 'email' && (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-10">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-yellow-500">Broadcast HQ</h1>
            <p className="text-gray-500 text-sm italic">Manual override and mission alerts.</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <div className="xl:col-span-5 bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5 space-y-6">
                
                {/* 1. SUBJECT INPUT */}
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-yellow-500 text-sm" placeholder="Subject" />
                </div>

                {/* 2. COLOR PICKER PLACEMENT (HERE) */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Branding Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {['#eab308', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f472b6'].map(c => (
                      <button 
                        key={c} 
                        type="button"
                        onClick={() => setPrimaryColor(c)} 
                        className={`w-10 h-10 rounded-full border-4 transition-all ${primaryColor === c ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent opacity-50'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={primaryColor} 
                      onChange={(e) => setPrimaryColor(e.target.value)} 
                      className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-full overflow-hidden" 
                    />
                  </div>
                </div>

                {/* 3. MESSAGE TEXTAREA */}
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Message content</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl h-64 outline-none focus:border-yellow-500 text-sm" placeholder="Content..." />
                </div>

                <button onClick={sendBroadcast} className="w-full bg-yellow-500 text-black font-black py-5 rounded-[2rem] uppercase tracking-widest hover:bg-yellow-400">
                    {status || "Deploy Broadcast"}
                </button>
            </div>

            {/* PREVIEW WINDOW (SAME AS BEFORE) */}
            <div className="xl:col-span-7">
                <div className="bg-[#e5e7eb] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl h-fit sticky top-10 border border-white/10">
                    <div className="bg-white border-b border-gray-300 p-4 flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="p-8 bg-white max-h-[600px] overflow-auto">
                        {/* PREVIEW BOX UPDATES DYNAMICALLY WITH PRIMARYCOLOR */}
                        <div style={{backgroundColor: primaryColor, padding: '30px', textAlign: 'center', color: '#fff', borderRadius: '15px'}}>
                            <h1 style={{margin: 0, fontSize: '20px', textTransform: 'uppercase'}}>{subject}</h1>
                        </div>
                        <div className="py-8 px-4 text-slate-700 leading-relaxed italic">
                            "{message.replace(/{username}/g, username)}"
                        </div>
                        <div style={{textAlign: 'center'}}>
                            <div style={{display: 'inline-block', padding: '12px 30px', backgroundColor: primaryColor, color: '#fff', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px'}}>MISSION CONTROL</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}

{/* TAB 3: MOTIVATION PIPELINE */}
{activeTab === 'calendar' && (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-10">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-green-500">Motivation Pipeline</h1>
            <p className="text-gray-500 text-sm italic">Automate your leadership by scheduling weekly inspiring stories.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Side */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5 space-y-6 shadow-2xl">
                    <h2 className="text-xs font-black uppercase text-green-500 tracking-[0.2em] mb-4">Composer</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-600 uppercase ml-2">Execution Day</label>
                            <select value={calForm.day} onChange={e => setCalForm({...calForm, day: Number(e.target.value)})} 
                                className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-yellow-500 font-bold outline-none focus:border-green-500 transition-all mt-1">
                                {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-600 uppercase ml-2">Story Subject</label>
                            <input value={calForm.subject} onChange={e => setCalForm({...calForm, subject: e.target.value})} 
                                className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-green-500 text-sm mt-1" placeholder="e.g. The Power of Consistency" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-600 uppercase ml-2">The Narrative (Use {'{username}'})</label>
                            <textarea value={calForm.story} onChange={e => setCalForm({...calForm, story: e.target.value})} 
                                className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl h-48 outline-none focus:border-green-500 text-sm leading-relaxed mt-1" 
                                placeholder="Once upon a time, {username} decided to never give up..." />
                        </div>

                        <button onClick={saveToCalendar} className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] uppercase tracking-widest shadow-lg shadow-green-900/20 hover:bg-green-500 transition-all active:scale-95">
                            Arm {days[calForm.day]} Pipeline
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Side */}
            <div className="lg:col-span-4">
                <div className="sticky top-10 space-y-4">
                    <h2 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] ml-4 flex items-center gap-2">
                        <Eye size={14}/> Inbox Preview
                    </h2>
                    {/* Simulated Email Template */}
                    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-200 min-h-[500px]">
                        <div style={{backgroundColor: '#10b981', padding: '40px 20px', textAlign: 'center', color: '#fff'}}>
                            <h1 style={{margin: 0, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '2px', fontStyle: 'italic'}}>{calForm.subject || "Subject Placeholder"}</h1>
                        </div>
                        <div style={{padding: '30px', color: '#334155', fontFamily: 'serif', lineHeight: '1.8', fontSize: '15px'}}>
                            <p style={{marginBottom: '20px'}}>Greetings, <strong>Soldier {username}</strong>.</p>
                            <div style={{borderLeft: '4px solid #10b981', paddingLeft: '15px', fontStyle: 'italic'}}>
                                {calForm.story ? calForm.story.replace(/{username}/g, username) : "Your inspiring story will appear here as you type..."}
                            </div>
                            <div style={{textAlign: 'center', marginTop: '40px'}}>
                                <div style={{display: 'inline-block', padding: '12px 30px', backgroundColor: '#000', color: '#fff', borderRadius: '10px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase'}}>LOG TODAY'S MISSION</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Side */}
            <div className="lg:col-span-4">
                <h2 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] mb-4 ml-4">Current Schedule</h2>
                <div className="space-y-3 pr-2 custom-scrollbar overflow-y-auto max-h-[700px]">
                    {days.map((d, i) => {
                        const s = calendar.find(c => c.dayOfWeek === i);
                        return (
                            <div key={i} className={`p-5 rounded-[2rem] border transition-all flex items-center justify-between group ${s ? 'bg-green-500/5 border-green-500/20' : 'bg-black/20 border-white/5 opacity-40'}`}>
                                <div className="flex items-center gap-4 truncate">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${s ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
                                    <div className="truncate">
                                        <p className="text-[10px] font-black text-gray-600 uppercase">{d}</p>
                                        <p className="text-sm font-bold truncate text-white">{s ? s.subject : 'System Idle'}</p>
                                    </div>
                                </div>
                                {s && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setCalForm({day: i, subject: s.subject, story: s.story})} className="p-2 bg-white/5 rounded-full text-yellow-500 hover:bg-white/10"><Type size={14}/></button>
                                        <button onClick={async () => {
                                            if(confirm(`Clear ${d}?`)) {
                                                await fetch('/api/admin/motivation', {
                                                    method: 'DELETE',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ dayOfWeek: i })
                                                });
                                                fetchCalendar();
                                            }
                                        }} className="p-2 bg-white/5 rounded-full text-red-500 hover:bg-white/10"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    </div>
)}

            {/* TAB 4: MAIL CONTROL */}
            {activeTab === 'mail_control' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-10">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-blue-500">Mail Master Control</h1>
                        <p className="text-gray-500 text-sm italic">Oversee global automation triggers.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5 flex flex-col items-center text-center">
                            <h3 className="text-sm font-black uppercase text-gray-500 mb-8 tracking-widest">Automation Engine</h3>
                            <button 
                                onClick={() => saveGlobalSettings(!mailActive, mailTarget)}
                                className={`w-32 h-32 rounded-full transition-all flex items-center justify-center border-8 ${mailActive ? 'bg-green-600/10 border-green-600 text-green-500 shadow-[0_0_30px_rgba(22,163,74,0.3)]' : 'bg-red-600/10 border-red-600 text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)]'}`}
                            >
                                {mailActive ? <BellRing size={48}/> : <BellOff size={48}/>}
                            </button>
                            <p className="mt-8 text-xl font-black uppercase">{mailActive ? 'System Live' : 'System Paused'}</p>
                            <p className="text-xs text-gray-600 mt-2">Reminders will {mailActive ? 'continue' : 'cease'} for all recipients.</p>
                        </div>

                        <div className="bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5">
                            <h3 className="text-sm font-black uppercase text-gray-500 mb-8 tracking-widest text-center">Target Audience</h3>
                            <div className="space-y-4">
                                {[
                                    {id: 'users', label: 'Active Soldiers Only'},
                                    {id: 'admins', label: 'Commanders Only'},
                                    {id: 'both', label: 'Entire Fleet'}
                                ].map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => saveGlobalSettings(mailActive, t.id)}
                                        className={`w-full p-6 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${
                                            mailTarget === t.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-black/40 border-white/5 text-gray-500'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </main>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}