import React, { useMemo, useState, useRef } from 'react';
import { Patient, RiskLevel, VitalSign } from '../types';
import { Icons } from './Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string | null) => void;
  onSendMessage: (text: string, type: 'TEXT' | 'IMAGE') => void;
  onLogout: () => void;
}

const RiskBadge = ({ level }: { level: RiskLevel }) => {
  const styles = {
    [RiskLevel.LOW]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    [RiskLevel.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-100',
    [RiskLevel.HIGH]: 'bg-orange-50 text-orange-700 border-orange-100',
    [RiskLevel.CRITICAL]: 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse font-bold'
  };
  return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles[level]}`}>{level}</span>;
};

export const DoctorDashboard: React.FC<Props> = ({ patients, selectedPatientId, onSelectPatient, onSendMessage, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'CLINICAL' | 'WHATSAPP'>('CLINICAL');
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const activePatient = patients.find(p => p.id === selectedPatientId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPatients = useMemo(() => {
    const riskWeights = { [RiskLevel.CRITICAL]: 4, [RiskLevel.HIGH]: 3, [RiskLevel.MEDIUM]: 2, [RiskLevel.LOW]: 1 };
    return patients
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery))
      .sort((a, b) => riskWeights[b.riskStatus] - riskWeights[a.riskStatus]);
  }, [patients, searchQuery]);

  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.riskStatus === RiskLevel.CRITICAL).length,
    urgent: patients.filter(p => p.riskStatus === RiskLevel.HIGH).length,
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput, 'TEXT');
    setChatInput('');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl">
      {/* LEFT SIDEBAR: PATIENT LIST WISE PROFILES */}
      <div className="w-96 border-r border-slate-100 flex flex-col bg-white">
        <div className="p-8 border-b border-slate-100 space-y-6">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 tracking-tighter">My Patients</h2>
              <button onClick={onLogout} className="text-slate-400 hover:text-rose-600 transition-colors"><Icons.LogOut size={20}/></button>
           </div>
           <div className="relative">
              <Icons.User className="absolute left-4 top-3.5 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
           {filteredPatients.map(p => (
              <button 
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className={`w-full text-left p-5 rounded-[24px] transition-all flex items-start gap-4 border ${
                  p.id === selectedPatientId 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' 
                    : 'bg-white border-transparent hover:bg-slate-50'
                }`}
              >
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                   p.id === selectedPatientId ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'
                 }`}>
                   {p.name.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                       <span className="font-black text-sm truncate">{p.name}</span>
                       <div className={`w-2 h-2 rounded-full mt-1.5 ${
                         p.riskStatus === RiskLevel.CRITICAL ? 'bg-rose-500 animate-pulse' :
                         p.riskStatus === RiskLevel.HIGH ? 'bg-orange-500' :
                         p.riskStatus === RiskLevel.MEDIUM ? 'bg-amber-500' : 'bg-emerald-500'
                       }`}></div>
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      p.id === selectedPatientId ? 'text-slate-400' : 'text-slate-500'
                    }`}>{p.condition[0]}</p>
                    <div className="flex items-center gap-3 mt-3">
                       <RiskBadge level={p.riskStatus}/>
                    </div>
                 </div>
              </button>
           ))}
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/20">
        {activePatient ? (
          <>
            <div className="h-24 border-b border-slate-100 flex items-center px-10 gap-10 bg-white">
               <div className="flex-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{activePatient.name}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier: {activePatient.id}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activePatient.age} Yrs • {activePatient.riskStatus} RISK</span>
                  </div>
               </div>
               <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button onClick={() => setActiveTab('CLINICAL')} className={`px-6 py-2.5 text-[11px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'CLINICAL' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Clinical Insights</button>
                  <button onClick={() => setActiveTab('WHATSAPP')} className={`px-6 py-2.5 text-[11px] font-black rounded-xl transition-all uppercase tracking-widest ${activeTab === 'WHATSAPP' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>WhatsApp Bridge</button>
               </div>
               <button onClick={() => onSelectPatient(null)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[20px] transition-colors">
                  <Icons.Close size={20} />
               </button>
            </div>

            {activeTab === 'CLINICAL' ? (
              <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                 <div className="grid grid-cols-3 gap-10">
                    <div className="col-span-2 bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                       <Icons.Shield className="absolute -right-10 -bottom-10 text-white/5" size={240} />
                       <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20"><Icons.Shield className="text-blue-400" size={28}/></div>
                          <h3 className="text-2xl font-black tracking-tight">AI Thematic Analysis</h3>
                          <div className="ml-auto px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">Real-time Verified</div>
                       </div>
                       <p className="text-lg text-slate-300 leading-relaxed font-medium mb-10 border-l-4 border-blue-500/50 pl-8">"{activePatient.latestInsight?.summary}"</p>
                       <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Risk Triggers</h4>
                            <ul className="space-y-3">
                               {activePatient.latestInsight?.reasoning.map((r, i) => (
                                  <li key={i} className="text-xs text-slate-200 flex items-start gap-3"><span className="text-rose-500 font-black">•</span> {r}</li>
                               ))}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol Path</h4>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-xs text-blue-200 font-bold leading-relaxed italic">
                               {activePatient.latestInsight?.clinicalActionSuggestion}
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[40px] p-8 flex flex-col shadow-sm">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Patient Uploads</h4>
                       <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-2 custom-scrollbar">
                          {activePatient.messages.filter(m => m.type === 'IMAGE').map((img, i) => (
                             <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 hover:border-blue-500 transition-colors cursor-pointer">
                                <img src={img.content} className="w-full h-full object-cover" alt="Clinical media" />
                             </div>
                          ))}
                          {activePatient.foodLogs.map(log => (
                             <div key={log.id} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                                <img src={log.imageUrl} className="w-full h-full object-cover" alt="Meal analysis" />
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-[48px] p-12 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                       <h3 className="text-xl font-black text-slate-900 flex items-center gap-4"><div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Icons.Trend size={24}/></div> longitudinal Stream</h3>
                       <div className="flex gap-2">
                          <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">Daily Average Analytics</span>
                       </div>
                    </div>
                    <div className="h-[400px]">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activePatient.vitalsHistory.filter(v => v.type === 'GLUCOSE')}>
                            <defs>
                              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                 <div className="flex-1 flex flex-col bg-slate-50">
                    <div className="flex-1 overflow-y-auto p-12 space-y-6 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-95">
                       {activePatient.messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === 'PATIENT' ? 'justify-start' : 'justify-end'}`}>
                             <div className={`max-w-[70%] p-6 rounded-[32px] shadow-xl relative border ${msg.sender === 'PATIENT' ? 'bg-white border-slate-100 text-slate-700' : 'bg-slate-900 text-white border-slate-800'}`}>
                                <p className={`text-[9px] font-black uppercase mb-1 tracking-widest ${msg.sender === 'PATIENT' ? 'text-slate-400' : 'text-blue-400'}`}>{msg.sender === 'PATIENT' ? activePatient.name : 'Dr. Arun Verma'}</p>
                                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                <span className="text-[8px] font-bold opacity-40 mt-2 block text-right uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                    <div className="p-8 bg-white border-t border-slate-100 flex items-center gap-6">
                       <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"><Icons.Camera size={24}/></button>
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                       <input 
                          type="text" 
                          placeholder="Type clinically validated response..." 
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-[28px] px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                       />
                       <button onClick={handleSend} className="p-5 bg-blue-600 text-white rounded-[28px] shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all"><Icons.Send size={24}/></button>
                    </div>
                 </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
             <div className="w-32 h-32 bg-slate-100 rounded-[48px] flex items-center justify-center text-slate-300 mb-8">
                <Icons.User size={64}/>
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Select a Patient Profile</h2>
             <p className="text-slate-500 max-w-sm leading-relaxed font-medium">Please select a patient from the list-wise profiles on the left to start analyzing clinical trends and conversations.</p>
          </div>
        )}
      </div>
    </div>
  );
};