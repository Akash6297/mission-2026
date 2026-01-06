import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Target, Bike, Languages, Briefcase, Users, Camera, MapPin, TrendingUp, History, Star, Flame, Smile, Meh, Frown, Trophy, Pizza, Tv, X, Sun, Moon, Settings, ShoppingBag, Plus, Trash2, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/router';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import dbConnect from '../lib/mongodb';
import User from '../models/User';

// 1. UPDATED: Detects if user is Admin from the Database
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;

  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();
    
    // Look up the user to check their current role
    const userDoc = await User.findById(decoded.id);
    
    if (!userDoc) {
        return { redirect: { destination: '/login', permanent: false } };
    }

    return { 
        props: { 
            username: userDoc.username,
            isAdmin: userDoc.role === 'admin' // Sends true/false to the page
        } 
    };
  } catch (err) {
    return { redirect: { destination: '/login', permanent: false } };
  }
}

const initialResolutions = [
  { id: "lang", title: "New Language", icon: <Languages />, color: "text-blue-500" },
  { id: "trav", title: "Travel Plans", icon: <MapPin />, color: "text-green-500" },
  { id: "skill", title: "New Skills", icon: <Target />, color: "text-purple-500" },
  { id: "imp", title: "Improvement", icon: <TrendingUp />, color: "text-orange-500" },
  { id: "bike", title: "Bike Savings", icon: <Bike />, color: "text-red-500" },
  { id: "cont", title: "Content Creation", icon: <Camera />, color: "text-pink-500" },
  { id: "biz", title: "Small Biz", icon: <Briefcase />, color: "text-yellow-600" },
  { id: "conn", title: "Networking", icon: <Users />, color: "text-indigo-500" },
];

