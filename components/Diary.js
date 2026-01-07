import React, { forwardRef, useMemo, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { X, Book, ChevronLeft, ChevronRight, Star, Award, PenTool } from 'lucide-react';

const Page = forwardRef((props, ref) => {
  return (
    <div className="bg-[#fffef0] shadow-inner relative overflow-hidden h-full flex flex-col border-l border-slate-300/50" ref={ref} data-density="hard">
      {/* Paper Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
      
      {/* Notebook Lines */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '100% 2.2rem' }} />
      
      {/* Red Margin Line */}
      <div className="absolute left-10 sm:left-14 top-0 bottom-0 w-[1.5px] bg-red-400 opacity-20" />
      
      <div className="p-6 sm:p-12 pt-10 relative z-10 h-full flex flex-col">
        {props.children}
        <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-100">
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Mission: 2026 Archive</span>
          <span className="text-[9px] font-mono text-slate-400">pg. {props.number}</span>
        </div>
      </div>
    </div>
  );
});

Page.displayName = 'Page';

export default function Diary({ logs, onClose }) {
  const [domLoaded, setDomLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 500, height: 700 });

  useEffect(() => {
    setDomLoaded(true);
    const updateDimensions = () => {
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: isMobile ? window.innerWidth * 0.9 : 500,
        height: isMobile ? window.innerHeight * 0.7 : 700,
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const groupedLogs = useMemo(() => {
    const groups = {};
    logs.forEach(log => {
      const date = new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return Object.entries(groups).reverse();
  }, [logs]);

  // If component isn't fully mounted, don't render (prevents double-page ghosting)
  if (!domLoaded) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      {/* Header UI */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none hidden sm:flex">
         <div className="flex items-center gap-3 text-yellow-500/80">
            <PenTool size={20} />
            <h2 className="text-xl font-black italic uppercase tracking-[0.3em]">Operational Diary</h2>
         </div>
      </div>

      <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full z-[210]">
        <X size={28} />
      </button>

      <div className="w-full flex flex-col items-center justify-center">
        <div className="relative">
            <HTMLFlipBook 
              width={dimensions.width} 
              height={dimensions.height} 
              size="stretch"
              minWidth={300}
              maxWidth={600}
              minHeight={400}
              maxHeight={800}
              showCover={true}
              flippingTime={1000}
              usePortrait={window.innerWidth < 1024} // Portrait for mobile and tablets
              startPage={0}
              autoSize={true}
              className="mission-diary shadow-2xl"
            >
              {/* --- 1. FRONT COVER --- */}
              <Page number={1}>
                <div className="flex flex-col items-center justify-center h-full text-center border-2 border-slate-200/50 rounded-2xl p-4 bg-white/40">
                  <div className="mb-6 p-4 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 shadow-inner">
                    <Award size={48} />
                  </div>
                  <h1 className="text-4xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">THE<br/>ASCENSION<br/>2026</h1>
                  <div className="w-20 h-[3px] bg-yellow-500/40 my-10 rounded-full" />
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Operational Logs</p>
                </div>
              </Page>

              {/* --- 2. DATA PAGES --- */}
              {groupedLogs.map(([date, dateLogs], idx) => (
                <Page key={date} number={idx + 2}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest">{date}</h3>
                    {dateLogs.length > 2 && (
                        <div className="p-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1 scale-75 origin-right border border-green-200">
                           <Star size={10} fill="currentColor"/> <span className="text-[8px] font-black uppercase">Elite</span>
                        </div>
                    )}
                  </div>
                  <div className="w-full h-[1px] bg-slate-200 mb-6" />
                  
                  <div className="space-y-8 flex-1 overflow-y-auto custom-diary-scroll pr-2">
                    {dateLogs.map((log) => (
                      <div key={log._id} className="relative pl-6">
                        <div className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-slate-300 border border-slate-400" />
                        <p className="text-slate-800 text-sm sm:text-base leading-[1.8rem] font-serif italic mb-2">
                          {log.text}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {log.tasksCompleted?.map(t => (
                            <span key={t} className="text-[8px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="text-[9px] font-bold text-yellow-600/60 uppercase tracking-widest">
                           +{log.xpGained || 100} XP SECURED
                        </div>
                      </div>
                    ))}
                  </div>
                </Page>
              ))}

              {/* --- 3. BACK COVER --- */}
              <Page number={groupedLogs.length + 2}>
                <div className="flex flex-col items-center justify-center h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl opacity-50 grayscale scale-[0.9]">
                   <PenTool size={48} className="text-slate-400 mb-6" /> {/* Fixed casing here */}
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em] text-center leading-loose">The Grind Continues</p>
                </div>
              </Page>
            </HTMLFlipBook>
        </div>

        {/* UI Instruction */}
        <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex gap-6 text-white/30 text-[10px] font-black uppercase tracking-widest items-center">
                <span className="flex items-center gap-2"><ChevronLeft size={14}/> Flip Corner</span>
                <span className="w-1 h-1 bg-white/10 rounded-full" />
                <span className="flex items-center gap-2">Swipe <ChevronRight size={14}/></span>
            </div>
        </div>
      </div>

      <style jsx global>{`
        .mission-diary { border-radius: 5px; }
        .custom-diary-scroll::-webkit-scrollbar { width: 2px; }
        .custom-diary-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; }
        .stf__parent { background-color: transparent !important; }
        .stf__block { background-color: transparent !important; }
      `}</style>
    </div>
  );
}