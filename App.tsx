import React, { useState, useCallback, useEffect } from 'react';
import { Patient, Message, RiskLevel, User, VitalSign, WearableDay } from './types';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { AuthScreen } from './components/AuthScreen';
import { analyzePatientInput } from './services/geminiService';
import { Icons } from './components/Icons';
import { saveMessage, saveVitals, subscribeToMessages } from './services/supabaseService';

// --- ROBUST MOCK DATA ---
const MOCK_WEARABLE: WearableDay[] = [
  { day: 'Mon', steps: 4200, sleepHours: 6.2 },
  { day: 'Tue', steps: 5800, sleepHours: 7.1 },
  { day: 'Wed', steps: 3100, sleepHours: 5.8 },
  { day: 'Thu', steps: 7200, sleepHours: 6.5 },
  { day: 'Fri', steps: 8400, sleepHours: 8.0 },
  { day: 'Sat', steps: 5100, sleepHours: 7.5 },
  { day: 'Sun', steps: 2900, sleepHours: 9.2 },
];

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P-1024',
    name: 'Sarah Devi',
    age: 58,
    assignedDoctorId: 'D-001',
    condition: ['Type 2 Diabetes', 'Hypertension'],
    lastInteraction: new Date().toISOString(),
    riskStatus: RiskLevel.MEDIUM,
    isFlagged: false,
    vitalsHistory: [
      { type: 'GLUCOSE', value: 140, unit: 'mg/dL', timestamp: '2023-10-22T08:00:00Z' },
      { type: 'GLUCOSE', value: 165, unit: 'mg/dL', timestamp: '2023-10-23T08:00:00Z' },
      { type: 'GLUCOSE', value: 155, unit: 'mg/dL', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'BP_SYSTOLIC', value: 135, unit: 'mmHg', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'BP_DIASTOLIC', value: 88, unit: 'mmHg', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'URINE_OUTPUT', value: 1400, unit: 'ml', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'HEART_RATE', value: 72, unit: 'bpm', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'TEMP', value: 98.6, unit: '°F', timestamp: '2023-10-24T08:00:00Z' },
    ],
    wearableHistory: MOCK_WEARABLE,
    foodLogs: [
      {
        id: 'f1',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        timestamp: new Date().toISOString(),
        analysis: { mealType: 'Lunch', caloriesEstimate: 420, carbs: '45g', protein: '22g', flag: 'Balanced' }
      }
    ],
    messages: [
      { id: 'm1', sender: 'SYSTEM', type: 'TEXT', content: 'Welcome to PAJR. Please share your readings via WhatsApp or here.', timestamp: new Date(Date.now() - 1000000).toISOString() }
    ],
    latestInsight: {
        summary: "Glucose trending upwards over last 48 hours. Spiked to 165 fasting. Likely dietary slip or medication gap.",
        riskLevel: RiskLevel.MEDIUM,
        confidenceScore: 0.88,
        themes: ["Glycemic Instability", "High Carb Pattern"],
        reasoning: ["Fasting glucose > 150mg/dL", "Steps decreased by 40% on Wednesday"],
        missingData: ["Latest HbA1c", "Evening BP readings"],
        clinicalActionSuggestion: "Counsel patient on carbohydrate intake. Ask for medication adherence check."
    }
  },
  {
    id: 'P-5050',
    name: 'Anil Gupta',
    age: 62,
    assignedDoctorId: 'D-001',
    condition: ['Cardiac Follow-up'],
    lastInteraction: new Date().toISOString(),
    riskStatus: RiskLevel.CRITICAL,
    isFlagged: true,
    vitalsHistory: [
      { type: 'BP_SYSTOLIC', value: 168, unit: 'mmHg', timestamp: new Date().toISOString() },
      { type: 'BP_DIASTOLIC', value: 95, unit: 'mmHg', timestamp: new Date().toISOString() },
      { type: 'HEART_RATE', value: 98, unit: 'bpm', timestamp: new Date().toISOString() },
    ],
    wearableHistory: MOCK_WEARABLE,
    foodLogs: [],
    messages: [
      { id: 'crit1', sender: 'PATIENT', type: 'TEXT', content: 'Feeling slightly dizzy since morning.', timestamp: new Date().toISOString() }
    ],
    latestInsight: {
        summary: "Patient reporting dizziness accompanied by BP spike (168/95). Immediate clinician review recommended.",
        riskLevel: RiskLevel.CRITICAL,
        confidenceScore: 0.95,
        themes: ["Hypertensive Crisis", "Symptomatic"],
        reasoning: ["BP systolic > 160", "New-onset dizziness reported via text"],
        missingData: [],
        clinicalActionSuggestion: "Immediate call to verify symptoms. Instruct to take prescribed emergency meds if available."
    }
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync with Supabase (simplified real-time emulation)
useEffect(() => {
  if (!activePatientId) return;

  const sub = subscribeToMessages(activePatientId, (payload) => {
    if (!payload || !payload.new) return;

    const newMsg = payload.new as Message;

    setPatients(prev =>
      prev.map(p => {
        if (p.id !== activePatientId) return p;

        const messages = p.messages ?? [];

        if (messages.some(m => m.id === newMsg.id)) return p;

        return {
          ...p,
          messages: [...messages, newMsg],
        };
      })
    );
  });

  return () => {
    sub?.unsubscribe?.();
  };
}, [activePatientId]);



  const handleLogin = (role: 'PATIENT' | 'DOCTOR', phoneNumber: string) => {
    setCurrentUser({
      id: role === 'PATIENT' ? 'P-1024' : 'D-001',
      name: role === 'PATIENT' ? 'Sarah Devi' : 'Dr. Arun Verma',
      role: role,
      phoneNumber: phoneNumber
    });
    if (role === 'PATIENT') setActivePatientId('P-1024');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePatientId(null);
  };

  const handleMessageSend = useCallback(async (content: string, type: 'TEXT' | 'IMAGE' | 'DOCUMENT', senderRole: 'PATIENT' | 'DOCTOR', fileName?: string) => {
    const targetId = activePatientId || (currentUser?.role === 'PATIENT' ? currentUser.id : null);
    if (!targetId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: senderRole,
      content,
      fileName,
      timestamp: new Date().toISOString(),
      type
    };

    // Update Local State immediately for responsiveness
    setPatients(prev => prev.map(p => {
      if (p.id === targetId) {
        return { ...p, messages: [...p.messages, newMessage], lastInteraction: new Date().toISOString() };
      }
      return p;
    }));

    // Persistence with error handling
    try {
      await saveMessage(targetId, {
        sender: senderRole,
        content,
        fileName,
        type
      });
    } catch (err) {
      console.warn('Persistence failed, using local session state only.');
    }

    if (senderRole === 'DOCTOR') return;

    setIsProcessing(true);
    if (type === 'TEXT') {
        try {
           const patient = patients.find(p => p.id === targetId);
if (!patient) {
  setIsProcessing(false);
  return;
}

            const context = `Age: ${patient.age}, Vitals: ${patient.vitalsHistory.slice(-2).map(v => `${v.type}: ${v.value}`).join(', ')}`;
            const { insight, vitals, suggestedResponse } = await analyzePatientInput(content, context);

            const systemMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'SYSTEM',
                content: suggestedResponse,
                timestamp: new Date().toISOString(),
                type: 'TEXT'
            };

            // Local state for AI
            setPatients(prev => prev.map(p => {
                if (p.id === targetId) {
                    return {
                        ...p,
                        messages: [...p.messages, systemMsg],
                        riskStatus: insight.riskLevel,
                        latestInsight: insight,
                        vitalsHistory: [...p.vitalsHistory, ...vitals],
                        isFlagged: insight.riskLevel === RiskLevel.HIGH || insight.riskLevel === RiskLevel.CRITICAL
                    };
                }
                return p;
            }));

            // Async persistence of AI response
            try {
              await saveMessage(targetId, {
                sender: 'SYSTEM',
                content: suggestedResponse,
                type: 'TEXT'
              });
              if (vitals.length > 0) {
                await saveVitals(targetId, vitals);
              }
            } catch (err) {
               console.warn('AI insight persistence failed.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    } else {
        setTimeout(() => setIsProcessing(false), 1500);
    }
  }, [activePatientId, currentUser, patients]);

  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  const myPatients = patients.filter(p => p.assignedDoctorId === currentUser.id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-50 fixed top-0 w-full">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-2 rounded-xl text-white shadow-lg"><Icons.Activity size={20} /></div>
          <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">PAJR<span className="text-blue-600">.Connect</span></span>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-900 leading-none">{currentUser.name}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{currentUser.role} CHANNEL</p>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-sm border border-slate-200">
             {currentUser.name.charAt(0)}
           </div>
        </div>
      </header>

      <main className="flex-1 mt-16 overflow-hidden">
        {currentUser.role === 'PATIENT' ? (
          <PatientDashboard 
            patient={patients.find(p => p.id === currentUser.id)!} 
            onLogout={handleLogout} 
            onSendMessage={(c, t, f) => handleMessageSend(c, t, 'PATIENT', f)}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="p-8 max-w-[1800px] mx-auto h-full">
            <DoctorDashboard 
              patients={myPatients} 
              selectedPatientId={activePatientId} 
              onSelectPatient={setActivePatientId}
              onSendMessage={(c, t) => handleMessageSend(c, t, 'DOCTOR')}
              onLogout={handleLogout}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
