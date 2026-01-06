import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  ShieldAlert, Send, Users, Trash2, Eye, Type, 
  ShieldCheck, UserCog, X, Calendar, CheckCircle, 
  LayoutDashboard, Mail, BookOpen
} from 'lucide-react';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import dbConnect from '../lib/mongodb';
import User from '../models/User';

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
        return { props: { adminId: decoded.id } };
    } catch { return { redirect: { destination: '/login', permanent: false } }; }
}

export default function AdminDashboard({ adminId }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'email', 'calendar'
  const [users, setUsers] = useState([]);
  const [subject, setSubject] = useState("NEW MISSION UPDATE");
  const [message, setMessage] = useState("Hello {username}, we have a new announcement...");
  const [primaryColor, setPrimaryColor] = useState("#eab308"); 
  const [status, setStatus] = useState("");

  const [calendar, setCalendar] = useState([]);
  const [calForm, setCalForm] = useState({ day: 1, subject: '', story: '' });
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => { 
    fetchUsers(); 
    fetchCalendar();
  }, []);

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
      
      {/* SIDEBAR NAVIGATION (Desktop) / TOP NAV (Mobile) */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Navigation Panel */}
        <aside className="w-full lg:w-72 bg-[#0a0a0c] border-b lg:border-b-0 lg:border-r border-white/5 p-6 space-y-8 shrink-0">
            <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-600/20"><ShieldAlert size={24}/></div>
                <div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase">Command</h2>
                    <p className="text-[8px] text-red-500 font-bold tracking-[0.3em]">SECURE ACCESS</p>
                </div>
            </div>

            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar">
                {[
                    { id: 'users', label: 'User Registry', icon: <Users size={18}/> },
                    { id: 'email', label: 'Broadcast HQ', icon: <Mail size={18}/> },
                    { id: 'calendar', label: 'Motivation', icon: <Calendar size={18}/> },
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

            <div className="hidden lg:block pt-10 border-t border-white/5">
                <p className="text-[10px] text-gray-600 font-bold uppercase mb-2">Soldiers Online</p>
                <p className="text-3xl font-black text-white/20">{users.length}</p>
            </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-4 md:p-10 lg:p-16 max-w-7xl">
            
            {/* VIEW 1: USER REGISTRY */}
            {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-10">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">User Registry</h1>
                        <p className="text-gray-500 text-sm">Manage access levels and personnel database.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {users.map(u => (
                            <div key={u._id} className={`p-6 rounded-[2.5rem] border ${u.role === 'admin' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-[#0f0f12] border-white/5'} transition-all`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-black text-gray-500">
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    {u._id !== adminId && (
                                        <button onClick={() => deleteUser(u._id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </div>
                                <h3 className="font-black text-lg uppercase tracking-tight truncate">{u.username}</h3>
                                <p className="text-xs text-gray-500 mb-6 truncate">{u.email}</p>
                                
                                <button 
                                    onClick={() => toggleRole(u._id, u.role)}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                                        u.role === 'admin' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                >
                                    {u.role === 'admin' ? <ShieldCheck size={14}/> : <UserCog size={14}/>}
                                    {u.role} Access
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 2: BROADCAST HQ */}
            {activeTab === 'email' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-10">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Broadcast HQ</h1>
                        <p className="text-gray-500 text-sm">Design and deploy global mission updates.</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                        <div className="xl:col-span-5 space-y-6">
                            <div className="bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Subject</label>
                                    <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-yellow-500 text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Branding Color</label>
                                    <div className="flex gap-2">
                                        {['#eab308', '#3b82f6', '#ef4444', '#10b981'].map(c => (
                                            <button key={c} onClick={() => setPrimaryColor(c)} className={`w-8 h-8 rounded-full border-2 ${primaryColor === c ? 'border-white' : 'border-transparent'}`} style={{backgroundColor: c}} />
                                        ))}
                                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Message content</label>
                                    <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-yellow-500 h-64 text-sm" />
                                </div>
                                <button onClick={sendBroadcast} className="w-full bg-yellow-500 text-black font-black py-5 rounded-[2rem] text-sm uppercase tracking-widest shadow-xl hover:bg-yellow-400">
                                    {status || "Deploy Broadcast"}
                                </button>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="bg-[#e5e7eb] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl h-fit sticky top-10">
                                <div className="bg-white border-b border-gray-300 p-4 flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="p-8 overflow-auto max-h-[600px] custom-scrollbar">
                                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto border border-gray-200">
                                        <div style={{backgroundColor: primaryColor, padding: '40px', textAlign: 'center', color: '#fff'}}>
                                            <h1 style={{margin: 0, fontSize: '24px', textTransform: 'uppercase'}}>{subject}</h1>
                                        </div>
                                        <div style={{padding: '40px', color: '#444', lineHeight: '1.6'}}>
                                            <p style={{whiteSpace: 'pre-wrap'}}>{message.replace(/{username}/g, "Akash")}</p>
                                            <div style={{textAlign: 'center', marginTop: '30px'}}>
                                                <div style={{display: 'inline-block', padding: '12px 30px', backgroundColor: primaryColor, color: '#fff', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px'}}>GO TO DASHBOARD</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 3: MOTIVATION CALENDAR */}
            {activeTab === 'calendar' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-10">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Motivation Pipeline</h1>
                        <p className="text-gray-500 text-sm">Schedule automated inspiring stories for the week.</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        <div className="bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5 space-y-6 h-fit">
                            <h2 className="text-sm font-black uppercase text-green-500 tracking-widest mb-4">Add To Schedule</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <select value={calForm.day} onChange={e => setCalForm({...calForm, day: Number(e.target.value)})}
                                    className="bg-black/40 border border-white/10 p-4 rounded-2xl outline-none text-xs font-black uppercase text-yellow-500">
                                    {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                </select>
                                <input value={calForm.subject} onChange={e => setCalForm({...calForm, subject: e.target.value})} 
                                    className="bg-black/40 border border-white/10 p-4 rounded-2xl outline-none text-xs" placeholder="Subject" />
                            </div>
                            <textarea value={calForm.story} onChange={e => setCalForm({...calForm, story: e.target.value})} 
                                className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl h-48 text-sm" placeholder="Tell a story... use {username}" />
                            <button onClick={saveToCalendar} className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] text-sm uppercase tracking-widest hover:bg-green-500">
                                ARM SCHEDULE FOR {days[calForm.day].toUpperCase()}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] mb-4">Pipeline Status</h2>
                            {days.map((d, i) => {
                                const scheduled = calendar.find(c => c.dayOfWeek === i);
                                return (
                                    <div key={i} className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${scheduled ? 'bg-green-500/5 border-green-500/30' : 'bg-black/20 border-white/5'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${scheduled ? 'bg-green-500 animate-pulse shadow-[0_0_10px_green]' : 'bg-gray-800'}`} />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-600 uppercase">{d}</p>
                                                <p className={`text-sm font-bold ${scheduled ? 'text-white' : 'text-gray-700'}`}>
                                                    {scheduled ? scheduled.subject : 'System Idle'}
                                                </p>
                                            </div>
                                        </div>
                                        {scheduled && <button onClick={() => setCalForm({day: i, subject: scheduled.subject, story: scheduled.story})} className="text-[10px] font-black text-yellow-500 hover:underline">Edit</button>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </main>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}