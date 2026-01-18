import React, { useMemo, useState, useRef } from 'react';
import { Patient, VitalSign } from '../types';
import { Icons } from './Icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PatientSimulator } from './PatientSimulator'; 

interface Props {
  patient: Patient;
  onLogout: () => void;
  onSendMessage: (text: string, type: 'TEXT' | 'IMAGE' | 'DOCUMENT', fileName?: string) => void;
  isProcessing: boolean;
}

export const PatientDashboard: React.FC<Props> = ({ patient, onLogout, onSendMessage, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CHAT' | 'RECORDS' | 'FOOD'>('DASHBOARD');
  const [chartMode, setChartMode] = useState<'GLUCOSE' | 'BP' | 'HR' | 'TEMP' | 'URINE'>('GLUCOSE');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getVital = (type: VitalSign['type']) => {
    const sorted = [...patient.vitalsHistory]
      .filter(v => v.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted[0] || null;
  };

  const chartData = useMemo(() => {
    const sorted = [...patient.vitalsHistory].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (chartMode === 'BP') {
        const sys = sorted.filter(v => v.type === 'BP_SYSTOLIC');
        const dia = sorted.filter(v => v.type === 'BP_DIASTOLIC');
        return sys.map((s, i) => ({
             time: new Date(s.timestamp).toLocaleDateString([], { weekday: 'short' }),
             sys: s.value,
             dia: dia[i]?.value || null
        })).slice(-7);
    }
    const typeKeyMap: Record<string, VitalSign['type']> = {
      'GLUCOSE': 'GLUCOSE',
      'HR': 'HEART_RATE',
      'TEMP': 'TEMP',
      'URINE': 'URINE_OUTPUT'
    };
    return sorted.filter(v => v.type === typeKeyMap[chartMode]).map(g => ({
        time: new Date(g.timestamp).toLocaleDateString([], { weekday: 'short' }),
        value: g.value
    })).slice(-7);
  }, [patient, chartMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onSendMessage(url, 'IMAGE');
      setActiveTab('CHAT');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden">
      {/* PAJR Patient Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center z-30 sticky top-0 border-b border-slate-200">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">P</div>
           <div>
             <h1 className="text-sm font-black text-slate-900 leading-none">PAJR Patient</h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Role: Follow-up Portal</p>
           </div>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">
          <Icons.Menu size={20} />
        </button>
      </header>

      {/* Primary Mobile Navigation */}
      <div className="flex bg-white px-2 py-1 gap-1 border-b border-slate-200 shrink-0">
        {[
          { id: 'DASHBOARD', label: 'Vitals', icon: Icons.Activity },
          { id: 'CHAT', label: 'Care Chat', icon: Icons.Chat },
          { id: 'FOOD', label: 'Nutrition', icon: Icons.Utensils },
          { id: 'RECORDS', label: 'History', icon: Icons.File },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-1 text-[10px] font-black rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all uppercase tracking-widest ${
              activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'DASHBOARD' ? (
          <div className="p-6 space-y-6 max-w-lg mx-auto pb-24">
            
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: 'Sugar', val: getVital('GLUCOSE')?.value || '--', unit: 'mg/dL', color: 'emerald', icon: Icons.Droplet },
                 { label: 'BP', val: getVital('BP_SYSTOLIC') ? `${getVital('BP_SYSTOLIC')?.value}/${getVital('BP_DIASTOLIC')?.value}` : '--', unit: 'mmHg', color: 'rose', icon: Icons.Activity },
                 { label: 'Pulse', val: getVital('HEART_RATE')?.value || '--', unit: 'bpm', color: 'pink', icon: Icons.Heart },
                 { label: 'Temp', val: getVital('TEMP')?.value || '--', unit: '°F', color: 'orange', icon: Icons.Thermometer },
                 { label: 'Urine', val: getVital('URINE_OUTPUT')?.value || '--', unit: 'ml/day', color: 'amber', icon: Icons.Droplet },
               ].map((v, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                    <div className={`p-2 w-fit rounded-xl bg-${v.color}-50 text-${v.color}-600 mb-4`}><v.icon size={20} /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.label}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">{v.val}</span>
                      <span className="text-[10px] font-bold text-slate-400">{v.unit}</span>
                    </div>
                  </div>
               ))}
            </div>

            {/* Vital Trend Analysis */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-widest">Biometric Trends</h3>
                    <select 
                      value={chartMode} 
                      onChange={(e) => setChartMode(e.target.value as any)}
                      className="text-[10px] font-black bg-slate-50 border-none rounded-lg py-1 px-3 text-slate-600 focus:ring-0"
                    >
                      <option value="GLUCOSE">Glucose</option>
                      <option value="BP">BP</option>
                      <option value="HR">Pulse</option>
                      <option value="TEMP">Temp</option>
                      <option value="URINE">Urine</option>
                    </select>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 800}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                        {chartMode === 'BP' ? (
                             <>
                                <Line type="monotone" dataKey="sys" stroke="#f43f5e" strokeWidth={4} dot={false} />
                                <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={4} dot={false} />
                             </>
                        ) : (
                            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={5} dot={{r: 4, fill: 'white', strokeWidth: 3, stroke: '#10b981'}} />
                        )}
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Wearable Analytics: Steps & Sleep */}
            <div className="grid grid-cols-1 gap-6">
               <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Icons.Steps size={20}/></div>
                    <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-widest">Physical Activity (Steps)</h3>
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={patient.wearableHistory}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="steps" radius={[10, 10, 0, 0]}>
                          {patient.wearableHistory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.steps > 5000 ? '#6366f1' : '#cbd5e1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </section>

               <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Icons.Moon size={20}/></div>
                    <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-widest">Sleep Cycle (Hours)</h3>
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={patient.wearableHistory}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="sleepHours" fill="#a855f7" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </section>
            </div>
          </div>
        ) : activeTab === 'FOOD' ? (
          <div className="p-6 pb-24 max-w-lg mx-auto space-y-6">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tighter">Food Plate Analysis</h2>
                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><Icons.Camera size={20}/></button>
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
             
             {patient.foodLogs.map(log => (
               <div key={log.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex gap-4">
                    <img src={log.imageUrl} className="w-24 h-24 rounded-2xl object-cover shadow-md" alt="Meal" />
                    <div className="flex-1 space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.analysis.mealType} • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       <h4 className="text-lg font-black text-slate-900">{log.analysis.caloriesEstimate} <span className="text-xs font-bold text-slate-400">kcal</span></h4>
                       <div className={`px-2 py-0.5 w-fit rounded-lg text-[9px] font-black uppercase ${log.analysis.flag === 'Balanced' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{log.analysis.flag}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                     <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Carbs</p>
                        <p className="text-sm font-black text-slate-700">{log.analysis.carbs}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Protein</p>
                        <p className="text-sm font-black text-slate-700">{log.analysis.protein}</p>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        ) : activeTab === 'RECORDS' ? (
          <div className="p-6 pb-24 max-w-lg mx-auto space-y-4">
             <h2 className="text-xl font-black text-slate-900 tracking-tighter mb-4">Clinical Timeline</h2>
             {patient.messages.slice().reverse().map((msg, i) => (
               <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${msg.type === 'IMAGE' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {msg.type === 'IMAGE' ? <Icons.Image size={24}/> : <Icons.Chat size={24}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{new Date(msg.timestamp).toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{msg.type === 'IMAGE' ? 'Image Attachment' : msg.content}</p>
                  </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="h-full flex flex-col max-w-lg mx-auto bg-[#e5ddd5]">
             <PatientSimulator 
                patient={patient} 
                onSendMessage={onSendMessage} 
                isTyping={isProcessing} 
             />
          </div>
        )}
      </div>

      {/* Profile Sidebar */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setIsMenuOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 shadow-2xl p-10 flex flex-col rounded-l-[40px]">
             <button onClick={() => setIsMenuOpen(false)} className="self-end p-2 text-slate-400"><Icons.Close size={32}/></button>
             <div className="mt-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-[32px] bg-slate-100 flex items-center justify-center text-slate-400 mb-6 font-black text-4xl">{patient.name.charAt(0)}</div>
                <h3 className="text-2xl font-black text-slate-900">{patient.name}</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">ID: {patient.id}</p>
             </div>
             <div className="mt-12 space-y-4">
                <button className="w-full text-left p-5 bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 flex items-center gap-4"><Icons.User size={20}/> Profile Settings</button>
                <button className="w-full text-left p-5 bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 flex items-center gap-4"><Icons.Phone size={20}/> Emergency Contacts</button>
                <button onClick={onLogout} className="w-full text-left p-5 bg-rose-50 rounded-2xl font-black text-xs uppercase tracking-widest text-rose-600 flex items-center gap-4"><Icons.LogOut size={20}/> Logout</button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};