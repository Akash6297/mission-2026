import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Target, Bike, Languages, Briefcase, Users, Camera, MapPin, TrendingUp, History, Star, Flame, Smile, Meh, Frown, Trophy, Pizza, Tv, X, Sun, Moon, Settings, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

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

export default function Home() {
  const [update, setUpdate] = useState("");
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [mood, setMood] = useState("Smile");
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ xp: 0, streak: 0, weekly: 0, monthly: 0 });
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // User Dynamic Settings (Synced with MongoDB)
  const [goals, setGoals] = useState({ weekly: 2000, monthly: 8000 });
  const [perks, setPerks] = useState([]);

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
        body: JSON.stringify({ 
          weeklyGoal: goals.weekly, 
          monthlyGoal: goals.monthly, 
          perks 
        }),
      });
      setShowSettings(false);
      fetchHistory(); // Refresh bars based on new goals
    } catch (err) { console.error("Error saving settings", err); }
  };

  const fetchHistory = async () => {
    const res = await fetch('/api/get-logs');
    const data = await res.json();
    setHistory(data);
    
    // XP WALLET CALCULATION: Sum Gains - Sum Spent
    const walletBalance = data.reduce((sum, item) => sum + (item.xpGained || 0), 0);
    
    // Calculate Progress against dynamic goals
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
        streak: data.length > 0 ? 1 : 0, 
        weekly: Math.min(Math.round((last7DaysXp / goals.weekly) * 100), 100),
        monthly: Math.min(Math.round((thisMonthXp / goals.monthly) * 100), 100)
    });
  };

  // REWARD MANAGER LOGIC
  const addPerk = () => setPerks([...perks, { label: "New Reward", xp: 1000 }]);
  const removePerk = (index) => setPerks(perks.filter((_, i) => i !== index));
  const updatePerk = (index, field, value) => {
    const newPerks = [...perks];
    newPerks[index][field] = field === "xp" ? Number(value) : value;
    setPerks(newPerks);
  };

  const spendXP = async (perk) => {
    if (stats.xp < perk.xp) return alert("Not enough XP! Keep grinding.");
    if (!confirm(`Spend ${perk.xp} XP to unlock "${perk.label}"?`)) return;

    try {
      const res = await fetch('/api/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: perk.label, xp: perk.xp }),
      });
      if (res.ok) {
        confetti({ particleCount: 100, spread: 50, colors: ['#ef4444', '#f59e0b'] });
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
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setUpdate(""); setSelectedTasks([]); setMood("Smile");
        fetchHistory();
      }
    } catch (err) { console.error(err); }
  };

  const xpPreview = selectedTasks.length > 0 ? selectedTasks.length * 100 : 50;

  // Theme Config
  const bgColor = isDarkMode ? "bg-[#0a0a0c]" : "bg-[#f1f5f9]";
  const cardColor = isDarkMode ? "bg-[#16161a] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-xl";

  return (
    <div className={`min-h-screen ${bgColor} ${isDarkMode ? 'text-white' : 'text-slate-900'} transition-all duration-500 p-4 md:p-8 font-sans`}>
      <Head><title>MISSION 2026 OS</title></Head>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
            <div className={`${cardColor} p-8 rounded-[3rem] max-w-xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">Command Settings</h2>
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-red-500 rounded-full transition-colors"><X/></button>
                </div>
                
                <div className="space-y-8">
                    {/* Goal Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Weekly XP Goal</label>
                            <input type="number" value={goals.weekly} onChange={(e) => setGoals({...goals, weekly: Number(e.target.value)})} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl outline-none focus:border-yellow-500 text-yellow-500 font-bold" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Monthly XP Goal</label>
                            <input type="number" value={goals.monthly} onChange={(e) => setGoals({...goals, monthly: Number(e.target.value)})} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl outline-none focus:border-yellow-500 text-yellow-500 font-bold" />
                        </div>
                    </div>

                    {/* Perk Manager */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Reward Market Manager</label>
                            <button onClick={addPerk} className="flex items-center gap-1 text-[10px] bg-green-600 px-3 py-1 rounded-full font-bold hover:bg-green-500 transition-colors"><Plus size={12}/> Add Reward</button>
                        </div>
                        <div className="space-y-3">
                            {perks.map((p, i) => (
                                <div key={i} className="flex gap-2 items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                                    <input type="text" value={p.label} onChange={(e) => updatePerk(i, "label", e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold" placeholder="Reward Label" />
                                    <input type="number" value={p.xp} onChange={(e) => updatePerk(i, "xp", e.target.value)} className="w-24 bg-black/40 border border-white/10 rounded-lg p-2 text-center text-xs text-yellow-500 font-bold" placeholder="XP Cost" />
                                    <button onClick={() => removePerk(i)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button onClick={saveSettings} className="w-full mt-10 bg-yellow-500 text-black font-black py-4 rounded-2xl hover:bg-yellow-400 transition-colors shadow-xl">SAVE ALL PARAMETERS</button>
            </div>
        </div>
      )}

      {/* MISSION REPORT POPUP */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-[#121418]' : 'bg-white'} border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} p-8 rounded-[3rem] max-w-lg w-full relative shadow-2xl animate-in zoom-in-95 duration-200`}>
            
            <button onClick={() => setSelectedLog(null)} className="absolute top-6 right-6 text-gray-500 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>

            <p className="text-yellow-500 font-mono text-[10px] mb-2 uppercase tracking-[0.2em]">
              {new Date(selectedLog.date).toDateString()}
            </p>

            <h2 className={`text-3xl font-black mb-6 italic uppercase tracking-tighter border-b pb-4 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              {selectedLog.type === "spend" ? "Reward Receipt" : "Mission Report"}
            </h2>
            
            <div className={`${isDarkMode ? 'bg-black/30' : 'bg-slate-50'} p-6 rounded-3xl mb-6 border ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-slate-700'} italic text-lg leading-relaxed font-serif`}>
                  "{selectedLog.text}"
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-2xl border ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">XP Impact</p>
                    <p className={`text-2xl font-black ${selectedLog.xpGained < 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                        {selectedLog.xpGained > 0 ? `+${selectedLog.xpGained}` : selectedLog.xpGained} XP
                    </p>
                </div>
                {selectedLog.type !== "spend" && (
                  <div className={`${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-2xl border ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                      <p className="text-[10px] text-gray-500 uppercase font-black mb-1 tracking-widest">Mood</p>
                      <p className="text-lg font-bold">
                          {(selectedLog.mood === "Smile" || !selectedLog.mood) ? "😊 Happy" : 
                            selectedLog.mood === "Meh" ? "😐 Neutral" : "☹️ Sad"}
                      </p>
                  </div>
                )}
            </div>

            {selectedLog.type !== "spend" && (
              <>
                <p className="text-[10px] text-gray-500 uppercase font-black mb-3 ml-1 tracking-widest">Objectives Achieved:</p>
                <div className="flex flex-wrap gap-2">
                    {selectedLog.tasksCompleted && selectedLog.tasksCompleted.length > 0 ? (
                      selectedLog.tasksCompleted.map(t => (
                        <span key={t} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-600 text-[10px] italic">Legacy Mission (No Quests Selected)</span>
                    )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* TOP NAV */}
        <div className="flex justify-between items-center mb-8">
            <h1 className={`text-5xl font-black italic tracking-tighter uppercase opacity-10 select-none`}>Mission 2026</h1>
            <div className="flex gap-4">
                <button onClick={() => setShowSettings(true)} className={`${cardColor} p-3 rounded-full hover:rotate-90 transition-all`}><Settings size={20}/></button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`${cardColor} p-3 rounded-full hover:scale-110 transition-all`}>
                    {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
                </button>
            </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className={`${cardColor} p-6 rounded-[2.5rem] border flex justify-between items-center`}>
            <div className="flex gap-8">
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">XP Balance</p>
                    <div className="bg-yellow-500 text-black px-10 py-2 rounded-full font-black text-3xl shadow-xl shadow-yellow-500/20">{stats.xp}</div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Streak</p>
                    <div className="bg-orange-600 text-white px-8 py-2 rounded-full font-black text-2xl">{stats.streak}d</div>
                </div>
            </div>
          </div>

          <div className={`${cardColor} p-8 rounded-[2.5rem] border flex flex-col justify-center gap-6`}>
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black text-blue-500 uppercase tracking-widest"><span>Weekly Goal ({goals.weekly} XP)</span><span>{stats.weekly}%</span></div>
                <div className="w-full bg-gray-500/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${stats.weekly}%` }} />
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black text-purple-500 uppercase tracking-widest"><span>Monthly Goal ({goals.monthly} XP)</span><span>{stats.monthly}%</span></div>
                <div className="w-full bg-gray-500/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(168,85,247,0.5)]" style={{ width: `${stats.monthly}%` }} />
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* QUEST GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {initialResolutions.map((res) => (
                    <button key={res.id} onClick={() => setSelectedTasks(prev => prev.includes(res.title) ? prev.filter(t => t !== res.title) : [...prev, res.title])}
                        className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-4 ${
                            selectedTasks.includes(res.title) ? 'bg-yellow-500 text-black border-yellow-400 scale-95 shadow-xl' : `${cardColor} hover:border-yellow-500/30`
                        }`}>
                        {React.cloneElement(res.icon, { size: 28 })}
                        <span className="text-[10px] font-black uppercase tracking-tighter text-center">{res.title}</span>
                    </button>
                ))}
            </div>

            {/* SHOP / MARKET */}
            <div className={`${isDarkMode ? 'bg-blue-900/5' : 'bg-blue-50'} border border-blue-500/10 p-8 rounded-[3rem]`}>
                <h3 className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <ShoppingBag size={14}/> Reward Market (Spend XP)
                </h3>
                <div className="flex flex-wrap gap-4">
                    {perks.length > 0 ? perks.map((r, i) => (
                        <button 
                            key={i}
                            onClick={() => spendXP(r)}
                            disabled={stats.xp < r.xp}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                stats.xp >= r.xp ? 'bg-blue-500 text-black border-blue-400 hover:scale-105 active:scale-95 cursor-pointer' : 'bg-gray-500/5 border-black/5 opacity-20 cursor-not-allowed grayscale shadow-inner'
                            }`}
                        >
                            <div className="text-[11px] font-black uppercase flex flex-col items-start">
                                <span>{r.label}</span>
                                <span className="opacity-60 text-[9px]">{r.xp} XP</span>
                            </div>
                        </button>
                    )) : (
                      <p className="text-xs text-gray-500 italic">No rewards set. Click the gear icon to add some!</p>
                    )}
                </div>
            </div>

            {/* INPUT BOX */}
            <div className={`${cardColor} p-8 rounded-[3.5rem] border`}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Mission Log</h2>
                    <div className={`flex gap-3 bg-black/20 p-2 rounded-2xl border border-white/5`}>
                        {[{v:"Frown", i:<Frown/>},{v:"Meh", i:<Meh/>},{v:"Smile", i:<Smile/>}].map(m => (
                            <button key={m.v} onClick={() => setMood(m.v)} 
                                className={`p-2.5 rounded-xl transition-all ${mood === m.v ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}>
                                {React.cloneElement(m.i, {size: 24})}
                            </button>
                        ))}
                    </div>
                </div>
                <textarea value={update} onChange={(e) => setUpdate(e.target.value)}
                    className="w-full bg-transparent border-none text-2xl focus:ring-0 h-32 placeholder:text-gray-700"
                    placeholder="Report your progress, soldier..." />
                
                <button onClick={submitUpdate} className="w-full bg-yellow-500 text-black font-black py-6 rounded-[2.5rem] text-2xl shadow-2xl hover:bg-yellow-400 transition-all uppercase tracking-tighter">
                    CONFIRM LOG (+{xpPreview} XP)
                </button>
            </div>
          </div>

          {/* SIDEBAR TIMELINE */}
          <div className={`lg:col-span-4 ${cardColor} rounded-[3.5rem] p-8 border`}>
            <h2 className="text-[10px] font-black uppercase text-gray-500 mb-10 flex items-center gap-2 tracking-[0.2em]">
                <History size={16} /> Neural Link Timeline
            </h2>
            <div className="space-y-10 text-left">
                {history.map(log => (
                    <div key={log._id} onClick={() => setSelectedLog(log)} className={`relative pl-8 border-l-2 ${log.type === "spend" ? 'border-red-500/30' : 'border-yellow-500/20'} cursor-pointer group hover:border-yellow-500 transition-all`}>
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${log.type === "spend" ? 'bg-red-500 border-red-200 shadow-[0_0_10px_red]' : 'bg-yellow-500 border-yellow-200 shadow-[0_0_10px_#eab308]'}`} />
                        <p className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">{new Date(log.date).toDateString()}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'} group-hover:text-yellow-600 transition-colors line-clamp-2 italic`}>"{log.text}"</p>
                        <p className={`text-[10px] font-black mt-2 uppercase ${log.type === "spend" ? 'text-red-500' : 'text-yellow-500/50'}`}>
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