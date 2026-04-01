import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  ShieldAlert, Send, Users, Trash2, Eye, Type, 
  ShieldCheck, UserCog, X, Calendar, CheckCircle, 
  Mail, BookOpen, Settings2, BellRing, BellOff, Sun, Moon,
  Search, Crown, ArrowLeft // Added new icons
} from 'lucide-react';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import dbConnect from '../lib/mongodb';
import User from '../models/User';
import { useRouter } from 'next/router';

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
                username: user.username 
            } 
        };
    } catch { return { redirect: { destination: '/login', permanent: false } }; }
}

export default function AdminDashboard({ adminId, username }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users'); 
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // SEARCH STATE
  const [subject, setSubject] = useState("NEW MISSION UPDATE");
  const [message, setMessage] = useState("Hello {username}, we have a new announcement...");
  const [primaryColor, setPrimaryColor] = useState("#eab308"); 
  const [status, setStatus] = useState("");

  const SUPER_ADMIN_EMAIL = "akashmandal6297@gmail.com"; // THE FOUNDER

  // MAIL CONTROL STATES
  const [mailMorningActive, setMailMorningActive] = useState(true);
  const [mailEveningActive, setMailEveningActive] = useState(true);
  const [mailTarget, setMailTarget] = useState('both');

  // MOTIVATION STATES
  const [calendar, setCalendar] = useState([]);
  const [calForm, setCalForm] = useState({ day: 1, subject: '', story: '' });
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // PERSONAL DISPATCH STATES
  const [personalMailUser, setPersonalMailUser] = useState(null); 
  const [personalMsg, setPersonalMsg] = useState("");
  const [personalSubject, setPersonalSubject] = useState("DIRECT DISPATCH");

  // FILTER USERS FOR SEARCH
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => { 
    fetchUsers(); 
    fetchCalendar();
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
        const res = await fetch('/api/admin/global-settings');
        const data = await res.json();
        setMailMorningActive(data.isMorningActive ?? true);
        setMailEveningActive(data.isEveningActive ?? true);
        setMailTarget(data.mailTarget || 'both');
    } catch (err) { console.error("Error fetching global settings"); }
  };

  const saveGlobalSettings = async (morning, evening, target) => {
    try {
        const response = await fetch('/api/admin/global-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isMorningActive: morning, isEveningActive: evening, mailTarget: target })
        });
        if (response.ok) {
            const updatedData = await response.json();
            setMailMorningActive(updatedData.isMorningActive);
            setMailEveningActive(updatedData.isEveningActive);
            setMailTarget(updatedData.mailTarget);
        }
    } catch (err) { alert("Failed to connect to API"); }
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

  const toggleRole = async (targetId, currentRole, email) => {
    if (email === SUPER_ADMIN_EMAIL) return alert("Operation Denied: The Founder's access level is absolute.");
    if (targetId === adminId) return alert("Operation denied: Self-demotion blocked.");
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, newRole })
    });
    if (res.ok) fetchUsers();
  };

  const deleteUser = async (id, email) => {
    if (email === SUPER_ADMIN_EMAIL) return alert("Operation Denied: The Founder cannot be removed.");
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

  const sendPersonalMail = async () => {
    if(!personalMsg) return alert("Write a message first!");
    setStatus("Dispatching...");
    const res = await fetch('/api/admin/personal-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            targetEmail: personalMailUser.email, 
            targetUsername: personalMailUser.username,
            subject: personalSubject,
            message: personalMsg
        })
    });
    if(res.ok) {
        alert(`Dispatch successfully sent to ${personalMailUser.username}`);
        setPersonalMailUser(null);
        setPersonalMsg("");
    }
    setStatus("");
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

  const generateStory = async () => {
      setStatus("Linking Satellite Data...");
      const res = await fetch('/api/admin/random-story');
      if (res.ok) {
          const data = await res.json();
          setCalForm({ ...calForm, subject: data.subject, story: data.story });
      } else {
          alert("Failed to secure feed.");
      }
      setStatus("");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans transition-colors duration-500">
      <Head><title>ADMIN HQ | MISSION 2026</title></Head>
      
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-72 bg-[#0a0a0c] border-b lg:border-b-0 lg:border-r border-white/5 p-6 space-y-8 shrink-0">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-600/20"><ShieldAlert size={24}/></div>
                <div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase">HQ Control</h2>
                    <p className="text-[8px] text-red-500 font-bold tracking-[0.3em]">SECURE ACCESS</p>
                </div>
            </div>

            {/* RETURN TO SITE LINK */}
            <button 
                onClick={() => router.push('/')}
                className="w-full flex items-center gap-3 px-5 py-3 rounded-xl border border-white/5 text-gray-500 hover:text-yellow-500 hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
            >
                <ArrowLeft size={16}/> Back to Main Site
            </button>

            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-4 lg:pb-0 font-mono">
                {[
                    { id: 'users', label: 'User Registry', icon: <Users size={18}/> },
                    { id: 'email', label: 'Broadcast HQ', icon: <Mail size={18}/> },
                    { id: 'calendar', label: 'Motivation', icon: <Calendar size={18}/> },
                    { id: 'mail_control', label: 'Mail Control', icon: <Settings2 size={18}/> },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-10 lg:p-16 max-w-7xl overflow-y-auto">
            
            {/* VIEW 1: USERS (WITH SEARCH & FOUNDER LOGIC) */}
            {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-yellow-500">User Registry</h1>
                            <p className="text-gray-500 text-sm italic">Manage personnel and authorization levels.</p>
                        </div>

                        {/* SEARCH INPUT */}
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-yellow-500 transition-colors" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Search Name or Email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0f0f12] border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-yellow-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredUsers.map(u => {
                            const isFounder = u.email === SUPER_ADMIN_EMAIL;
                            return (
                                <div key={u._id} className={`p-6 rounded-[2.5rem] border transition-all relative overflow-hidden ${
                                    isFounder 
                                    ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.1)]' 
                                    : u.role === 'admin' ? 'bg-yellow-500/5 border-white/10' : 'bg-[#0f0f12] border-white/5'
                                } group hover:scale-[1.02]`}>
                                    
                                    {isFounder && (
                                        <div className="absolute top-4 right-4 text-yellow-500 drop-shadow-lg">
                                            <Crown size={22} fill="currentColor" className="animate-pulse" />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black uppercase ${isFounder ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/40' : 'bg-white/5 text-gray-500'}`}>
                                            {u.username.charAt(0)}
                                        </div>
                                        
                                        {!isFounder && u._id !== adminId && (
                                            <button onClick={() => deleteUser(u._id, u.email)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                                <Trash2 size={18}/>
                                            </button>
                                        )}
                                    </div>

                                    <h3 className="font-black text-lg uppercase tracking-tight truncate text-white">
                                        {u.username}
                                        {isFounder && <span className="block text-[8px] text-yellow-500 font-bold tracking-[0.4em] mt-1 uppercase">System Founder</span>}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-6 truncate italic">{u.email}</p>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => toggleRole(u._id, u.role, u.email)}
                                            disabled={isFounder}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                isFounder ? 'bg-yellow-500 text-black cursor-default' : 
                                                u.role === 'admin' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                        >
                                            {u.role === 'admin' ? <ShieldCheck size={14}/> : <UserCog size={14}/>}
                                            {isFounder ? 'Full Access' : `${u.role} Control`}
                                        </button>
                                        <button 
                                            onClick={() => setPersonalMailUser(u)}
                                            className="p-3 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-600/20"
                                            title="Personal Dispatch"
                                        >
                                            <Mail size={18}/>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: BROADCAST HQ */}
            {activeTab === 'email' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-8 text-yellow-500">Broadcast HQ</h1>
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                        <div className="xl:col-span-5 bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Subject</label>
                                <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-yellow-500 text-sm" placeholder="Subject" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Branding Color</label>
                                <div className="flex gap-3 flex-wrap">
                                    {['#eab308', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f472b6'].map(c => (
                                    <button key={c} type="button" onClick={() => setPrimaryColor(c)} 
                                        className={`w-10 h-10 rounded-full border-4 transition-all ${primaryColor === c ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent opacity-50'}`}
                                        style={{ backgroundColor: c }} />
                                    ))}
                                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-full overflow-hidden" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Message content</label>
                                <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl h-64 outline-none focus:border-yellow-500 text-sm custom-scrollbar" placeholder="Content..." />
                            </div>
                            <button onClick={sendBroadcast} className="w-full bg-yellow-500 text-black font-black py-5 rounded-[2rem] uppercase tracking-widest shadow-xl hover:bg-yellow-400">
                                {status || "Deploy Broadcast"}
                            </button>
                        </div>
                        <div className="xl:col-span-7 bg-[#e5e7eb] rounded-[3rem] p-1 text-black shadow-2xl overflow-hidden h-fit sticky top-10 border border-white/10">
                            <div className="bg-white border-b border-gray-300 p-4 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="p-8 bg-white max-h-[600px] overflow-auto custom-scrollbar">
                                <div style={{backgroundColor: primaryColor, padding: '30px', textAlign: 'center', color: '#fff', borderRadius: '15px'}}>
                                    <h1 style={{margin: 0, fontSize: '20px', textTransform: 'uppercase'}}>{subject}</h1>
                                </div>
                                <div className="py-8 px-4 text-slate-700 leading-relaxed italic border-x border-slate-100">
                                    "{message.replace(/{username}/g, username || "Akash")}"
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 3: MOTIVATION CALENDAR */}
            {activeTab === 'calendar' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-green-500 text-center lg:text-left">Motivation Pipeline</h1>
                        <button onClick={generateStory} className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-xl hover:bg-gray-200 transition-all flex items-center gap-2">
                            ✨ Auto-Generate Story
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5 space-y-6 h-fit shadow-2xl">
                            <div className="grid grid-cols-1 gap-4">
                                <select value={calForm.day} onChange={e => setCalForm({...calForm, day: Number(e.target.value)})} className="bg-black/40 border border-white/10 p-4 rounded-2xl text-yellow-500 font-bold outline-none uppercase text-xs">
                                    {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                </select>
                                <input value={calForm.subject} onChange={e => setCalForm({...calForm, subject: e.target.value})} className="bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-green-500 text-sm transition-all" placeholder="Subject" />
                            </div>
                            <textarea value={calForm.story} onChange={e => setCalForm({...calForm, story: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl h-48 outline-none focus:border-green-500 text-sm leading-relaxed" placeholder="The Story... use {username}" />
                            <button onClick={saveToCalendar} className="w-full bg-green-600 font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-lg hover:bg-green-500 transition-all">Arm Pipeline</button>
                        </div>
                        
                        <div className="lg:col-span-4 sticky top-10">
                            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-200 min-h-[500px]">
                                <div style={{backgroundColor: '#10b981', padding: '40px 20px', textAlign: 'center', color: '#fff'}}>
                                    <h1 style={{margin: 0, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '2px', fontStyle: 'italic'}}>{calForm.subject || "Story Subject"}</h1>
                                </div>
                                <div style={{padding: '30px', color: '#334155', fontFamily: 'serif', lineHeight: '1.8', fontSize: '15px'}}>
                                    <p style={{marginBottom: '20px'}}>Greetings, <strong>Soldier {username}</strong>.</p>
                                    <div style={{borderLeft: '4px solid #10b981', paddingLeft: '15px', fontStyle: 'italic'}}>
                                        {calForm.story ? calForm.story.replace(/{username}/g, username) : "Your narrative preview..."}
                                    </div>
                                    <div style={{textAlign: 'center', marginTop: '40px'}}>
                                        <div style={{display: 'inline-block', padding: '12px 30px', backgroundColor: '#000', color: '#fff', borderRadius: '10px', fontWeight: 'bold', fontSize: '11px'}}>EXECUTE MISSION</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-3 pr-2 custom-scrollbar overflow-y-auto max-h-[700px]">
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
                                            <div className="flex gap-2">
                                                <button onClick={() => setCalForm({day: i, subject: s.subject, story: s.story})} className="p-2 bg-white/5 rounded-full text-yellow-500 hover:bg-white/10 transition-all"><Type size={14}/></button>
                                                <button onClick={async () => {
                                                    if(confirm(`Clear ${d}?`)) {
                                                        await fetch('/api/admin/motivation', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dayOfWeek: i }) });
                                                        fetchCalendar();
                                                    }
                                                }} className="p-2 bg-white/5 rounded-full text-red-500 hover:bg-white/10 transition-all"><Trash2 size={14}/></button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 4: MAIL CONTROL */}
            {activeTab === 'mail_control' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-8 text-blue-500">Mail Control Center</h1>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={`p-8 rounded-[3rem] border transition-all ${mailMorningActive ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-black/20 border-white/5'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-yellow-500 rounded-2xl text-black shadow-lg shadow-yellow-500/20"><Sun size={24}/></div>
                                    <button onClick={() => saveGlobalSettings(!mailMorningActive, mailEveningActive, mailTarget)} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mailMorningActive ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-red-600 text-white'}`}>
                                        {mailMorningActive ? 'Active' : 'Paused'}
                                    </button>
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Morning Briefing</h3>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Sends daily story, current XP balance, and morning motivation to your squad.</p>
                            </div>
                            <div className={`p-8 rounded-[3rem] border transition-all ${mailEveningActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/20 border-white/5'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Moon size={24}/></div>
                                    <button onClick={() => saveGlobalSettings(mailMorningActive, !mailEveningActive, mailTarget)} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mailEveningActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-red-600 text-white'}`}>
                                        {mailEveningActive ? 'Active' : 'Paused'}
                                    </button>
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Evening Check-in</h3>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Sends EOD reminders to ensure soldiers log their progress and maintain streaks.</p>
                            </div>
                        </div>
                        <div className="lg:col-span-4 bg-[#0f0f12] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                            <h3 className="text-[10px] font-black uppercase text-gray-500 mb-8 tracking-[0.3em] text-center">Global Audience</h3>
                            <div className="space-y-3">
                                {['users', 'admins', 'both'].map(t => (
                                    <button key={t} onClick={() => saveGlobalSettings(mailMorningActive, mailEveningActive, t)} className={`w-full p-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${mailTarget === t ? 'bg-white text-black border-white shadow-xl' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'}`}>
                                        {t === 'both' ? 'Entire Fleet' : t === 'users' ? 'Soldiers Only' : 'Commanders Only'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </main>
      </div>

      {/* PERSONAL DISPATCH MODAL */}
      {personalMailUser && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f0f12] border border-blue-500/30 p-6 sm:p-10 rounded-[3rem] max-w-lg w-full relative shadow-[0_0_50px_rgba(59,130,246,0.2)] animate-in zoom-in-95 duration-200">
                <button onClick={() => setPersonalMailUser(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={24}/></button>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-blue-600 rounded-xl"><Mail size={24}/></div>
                    <h2 className="text-2xl font-black italic uppercase text-blue-500 tracking-tighter">Direct Dispatch</h2>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-8 ml-1">Target Soldier: <span className="text-white font-bold">{personalMailUser.username}</span></p>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Mission Topic</label>
                        <input value={personalSubject} onChange={e => setPersonalSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-sm transition-all shadow-inner" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-600 uppercase ml-2 tracking-widest">Encrypted Content</label>
                        <textarea value={personalMsg} onChange={e => setPersonalMsg(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl h-48 outline-none focus:border-blue-500 text-sm leading-relaxed custom-scrollbar shadow-inner" placeholder="Orders for the soldier... Use {username}"/>
                    </div>
                    <button onClick={sendPersonalMail} className="w-full bg-blue-600 text-white font-black py-5 rounded-[2.5rem] text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 active:scale-95 transition-all mt-4">
                        {status ? status : "Execute Dispatch"}
                    </button>
                </div>
            </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}