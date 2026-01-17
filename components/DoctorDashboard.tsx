import React, { useMemo, useState, useRef } from 'react';
import { Patient, RiskLevel, VitalSign } from '../types';
import { Icons } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string | null) => void;
  onSendMessage: (text: string, type: 'TEXT' | 'IMAGE') => void;
  onLogout: () => void;
}

const RiskBadge = ({ level }: { level: RiskLevel }) => {
  const colors = {
    [RiskLevel.LOW]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [RiskLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [RiskLevel.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
    [RiskLevel.CRITICAL]: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[level]}`}>
      {level}
    </span>
  );
};

export const DoctorDashboard: React.FC<Props> = ({ patients, selectedPatientId, onSelectPatient, onSendMessage, onLogout }) => {
  const activePatient = patients.find(p => p.id === selectedPatientId);
  const [chartMode, setChartMode] = useState<'GLUCOSE' | 'BP' | 'HR' | 'TEMP'>('GLUCOSE');
  const [activeTab, setActiveTab] = useState<'CLINICAL' | 'COMMUNICATION'>('CLINICAL');
  const [chatInput, setChatInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Statistics for Triage Dashboard
  const stats = useMemo(() => {
    return {
      total: patients.length,
      critical: patients.filter(p => p.riskStatus === RiskLevel.CRITICAL || p.riskStatus === RiskLevel.HIGH).length,
      medium: patients.filter(p => p.riskStatus === RiskLevel.MEDIUM).length,
      stable: patients.filter(p => p.riskStatus === RiskLevel.LOW).length,
    };
  }, [patients]);

  // Sorted Patients for Priority List
  const sortedPatients = useMemo(() => {
    const riskWeight = {
      [RiskLevel.CRITICAL]: 4,
      [RiskLevel.HIGH]: 3,
      [RiskLevel.MEDIUM]: 2,
      [RiskLevel.LOW]: 1
    };
    return [...patients].sort((a, b) => riskWeight[b.riskStatus] - riskWeight[a.riskStatus]);
  }, [patients]);

  // Prepare chart data based on selector
  const chartData = useMemo(() => {
    if (!activePatient) return [];
    
    const sortedHistory = [...activePatient.vitalsHistory].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (chartMode === 'GLUCOSE') {
        return sortedHistory.filter(v => v.type === 'GLUCOSE').map(g => ({
            time: new Date(g.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            value: g.value
        })).slice(-10);
    } else if (chartMode === 'HR') {
        return sortedHistory.filter(v => v.type === 'HEART_RATE').map(g => ({
            time: new Date(g.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            value: g.value
        })).slice(-10);
    } else if (chartMode === 'TEMP') {
        return sortedHistory.filter(v => v.type === 'TEMP').map(g => ({
            time: new Date(g.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            value: g.value
        })).slice(-10);
    } else if (chartMode === 'BP') {
        const sys = sortedHistory.filter(v => v.type === 'BP_SYSTOLIC');
        const dia = sortedHistory.filter(v => v.type === 'BP_DIASTOLIC');
        return sys.map((s, i) => ({
             time: new Date(s.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
             sys: s.value,
             dia: dia[i]?.value || null
        })).slice(-10);
    }
    return [];
  }, [activePatient, chartMode]);

  const handleSendText = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput, 'TEXT');
    setChatInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onSendMessage(imageUrl, 'IMAGE');
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 relative">
      
      {/* Patient List Sidebar */}
      <div className="w-1/3 min-w-[300px] border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Patient Queue</h2>
            <p className="text-[10px] text-gray-500">{stats.critical} Actionable Items</p>
          </div>
          <button 
            onClick={() => onSelectPatient(null)} 
            className="p-1.5 hover:bg-gray-100 rounded-md text-blue-600 transition-colors"
            title="Triage Dashboard"
          >
            <Icons.Activity size={18} />
          </button>
        </div>
        
        <div className="p-3 border-b border-gray-100 bg-white">
          <div className="relative">
            <Icons.User className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter patients..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sortedPatients.map(patient => (
            <div 
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50 ${patient.id === activePatient?.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-gray-900">{patient.name}</span>
                <RiskBadge level={patient.riskStatus} />
              </div>
              <p className="text-xs text-gray-500 mb-2">{patient.condition.join(', ')}</p>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Icons.Clock size={12} /> {new Date(patient.lastInteraction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                </span>
                {patient.isFlagged && <Icons.Alert className="text-red-500" size={14} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        
        {/* Universal Doctor Header/Menu (Inside Dashboard) */}
        <div className="h-14 border-b border-gray-200 flex justify-between items-center px-6 bg-white shrink-0">
            <div className="flex items-center gap-4">
               <h2 className="font-bold text-gray-700">
                  {activePatient ? `Clinical Record: ${activePatient.id}` : 'Triage Dashboard'}
               </h2>
               {activePatient && (
                 <div className="flex bg-gray-100 rounded-lg p-1">
                    <button 
                       onClick={() => setActiveTab('CLINICAL')}
                       className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'CLINICAL' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                       Clinical Overview
                    </button>
                    <button 
                       onClick={() => setActiveTab('COMMUNICATION')}
                       className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'COMMUNICATION' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                       WhatsApp & AI Analysis
                    </button>
                 </div>
               )}
            </div>
            <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                        DR
                    </div>
                    <Icons.Menu size={20} className="text-gray-600" />
                </button>

                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                        <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2">
                             <div className="px-4 py-3 border-b border-gray-50">
                                <p className="text-sm font-bold text-gray-800">Dr. Arun Verma</p>
                                <p className="text-xs text-gray-500">Cardiology • ID: D-001</p>
                             </div>
                             
                             <button onClick={() => { onSelectPatient(null); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Icons.Activity size={16} className="text-blue-500"/> Triage Board
                             </button>
                             <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Icons.Clock size={16} className="text-purple-500"/> On-Call Schedule
                             </button>
                             <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Icons.File size={16} className="text-orange-500"/> Protocols & Guidelines
                             </button>
                             <div className="border-t border-gray-100 my-1"></div>
                             <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Icons.LogOut size={16} /> Logout
                             </button>
                        </div>
                    </>
                )}
            </div>
        </div>

        {activePatient ? (
          activeTab === 'CLINICAL' ? (
          /* SINGLE PATIENT VIEW - CLINICAL OVERVIEW */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activePatient.name}</h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <span>{activePatient.age} yrs</span>
                  <span>•</span>
                  <span>ID: #{activePatient.id}</span>
                  <span>•</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{activePatient.condition.join(', ')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                   Archive
                 </button>
                 <button onClick={() => onSelectPatient(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                   Close
                 </button>
              </div>
            </div>

            {/* Top Row: AI Insight & Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* AI Insight Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-indigo-100 rounded-md">
                            <Icons.Shield className="text-indigo-600" size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-900">Clinical Intelligence</h3>
                        <span className="text-xs text-gray-400 font-mono ml-auto">Confidence: {(activePatient.latestInsight?.confidenceScore || 0) * 100}%</span>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                        {/* Thematic Tags */}
                        {activePatient.latestInsight?.themes && activePatient.latestInsight.themes.length > 0 && (
                             <div className="flex flex-wrap gap-2">
                                {activePatient.latestInsight.themes.map((theme, idx) => (
                                    <span key={idx} className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md">
                                        #{theme}
                                    </span>
                                ))}
                             </div>
                        )}

                        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                            <p className="text-gray-800 text-sm leading-relaxed">
                                <span className="font-semibold text-gray-900">Summary: </span>
                                {activePatient.latestInsight?.summary || "No recent analysis available."}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Key Risk Factors</h4>
                                <ul className="space-y-1">
                                    {activePatient.latestInsight?.reasoning.map((reason, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                            <Icons.ChevronRight className="text-red-400 mt-0.5 flex-shrink-0" size={14} />
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Action Plan</h4>
                                <p className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                                    {activePatient.latestInsight?.clinicalActionSuggestion}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vitals Charts */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Icons.Activity className="text-emerald-500" size={20} />
                            Vitals Trends
                        </h3>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button onClick={() => setChartMode('GLUCOSE')} className={`px-2 py-1 text-[10px] rounded-md transition-all ${chartMode === 'GLUCOSE' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>Glu</button>
                            <button onClick={() => setChartMode('BP')} className={`px-2 py-1 text-[10px] rounded-md transition-all ${chartMode === 'BP' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>BP</button>
                            <button onClick={() => setChartMode('HR')} className={`px-2 py-1 text-[10px] rounded-md transition-all ${chartMode === 'HR' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>HR</button>
                            <button onClick={() => setChartMode('TEMP')} className={`px-2 py-1 text-[10px] rounded-md transition-all ${chartMode === 'TEMP' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>Temp</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="time" tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                                {chartMode === 'BP' ? (
                                    <>
                                        <Line yAxisId="left" type="monotone" dataKey="sys" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
                                        <Line yAxisId="left" type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} />
                                    </>
                                ) : (
                                    <Line yAxisId="left" type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {/* Disclaimer Footer */}
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-3">
                <Icons.Alert className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                    <h4 className="text-sm font-bold text-orange-800">Clinical Safety Warning</h4>
                    <p className="text-xs text-orange-700 mt-1">
                        AI insights are for triage support only and do not constitute a medical diagnosis. 
                        Always verify raw data before making clinical decisions. This system operates under 
                        Standard Operating Procedure #88-A (Assisted Triage).
                    </p>
                </div>
            </div>
          </div>
          ) : (
          /* SINGLE PATIENT VIEW - COMMUNICATION & ANALYSIS */
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Left Col: WhatsApp Group View */}
            <div className="w-3/5 border-r border-gray-200 flex flex-col bg-[#e5ddd5]">
                <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                        <Icons.User size={20} />
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-800 text-sm">PAJR-{activePatient.name.split(' ')[0]}</h3>
                         <p className="text-[10px] text-gray-500 truncate w-48">You, Care Coordinator, Patient, Dr. Smith (On-Call)</p>
                      </div>
                   </div>
                   <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                      <Icons.Menu size={18} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-95">
                    {activePatient.messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 text-xs bg-white/50 rounded-lg p-4 mx-10 mt-10">
                            This is the start of the secure care group.
                        </div>
                    ) : (
                        activePatient.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'PATIENT' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`max-w-[70%] p-2 rounded-lg shadow-sm text-sm relative border border-gray-100 ${
                                        msg.sender === 'PATIENT'
                                        ? 'bg-white text-gray-900 rounded-tl-none'
                                        : msg.sender === 'DOCTOR' 
                                            ? 'bg-blue-100 text-gray-900 rounded-tr-none'
                                            : 'bg-[#dcf8c6] text-gray-900 rounded-tr-none'
                                    }`}
                                >
                                    <div className="text-[10px] font-bold mb-1 text-gray-500 uppercase flex justify-between gap-4">
                                        <span>{msg.sender === 'PATIENT' ? activePatient.name : msg.sender === 'DOCTOR' ? 'Dr. Verma' : 'AI Assistant'}</span>
                                        {msg.sender === 'SYSTEM' && <span className="text-[9px] bg-green-200 px-1 rounded text-green-800">BOT</span>}
                                    </div>
                                    {msg.type === 'IMAGE' ? (
                                        <div className="mb-1">
                                            <img src={msg.content} alt="Attachment" className="rounded-lg max-h-48 object-cover w-full border border-black/5" />
                                        </div>
                                    ) : msg.type === 'DOCUMENT' ? (
                                        <div className="flex items-center gap-3 bg-white/80 p-2 rounded border border-gray-200 mb-1">
                                            <div className="p-2 bg-gray-100 rounded text-gray-600">
                                                <Icons.File size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-800">{msg.fileName || 'File.pdf'}</p>
                                                <p className="text-[9px] text-gray-500">Document</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                    <span className="text-[10px] text-gray-400 block text-right mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Chat Input */}
                <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                    <button 
                        onClick={() => docFileInputRef.current?.click()}
                        className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                        title="Attach Image"
                    >
                        <Icons.Paperclip size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={docFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    <input 
                        type="text" 
                        placeholder="Type a message to group..."
                        className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    />
                    <button 
                        onClick={handleSendText}
                        disabled={!chatInput.trim()}
                        className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <Icons.Send size={18} />
                    </button>
                </div>
            </div>

            {/* Right Col: AI Thematic Analysis */}
            <div className="w-2/5 overflow-y-auto bg-slate-50 p-6 border-l border-gray-200 custom-scrollbar">
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide mb-1">
                        <Icons.Activity className="text-purple-600" size={16} />
                        AI Thematic Analysis
                    </h3>
                    <p className="text-xs text-gray-500">Real-time analysis of group conversation patterns.</p>
                </div>

                <div className="space-y-6">
                    {/* Theme Cloud */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-600 uppercase mb-3">Identified Themes</h4>
                        <div className="flex flex-wrap gap-2">
                            {activePatient.latestInsight?.themes.map((theme, i) => (
                                <span key={i} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                    #{theme}
                                </span>
                            ))}
                            <span className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 border border-gray-100">
                                #RoutineCheck
                            </span>
                        </div>
                    </div>

                    {/* Risk Reasoning */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-600 uppercase mb-3">Key Risk Signals</h4>
                        <ul className="space-y-2">
                            {activePatient.latestInsight?.reasoning.map((reason, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-700">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></div>
                                    {reason}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Conversation Summary */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-600 uppercase mb-3">Conversation Summary</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {activePatient.latestInsight?.summary}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-600 uppercase mb-3">Suggested Responses</h4>
                        <div className="space-y-2">
                            <button onClick={() => setChatInput(`Please schedule a follow-up for next Tuesday.`)} className="w-full text-left p-2 rounded hover:bg-gray-50 text-xs text-blue-600 border border-dashed border-blue-200 transition-colors">
                                + Schedule Follow-up
                            </button>
                            <button onClick={() => setChatInput(`Please upload your post-prandial glucose reading.`)} className="w-full text-left p-2 rounded hover:bg-gray-50 text-xs text-blue-600 border border-dashed border-blue-200 transition-colors">
                                + Request Glucose Log
                            </button>
                            <button onClick={() => setChatInput(`Please take your blood pressure now and share the reading.`)} className="w-full text-left p-2 rounded hover:bg-gray-50 text-xs text-blue-600 border border-dashed border-blue-200 transition-colors">
                                + Request BP Check
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          )
        ) : (
          /* TRIAGE DASHBOARD (Home View) */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
             <h1 className="text-2xl font-bold text-gray-900 mb-6">Triage Board</h1>
             
             {/* Stats Cards */}
             <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Patients</p>
                    <div className="flex items-end gap-2 mt-2">
                         <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
                         <span className="text-xs text-green-600 mb-1">Active</span>
                    </div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Critical / High</p>
                    <div className="flex items-end gap-2 mt-2">
                         <span className="text-3xl font-bold text-red-700">{stats.critical}</span>
                         <span className="text-xs text-red-600 mb-1">Needs Action</span>
                    </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm">
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Medium Risk</p>
                    <div className="flex items-end gap-2 mt-2">
                         <span className="text-3xl font-bold text-yellow-800">{stats.medium}</span>
                         <span className="text-xs text-yellow-700 mb-1">Monitor</span>
                    </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Stable</p>
                    <div className="flex items-end gap-2 mt-2">
                         <span className="text-3xl font-bold text-emerald-800">{stats.stable}</span>
                         <span className="text-xs text-emerald-700 mb-1">Routine</span>
                    </div>
                </div>
             </div>

             {/* Priority List */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-800">Priority Queue</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium">Patient</th>
                            <th className="px-6 py-3 font-medium">Risk Status</th>
                            <th className="px-6 py-3 font-medium">Condition</th>
                            <th className="px-6 py-3 font-medium">Last Interaction</th>
                            <th className="px-6 py-3 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedPatients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{patient.name}</p>
                                            <p className="text-xs text-gray-500">ID: {patient.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <RiskBadge level={patient.riskStatus} />
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {patient.condition.join(', ')}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {new Date(patient.lastInteraction).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => onSelectPatient(patient.id)}
                                      className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                    >
                                        Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};