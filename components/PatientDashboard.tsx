import React, { useMemo, useState, useRef } from 'react';
import { Patient, VitalSign } from '../types';
import { Icons } from './Icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PatientSimulator } from './PatientSimulator'; 

interface Props {
  patient: Patient;
  onLogout: () => void;
  onSendMessage: (text: string, type: 'TEXT' | 'IMAGE' | 'DOCUMENT', fileName?: string) => void;
  isProcessing: boolean;
}

export const PatientDashboard: React.FC<Props> = ({ patient, onLogout, onSendMessage, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CHAT' | 'RECORDS'>('DASHBOARD');
  const [chartMode, setChartMode] = useState<'GLUCOSE' | 'BP' | 'HR' | 'TEMP'>('GLUCOSE');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Helper to get latest vital
  const getVital = (type: VitalSign['type']) => {
    const sorted = [...patient.vitalsHistory]
      .filter(v => v.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted[0] || null;
  };

  const bpSys = getVital('BP_SYSTOLIC');
  const bpDia = getVital('BP_DIASTOLIC');
  const heartRate = getVital('HEART_RATE');
  const temp = getVital('TEMP');
  const urine = getVital('URINE_OUTPUT');

  // Prepare chart data dynamically based on selection
  const chartData = useMemo(() => {
    if (!patient) return [];
    
    // Sort chronologically
    const sortedHistory = [...patient.vitalsHistory].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (chartMode === 'GLUCOSE') {
        return sortedHistory.filter(v => v.type === 'GLUCOSE').map(g => ({
            time: new Date(g.timestamp).toLocaleDateString([], { weekday: 'short' }),
            value: g.value
        })).slice(-7);
    } else if (chartMode === 'HR') {
        return sortedHistory.filter(v => v.type === 'HEART_RATE').map(g => ({
            time: new Date(g.timestamp).toLocaleDateString([], { weekday: 'short' }),
            value: g.value
        })).slice(-7);
    } else if (chartMode === 'TEMP') {
        return sortedHistory.filter(v => v.type === 'TEMP').map(g => ({
            time: new Date(g.timestamp).toLocaleDateString([], { weekday: 'short' }),
            value: g.value
        })).slice(-7);
    } else if (chartMode === 'BP') {
        // Need to pair Sys/Dia
        const sys = sortedHistory.filter(v => v.type === 'BP_SYSTOLIC');
        const dia = sortedHistory.filter(v => v.type === 'BP_DIASTOLIC');
        // Simple mapping based on index for this mock
        return sys.map((s, i) => ({
             time: new Date(s.timestamp).toLocaleDateString([], { weekday: 'short' }),
             sys: s.value,
             dia: dia[i]?.value || null
        })).slice(-7);
    }
    return [];
  }, [patient, chartMode]);

  // Mock Data for Bar Charts (Wearables)
  const stepsData = [
    { day: 'Mon', steps: 4500 },
    { day: 'Tue', steps: 6200 },
    { day: 'Wed', steps: 5100 },
    { day: 'Thu', steps: 7800 },
    { day: 'Fri', steps: 4200 },
    { day: 'Sat', steps: 8100 },
    { day: 'Sun', steps: patient.wearableData?.steps || 5500 },
  ];

  const sleepData = [
    { day: 'Mon', hours: 6.2 },
    { day: 'Tue', hours: 7.1 },
    { day: 'Wed', hours: 6.5 },
    { day: 'Thu', hours: 5.8 },
    { day: 'Fri', hours: 7.5 },
    { day: 'Sat', hours: 8.0 },
    { day: 'Sun', hours: patient.wearableData?.sleepHours || 7.0 },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a fake local URL for the demo
      const imageUrl = URL.createObjectURL(file);
      onSendMessage(imageUrl, 'IMAGE');
      setIsMenuOpen(false);
      setActiveTab('CHAT'); 
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use proper DOCUMENT type
      // For demo, we fake a URL for the file
      onSendMessage('https://example.com/file.pdf', 'DOCUMENT', file.name);
      setIsMenuOpen(false);
      setActiveTab('RECORDS'); // Go to records view to see it
    }
  };

  // Prepare Clinical Records Data
  const clinicalRecords = useMemo(() => {
      // Combine messages, files, and images into a single timeline
      return patient.messages.slice().reverse(); // Newest first
  }, [patient.messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      {/* Mobile-first Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center z-20 sticky top-0">
        <div className="flex items-center gap-3">
           <img 
             src={`https://picsum.photos/seed/${patient.id}/100/100`} 
             alt="Profile" 
             className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
           />
           <div>
             <h1 className="text-sm font-bold text-gray-900 leading-tight">Hi, {patient.name.split(' ')[0]}</h1>
             <p className="text-[10px] text-gray-500">PAJR ID: {patient.id}</p>
           </div>
        </div>
        
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 focus:outline-none">
            <Icons.Menu size={20} />
          </button>

          {isMenuOpen && (
             <>
               <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
               <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Patient Menu</p>
                  </div>
                  
                  <button onClick={() => { setActiveTab('RECORDS'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                     <Icons.File size={18} className="text-blue-500"/> 
                     <span>Clinical Records</span>
                  </button>
                  
                  <button onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                     <Icons.Image size={18} className="text-purple-500"/> 
                     <span>Upload Image</span>
                  </button>
                  
                  <button onClick={() => { docInputRef.current?.click(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                     <Icons.Paperclip size={18} className="text-orange-500"/> 
                     <span>Upload File</span>
                  </button>
                  
                  <button onClick={() => { alert('EMERGENCY CONTACTS:\n\nDr. Verma: +91 98765 43210\nAmbulance: 108\nCare Coordinator: +91 99887 76655'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-3 transition-colors">
                     <Icons.Phone size={18} className="text-red-500"/> 
                     <span>Emergency Contact</span>
                  </button>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                         <Icons.LogOut size={18} /> 
                         <span>Logout</span>
                      </button>
                  </div>
               </div>
             </>
          )}
        </div>
      </header>

      {/* Hidden File Inputs */}
      <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept="image/*"
         onChange={handleImageUpload}
       />
      <input 
         type="file" 
         ref={docInputRef} 
         className="hidden" 
         accept=".pdf,.doc,.docx,.txt"
         onChange={handleFileUpload}
       />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button 
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'DASHBOARD' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          <Icons.Activity size={16} /> My Health
        </button>
        <button 
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'CHAT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          <Icons.Chat size={16} /> Care Chat
        </button>
        <button 
          onClick={() => setActiveTab('RECORDS')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'RECORDS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          <Icons.File size={16} /> Records
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'DASHBOARD' ? (
          <div className="p-4 space-y-6 max-w-lg mx-auto pb-20">
            {/* Quick Vitals Grid */}
            <section className="grid grid-cols-2 gap-3">
               <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Icons.Activity size={16} className="text-red-500" />
                    <span className="text-xs font-medium">Blood Pressure</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900">{bpSys?.value || '--'}/{bpDia?.value || '--'}</span>
                    <span className="text-[10px] text-gray-400 ml-1">{bpSys?.unit || 'mmHg'}</span>
                  </div>
               </div>

               <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Icons.Heart size={16} className="text-rose-500" />
                    <span className="text-xs font-medium">Heart Rate</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900">{heartRate?.value || '--'}</span>
                    <span className="text-[10px] text-gray-400 ml-1">BPM</span>
                  </div>
               </div>

               <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Icons.Thermometer size={16} className="text-orange-500" />
                    <span className="text-xs font-medium">Temperature</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900">{temp?.value || '--'}</span>
                    <span className="text-[10px] text-gray-400 ml-1">°F</span>
                  </div>
               </div>

               <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Icons.Droplet size={16} className="text-blue-500" />
                    <span className="text-xs font-medium">Urine (24h)</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900">{urine?.value || '--'}</span>
                    <span className="text-[10px] text-gray-400 ml-1">ml</span>
                  </div>
               </div>
            </section>

            {/* Vitals Charts with Tabs */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 text-sm">Vital Trends</h3>
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button onClick={() => setChartMode('GLUCOSE')} className={`px-2 py-1 text-[10px] rounded-md transition-all ${chartMode === 'GLUCOSE' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>Glu</button>
                        <button onClick={() => setChartMode('BP')} className={`px-2 py-1 text-[10px] rounded-md transition-all ${chartMode === 'BP' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>BP</button>
                        <button onClick={() => setChartMode('HR')} className={`px-2 py-1 text-[10px] rounded-md transition-all ${chartMode === 'HR' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>HR</button>
                        <button onClick={() => setChartMode('TEMP')} className={`px-2 py-1 text-[10px] rounded-md transition-all ${chartMode === 'TEMP' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>Temp</button>
                    </div>
                </div>
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                        {chartMode === 'BP' ? (
                             <>
                                <Line type="monotone" dataKey="sys" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
                                <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} />
                             </>
                        ) : (
                            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: 'white', strokeWidth: 2}} />
                        )}
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Wearable Data - Bar Charts */}
            <section className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                             <Icons.Steps className="text-indigo-500" size={18} />
                             <h3 className="font-bold text-gray-800 text-sm">Activity (Steps)</h3>
                        </div>
                        <span className="text-xs font-bold text-indigo-600">{patient.wearableData?.steps.toLocaleString()} today</span>
                    </div>
                    <div className="h-32">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stepsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="steps" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                             <Icons.Moon className="text-blue-400" size={18} />
                             <h3 className="font-bold text-gray-800 text-sm">Sleep Quality</h3>
                        </div>
                        <span className="text-xs font-bold text-blue-500">{patient.wearableData?.sleepHours} hrs</span>
                    </div>
                    <div className="h-32">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sleepData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="hours" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Food Plate Analysis */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                 <Icons.Utensils className="text-orange-500" size={18} />
                 <h3 className="font-bold text-gray-800 text-sm">Food Plate Analysis</h3>
              </div>
              <div className="space-y-3">
                {patient.foodLogs?.map((log) => (
                  <div key={log.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex gap-3">
                    <img src={log.imageUrl} alt="Meal" className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-gray-900">{log.analysis.mealType}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          log.analysis.flag === 'Balanced' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.analysis.flag}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="text-[10px] bg-gray-50 px-1.5 rounded text-gray-600">Cal: {log.analysis.caloriesEstimate}</span>
                        <span className="text-[10px] bg-gray-50 px-1.5 rounded text-gray-600">Carbs: {log.analysis.carbs}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Last Insight */}
            {patient.latestInsight && (
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.Shield size={16} className="text-blue-600"/>
                    <h3 className="text-xs font-bold text-blue-800">Latest Care Insight</h3>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {patient.latestInsight.summary}
                  </p>
               </div>
            )}
          </div>
        ) : activeTab === 'RECORDS' ? (
          <div className="max-w-lg mx-auto p-4 pb-20">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Icons.File className="text-blue-600" size={18}/>
                        Clinical Records
                    </h2>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Timeline</span>
                </div>
                <div className="divide-y divide-gray-100">
                   {clinicalRecords.length === 0 && (
                       <div className="p-8 text-center text-gray-400 text-sm">No records found.</div>
                   )}
                   {clinicalRecords.map(record => (
                       <div key={record.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0 mt-1">
                             {record.type === 'IMAGE' ? (
                                 <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                     <Icons.Image size={18} />
                                 </div>
                             ) : record.type === 'DOCUMENT' ? (
                                 <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                     <Icons.File size={18} />
                                 </div>
                             ) : (
                                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                     <Icons.Chat size={18} />
                                 </div>
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                  <p className="text-xs font-bold text-gray-900">
                                      {record.type === 'DOCUMENT' ? 'Uploaded Document' : 
                                       record.type === 'IMAGE' ? 'Clinical Image' : 
                                       record.sender === 'PATIENT' ? 'Patient Note' : 'Care Team Response'}
                                  </p>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                      {new Date(record.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                              </div>
                              
                              <div className="mt-1">
                                  {record.type === 'IMAGE' ? (
                                      <div className="mt-1">
                                          <img src={record.content} alt="Clinical Record" className="h-20 w-auto rounded-lg border border-gray-200 shadow-sm" />
                                      </div>
                                  ) : record.type === 'DOCUMENT' ? (
                                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 mt-1">
                                          <Icons.Paperclip size={14} className="text-gray-400"/>
                                          <span className="text-xs text-blue-600 font-medium underline truncate">{record.fileName || 'document.pdf'}</span>
                                      </div>
                                  ) : (
                                      <p className="text-xs text-gray-600 line-clamp-2">{record.content}</p>
                                  )}
                              </div>
                          </div>
                       </div>
                   ))}
                </div>
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col max-w-lg mx-auto">
             <div className="p-2 bg-yellow-50 text-center text-[10px] text-yellow-800 border-b border-yellow-100 flex justify-between items-center">
               <span>Group: <strong>PAJR-Dr.Smith-{patient.name.split(' ')[0]}</strong></span>
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 bg-yellow-100 rounded hover:bg-yellow-200 text-yellow-800 flex items-center gap-1"
               >
                 <Icons.Camera size={12} /> <span className="text-[10px]">Upload</span>
               </button>
             </div>
             <div className="flex-1 overflow-hidden">
                <PatientSimulator 
                  patient={patient}
                  onSendMessage={(text, type) => onSendMessage(text, type)}
                  isTyping={isProcessing}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};