export default function Home({ username, isAdmin }) {
  const router = useRouter();
  const [update, setUpdate] = useState("");
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [mood, setMood] = useState("Smile");
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ xp: 0, streak: 0, weekly: 0, monthly: 0 });
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [goals, setGoals] = useState({ weekly: 2000, monthly: 8000 });
  const [perks, setPerks] = useState([]);

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout');
    if (res.ok) {
        router.push('/login');
    }
  };

  useEffect(() => { 
    fetchHistory(); 
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data && !data.error) {
        setGoals({ weekly: data.weeklyGoal || 2000, monthly: data.monthlyGoal || 8000 });
        setPerks(data.perks || []);
      }
    } catch (err) { console.error("Error fetching settings", err); }
  };

  const saveSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyGoal: goals.weekly, monthlyGoal: goals.monthly, perks }),
      });
      setShowSettings(false);
      fetchHistory();
    } catch (err) { console.error("Error saving settings", err); }
  };

  const fetchHistory = async () => {
    const res = await fetch('/api/get-logs');
    const data = await res.json();
    setHistory(data);
    
    // --- STREAK CALCULATION LOGIC ---
    const calculateStreak = (logs) => {
      if (!logs || logs.length === 0) return 0;
      const logDates = [...new Set(logs.map(log => new Date(log.date).toLocaleDateString('en-CA')))].sort((a, b) => new Date(b) - new Date(a));
      const today = new Date().toLocaleDateString('en-CA');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');
      if (logDates[0] !== today && logDates[0] !== yesterdayStr) return 0;
      let streak = 0;
      let checkDate = new Date(logDates[0]);
      for (let i = 0; i < logDates.length; i++) {
        if (logDates[i] === checkDate.toLocaleDateString('en-CA')) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
      return streak;
    };

    const walletBalance = data.reduce((sum, item) => sum + (item.xpGained || 0), 0);
    const last7DaysXp = data.filter(log => {
        const logDate = new Date(log.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return logDate >= sevenDaysAgo && log.type !== "spend";
    }).reduce((sum, item) => sum + (item.xpGained || 0), 0);
    const thisMonthXp = data.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === new Date().getMonth() && log.type !== "spend";
    }).reduce((sum, item) => sum + (item.xpGained || 0), 0);

    setStats({ 
        xp: walletBalance, 
        streak: calculateStreak(data),
        weekly: Math.min(Math.round((last7DaysXp / goals.weekly) * 100), 100),
        monthly: Math.min(Math.round((thisMonthXp / goals.monthly) * 100), 100)
    });
  };

  const addPerk = () => setPerks([...perks, { label: "New Reward", xp: 1000 }]);
  const removePerk = (index) => setPerks(perks.filter((_, i) => i !== index));
  const updatePerk = (index, field, value) => {
    const newPerks = [...perks];
    newPerks[index][field] = field === "xp" ? Number(value) : value;
    setPerks(newPerks);
  };

  const spendXP = async (perk) => {
    if (stats.xp < perk.xp) return alert("Not enough XP!");
    if (!confirm(`Spend ${perk.xp} XP for "${perk.label}"?`)) return;
    try {
      const res = await fetch('/api/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: perk.label, xp: perk.xp }),
      });
      if (res.ok) {
        confetti({ particleCount: 100, spread: 50 });
        fetchHistory();
      }
    } catch (err) { console.error(err); }
  };

  const submitUpdate = async () => {
    if (!update) return alert("Report your mission!");
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: update, tasksCompleted: selectedTasks, mood: mood }),
      });
      if (res.ok) {
        confetti({ particleCount: 150, spread: 70 });
        setUpdate(""); setSelectedTasks([]); setMood("Smile");
        fetchHistory();
      }
    } catch (err) { console.error(err); }
  };

  const xpPreview = selectedTasks.length > 0 ? selectedTasks.length * 100 : 50;
  const bgColor = isDarkMode ? "bg-[#0a0a0c]" : "bg-[#f1f5f9]";
  const cardColor = isDarkMode ? "bg-[#16161a] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-xl";

  return (
    <div className={`min-h-screen ${bgColor} ${isDarkMode ? 'text-white' : 'text-slate-900'} transition-all duration-500 p-4 sm:p-6 md:p-8 font-sans`}>
      <Head>
        <title>MISSION 2026</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-2 sm:p-4">
            <div className={`${cardColor} p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] max-w-xl w-full border border-yellow-500/30 max-h-[95vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter">Settings</h2>
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-red-500 rounded-full transition-colors"><X/></button>
                </div>
                <div className="space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Weekly XP Goal</label>
                            <input type="number" value={goals.weekly} onChange={(e) => setGoals({...goals, weekly: Number(e.target.value)})} className="w-full bg-black/20 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl outline-none focus:border-yellow-500 text-yellow-500 font-bold" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Monthly XP Goal</label>
                            <input type="number" value={goals.monthly} onChange={(e) => setGoals({...goals, monthly: Number(e.target.value)})} className="w-full bg-black/20 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl outline-none focus:border-yellow-500 text-yellow-500 font-bold" />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Reward Manager</label>
                            <button onClick={addPerk} className="flex items-center gap-1 text-[10px] bg-green-600 px-3 py-1 rounded-full font-bold hover:bg-green-500"><Plus size={12}/> Add</button>
                        </div>
                        <div className="space-y-3">
                            {perks.map((p, i) => (
                                <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                    <input type="text" value={p.label} onChange={(e) => updatePerk(i, "label", e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold" placeholder="Label" />
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={p.xp} onChange={(e) => updatePerk(i, "xp", e.target.value)} className="w-full sm:w-24 bg-black/40 border border-white/10 rounded-lg p-2 text-center text-xs text-yellow-500 font-bold" />
                                        <button onClick={() => removePerk(i)} className="text-red-500 p-2"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={saveSettings} className="w-full mt-8 bg-yellow-500 text-black font-black py-4 rounded-2xl text-sm sm:text-base uppercase">Save Parameters</button>
            </div>
        </div>
      )}

      {/* MISSION REPORT POPUP */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className={`${isDarkMode ? 'bg-[#121418]' : 'bg-white'} border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] max-w-lg w-full relative shadow-2xl max-h-[95vh] overflow-y-auto`}>
            <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-500"><X size={20} /></button>
            <p className="text-yellow-500 font-mono text-[9px] sm:text-[10px] mb-2 uppercase tracking-[0.2em]">{new Date(selectedLog.date).toDateString()}</p>
            <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 italic uppercase tracking-tighter border-b pb-4 border-white/5">Mission Report</h2>
            <div className={`${isDarkMode ? 'bg-black/30' : 'bg-slate-50'} p-4 sm:p-6 rounded-2xl sm:rounded-3xl mb-6 border border-white/5 text-sm sm:text-lg italic leading-relaxed`}>"{selectedLog.text}"</div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5`}>
                    <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase font-black mb-1">XP Impact</p>
                    <p className={`text-lg sm:text-2xl font-black ${selectedLog.xpGained < 0 ? 'text-red-500' : 'text-yellow-500'}`}>{selectedLog.xpGained > 0 ? `+${selectedLog.xpGained}` : selectedLog.xpGained}</p>
                </div>
                {selectedLog.type !== "spend" && (
                  <div className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5`}>
                      <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase font-black mb-1">Mood</p>
                      <p className="text-sm sm:text-lg font-bold">{(selectedLog.mood === "Smile" || !selectedLog.mood) ? "😊 Happy" : selectedLog.mood === "Meh" ? "😐 Neutral" : "☹️ Sad"}</p>
                  </div>
                )}
            </div>
            {selectedLog.type !== "spend" && (
              <div className="flex flex-wrap gap-2">
                {selectedLog.tasksCompleted?.map(t => <span key={t} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">{t}</span>)}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* TOP NAV: PROFILE, LOGOUT, AND ADMIN BUTTON */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase opacity-10 select-none">Mission 2026</h1>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                
                {/* 2. ADMIN DASHBOARD BUTTON: Only visible to admins */}
                {isAdmin && (
                    <button 
                        onClick={() => router.push('/admin')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all`}
                        title="Admin HQ"
                    >
                        <ShieldAlert size={16} />
                        <span className="hidden sm:inline">Admin HQ</span>
                    </button>
                )}

                {/* User Profile Card */}
                <div className={`${cardColor} flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/5`}>
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black uppercase text-sm">
                        {username.charAt(0)}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-[8px] font-black uppercase text-gray-500 leading-none tracking-widest">Active Soldier</p>
                        <p className="text-xs font-bold text-yellow-500">{username}</p>
                    </div>
                    
                    {/* Logout Button */}
                    <button 
                        onClick={handleLogout}
                        className="ml-2 p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setShowSettings(true)} className={`${cardColor} p-2.5 rounded-xl border border-white/5 hover:rotate-90 transition-all`}>
                        <Settings size={20}/>
                    </button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`${cardColor} p-2.5 rounded-xl border border-white/5`}>
                        {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
                    </button>
                </div>
            </div>
        </div>

        {/* REST OF DASHBOARD (STATS, QUESTS, MARKET, INPUT, TIMELINE) remains same... */}
        {/* ... (Your existing UI code) ... */}
        
        {/* STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className={`${cardColor} p-5 sm:p-6 rounded-[2rem] border flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0`}>
            <div className="flex gap-6 sm:gap-8 w-full sm:w-auto justify-around sm:justify-start">
                <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black mb-2">XP Balance</p>
                    <div className="bg-yellow-500 text-black px-6 sm:px-10 py-1.5 sm:py-2 rounded-full font-black text-xl sm:text-3xl shadow-xl shadow-yellow-500/20">{stats.xp}</div>
                </div>
                <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black mb-2">Streak</p>
                    <div className="bg-orange-600 text-white px-6 sm:px-8 py-1.5 sm:py-2 rounded-full font-black text-xl sm:text-2xl">{stats.streak}d</div>
                </div>
            </div>
          </div>
          <div className={`${cardColor} p-6 sm:p-8 rounded-[2rem] border flex flex-col justify-center gap-4 sm:gap-6`}>
            <div className="space-y-1">
                <div className="flex justify-between text-[9px] sm:text-[10px] font-black text-blue-500 uppercase"><span>Weekly Goal ({goals.weekly} XP)</span><span>{stats.weekly}%</span></div>
                <div className="w-full bg-gray-500/10 h-2.5 sm:h-3 rounded-full overflow-hidden"><div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${stats.weekly}%` }} /></div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-[9px] sm:text-[10px] font-black text-purple-500 uppercase"><span>Monthly Goal ({goals.monthly} XP)</span><span>{stats.monthly}%</span></div>
                <div className="w-full bg-gray-500/10 h-2.5 sm:h-3 rounded-full overflow-hidden"><div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${stats.monthly}%` }} /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {initialResolutions.map((res) => (
                    <button key={res.id} onClick={() => setSelectedTasks(prev => prev.includes(res.title) ? prev.filter(t => t !== res.title) : [...prev, res.title])}
                        className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border transition-all flex flex-col items-center gap-2 sm:gap-4 ${
                            selectedTasks.includes(res.title) ? 'bg-yellow-500 text-black border-yellow-400 scale-95 shadow-xl' : `${cardColor} hover:border-yellow-500/30`
                        }`}>
                        {React.cloneElement(res.icon, { size: 24 })}
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter text-center">{res.title}</span>
                    </button>
                ))}
            </div>

            <div className={`${isDarkMode ? 'bg-blue-900/5' : 'bg-blue-50'} border border-blue-500/10 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem]`}>
                <h3 className="text-blue-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
                    <ShoppingBag size={14}/> Reward Market
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                    {perks.length > 0 ? perks.map((r, i) => (
                        <button key={i} onClick={() => spendXP(r)} disabled={stats.xp < r.xp}
                            className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex-1 min-w-[140px] sm:flex-none ${
                                stats.xp >= r.xp ? 'bg-blue-500 text-black border-blue-400 hover:scale-105 active:scale-95 cursor-pointer' : 'bg-gray-500/5 border-black/5 opacity-20 cursor-not-allowed grayscale shadow-inner'
                            }`}>
                            <div className="text-[9px] sm:text-[11px] font-black uppercase flex flex-col items-start leading-tight">
                                <span>{r.label}</span>
                                <span className="opacity-60 text-[8px]">{r.xp} XP</span>
                            </div>
                        </button>
                    )) : ( <p className="text-xs text-gray-500 italic">No rewards set.</p> )}
                </div>
            </div>

            <div className={`${cardColor} p-5 sm:p-8 rounded-[2.5rem] sm:rounded-[3.5rem] border`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
                    <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">Mission Log</h2>
                    <div className="flex gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5 w-full sm:w-auto justify-center">
                        {[{v:"Frown", i:<Frown/>},{v:"Meh", i:<Meh/>},{v:"Smile", i:<Smile/>}].map(m => (
                            <button key={m.v} onClick={() => setMood(m.v)} 
                                className={`p-2 rounded-lg transition-all ${mood === m.v ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}>
                                {React.cloneElement(m.i, {size: 20})}
                            </button>
                        ))}
                    </div>
                </div>
                <textarea value={update} onChange={(e) => setUpdate(e.target.value)}
                    className="w-full bg-transparent border-none text-lg sm:text-2xl focus:ring-0 h-32 sm:h-40 placeholder:text-gray-700"
                    placeholder="Report mission status..." />
                <button onClick={submitUpdate} className="w-full bg-yellow-500 text-black font-black py-4 sm:py-6 rounded-2xl sm:rounded-[2.5rem] text-lg sm:text-2xl uppercase shadow-2xl">
                    Confirm Log (+{xpPreview} XP)
                </button>
            </div>
          </div>

          <div className={`lg:col-span-4 ${cardColor} rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-8 border mt-4 lg:mt-0`}>
            <h2 className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 mb-6 sm:mb-10 flex items-center gap-2">
                <History size={16} /> Timeline
            </h2>
            <div className="space-y-6 sm:space-y-10 text-left">
                {history.map(log => (
                    <div key={log._id} onClick={() => setSelectedLog(log)} className={`relative pl-6 sm:pl-8 border-l-2 ${log.type === "spend" ? 'border-red-500/30' : 'border-yellow-500/20'} cursor-pointer group`}>
                        <div className={`absolute -left-[7px] sm:-left-[9px] top-1 w-3 sm:w-4 h-3 sm:h-4 rounded-full border-2 ${log.type === "spend" ? 'bg-red-500' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]'}`} />
                        <p className="text-[8px] sm:text-[10px] font-mono text-gray-500 mb-1 uppercase">{new Date(log.date).toDateString()}</p>
                        <p className={`text-[11px] sm:text-sm line-clamp-2 italic ${isDarkMode ? 'text-gray-400' : 'text-slate-600'} group-hover:text-yellow-500 transition-colors`}>"{log.text}"</p>
                        <p className={`text-[8px] sm:text-[10px] font-black mt-2 uppercase ${log.type === "spend" ? 'text-red-500' : 'text-yellow-500/50'}`}>
                            {log.xpGained > 0 ? `+${log.xpGained}` : log.xpGained} XP
                        </p>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}