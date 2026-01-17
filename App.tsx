import React, { useState, useCallback, useEffect } from 'react';
import { Patient, Message, RiskLevel, User, FoodEntry } from './types';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { AuthScreen } from './components/AuthScreen';
import { analyzePatientInput } from './services/geminiService';
import { Icons } from './components/Icons';

// --- MOCK DATA INITIALIZATION ---
const MOCK_FOOD_LOGS: FoodEntry[] = [
  {
    id: 'f1',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    analysis: {
      mealType: 'Lunch',
      caloriesEstimate: 450,
      carbs: '45g',
      protein: '20g',
      flag: 'Balanced'
    }
  },
  {
    id: 'f2',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&h=150&fit=crop',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    analysis: {
      mealType: 'Dinner',
      caloriesEstimate: 800,
      carbs: '90g',
      protein: '15g',
      flag: 'High Carb'
    }
  }
];

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P-1024',
    name: 'Sarah Devi',
    age: 58,
    assignedDoctorId: 'D-001', // Assigned to Dr. Verma
    condition: ['Type 2 Diabetes'],
    lastInteraction: new Date().toISOString(),
    riskStatus: RiskLevel.MEDIUM,
    isFlagged: false,
    vitalsHistory: [
      { type: 'GLUCOSE', value: 140, unit: 'mg/dL', timestamp: '2023-10-22T08:00:00Z' },
      { type: 'GLUCOSE', value: 142, unit: 'mg/dL', timestamp: '2023-10-23T08:00:00Z' },
      { type: 'GLUCOSE', value: 140, unit: 'mg/dL', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'BP_SYSTOLIC', value: 125, unit: 'mmHg', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'BP_DIASTOLIC', value: 82, unit: 'mmHg', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'HEART_RATE', value: 78, unit: 'bpm', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'TEMP', value: 98.4, unit: '°F', timestamp: '2023-10-24T08:00:00Z' },
      { type: 'URINE_OUTPUT', value: 1200, unit: 'ml', timestamp: '2023-10-24T08:00:00Z' },
      
      { type: 'GLUCOSE', value: 145, unit: 'mg/dL', timestamp: '2023-10-25T08:00:00Z' },
      { type: 'BP_SYSTOLIC', value: 128, unit: 'mmHg', timestamp: '2023-10-25T08:00:00Z' },
      { type: 'HEART_RATE', value: 80, unit: 'bpm', timestamp: '2023-10-25T08:00:00Z' },
      
      { type: 'GLUCOSE', value: 160, unit: 'mg/dL', timestamp: '2023-10-26T08:00:00Z' },
      { type: 'BP_SYSTOLIC', value: 130, unit: 'mmHg', timestamp: '2023-10-26T08:00:00Z' },
      { type: 'HEART_RATE', value: 82, unit: 'bpm', timestamp: '2023-10-26T08:00:00Z' },

      { type: 'GLUCOSE', value: 155, unit: 'mg/dL', timestamp: '2023-10-27T08:00:00Z' },
    ],
    wearableData: {
      steps: 5432,
      sleepHours: 6.5,
      heartRateAvg: 72,
      caloriesBurned: 1850,
      lastSync: new Date().toISOString()
    },
    foodLogs: MOCK_FOOD_LOGS,
    messages: [
      { id: 'm1', sender: 'SYSTEM', type: 'TEXT', content: 'Welcome back, Sarah. Please share your morning readings.', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: 'm2', sender: 'PATIENT', type: 'TEXT', content: 'Yesterday sugar was 155.', timestamp: new Date(Date.now() - 80000000).toISOString() }
    ],
    latestInsight: {
        summary: "Patient showing consistently elevated glucose levels (140-160 range). Compliance with medication needs verification.",
        riskLevel: RiskLevel.MEDIUM,
        confidenceScore: 0.92,
        themes: ["Glycemic Instability", "Routine Check"],
        reasoning: ["3-day trend of fasting glucose > 140 mg/dL", "BP stable but borderline"],
        missingData: ["Post-prandial readings", "Dietary log"],
        clinicalActionSuggestion: "Request post-prandial readings for next 2 days."
    }
  },
  {
    id: 'P-1099',
    name: 'Rajiv Kumar',
    age: 64,
    assignedDoctorId: 'D-002', // Assigned to a different doctor
    condition: ['Hypertension', 'Post-Cardiac Rehab'],
    lastInteraction: new Date().toISOString(),
    riskStatus: RiskLevel.LOW,
    isFlagged: false,
    vitalsHistory: [
        { type: 'BP_SYSTOLIC', value: 130, unit: 'mmHg', timestamp: '2023-10-25T08:00:00Z' },
        { type: 'GLUCOSE', value: 100, unit: 'mg/dL', timestamp: '2023-10-25T08:00:00Z' },
    ],
    wearableData: {
      steps: 8100,
      sleepHours: 7.2,
      heartRateAvg: 68,
      caloriesBurned: 2200,
      lastSync: new Date().toISOString()
    },
    messages: [],
    latestInsight: {
        summary: "Stable recovery. Vitals within target range.",
        riskLevel: RiskLevel.LOW,
        confidenceScore: 0.98,
        themes: ["Recovery", "Stable"],
        reasoning: ["BP controlled under 135/85", "No reported symptoms"],
        missingData: [],
        clinicalActionSuggestion: "Continue standard monitoring."
    }
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  
  // Doctor View State
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper: Get Active Patient Object
  // If patient logs in, they are always P-1024. If Doctor logs in, use activePatientId (which can be null for dashboard view)
  const activePatient = currentUser?.role === 'PATIENT' 
    ? patients.find(p => p.id === 'P-1024') 
    : (activePatientId ? patients.find(p => p.id === activePatientId) : null);

  // We need a non-null patient for the patient dashboard prop, but safe to ignore if role is DOCTOR
  const patientDashboardProp = activePatient || patients[0];

  const handleLogin = (role: 'PATIENT' | 'DOCTOR', phoneNumber: string) => {
    setCurrentUser({
      id: role === 'PATIENT' ? 'P-1024' : 'D-001', // Mock mapping
      name: role === 'PATIENT' ? 'Sarah Devi' : 'Dr. Arun Verma',
      role: role,
      phoneNumber: phoneNumber
    });
    
    // If patient logs in, default activePatientId is them
    if (role === 'PATIENT') {
      setActivePatientId('P-1024'); 
    } else {
      setActivePatientId(null); // Doctor starts at Triage Dashboard
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePatientId(null);
  };

  // Central Message Handler
  const handleMessageSend = useCallback(async (content: string, type: 'TEXT' | 'IMAGE' | 'DOCUMENT', senderRole: 'PATIENT' | 'DOCTOR', fileName?: string) => {
    // Determine target patient
    const targetPatient = activePatient;
    if (!targetPatient) return;

    // 1. Create the new message object
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: senderRole,
      content: content,
      fileName: fileName,
      timestamp: new Date().toISOString(),
      type: type
    };

    // 2. Immediately update state to show the message (optimistic update)
    const updatedPatient = {
      ...targetPatient,
      messages: [...targetPatient.messages, newMessage],
      lastInteraction: new Date().toISOString()
    };

    setPatients(prev => prev.map(p => p.id === targetPatient.id ? updatedPatient : p));
    
    // If Doctor sent it, we are done
    if (senderRole === 'DOCTOR') {
        return; 
    }

    setIsProcessing(true);

    // 3. If Patient Sent -> Trigger AI Pipeline (Only for TEXT mainly)
    if (type === 'TEXT') {
        try {
            const historyContext = `
                Age: ${targetPatient.age}, Conditions: ${targetPatient.condition.join(', ')}.
                Recent Vitals: ${targetPatient.vitalsHistory.slice(-3).map(v => `${v.type}: ${v.value}`).join(', ')}.
            `;

            const { insight, vitals, suggestedResponse } = await analyzePatientInput(content, historyContext);

            const systemResponse: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'SYSTEM',
                content: suggestedResponse,
                timestamp: new Date().toISOString(),
                type: 'TEXT'
            };

            const finalPatient: Patient = {
                ...updatedPatient, // Use the already updated patient that contains the user message
                messages: [...updatedPatient.messages, systemResponse],
                riskStatus: insight.riskLevel,
                latestInsight: insight,
                vitalsHistory: [...updatedPatient.vitalsHistory, ...vitals],
                isFlagged: insight.riskLevel === RiskLevel.HIGH || insight.riskLevel === RiskLevel.CRITICAL
            };

            setPatients(prev => prev.map(p => p.id === targetPatient.id ? finalPatient : p));

        } catch (error) {
            console.error("Pipeline Error", error);
        } finally {
            setIsProcessing(false);
        }
    } else {
        // Handle Image/File Upload from Patient - Simulate Processing
        setTimeout(() => {
             const systemResponse: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'SYSTEM',
                content: type === 'DOCUMENT' ? "Document received and filed in Clinical Records." : "Image received. Adding to clinical record.",
                timestamp: new Date().toISOString(),
                type: 'TEXT'
            };
             const finalPatient: Patient = {
                ...updatedPatient,
                messages: [...updatedPatient.messages, systemResponse],
            };
             setPatients(prev => prev.map(p => p.id === targetPatient.id ? finalPatient : p));
             setIsProcessing(false);
        }, 1500);
    }

  }, [activePatient, patients]);

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Filter patients for Doctor Dashboard
  const myPatients = currentUser.role === 'DOCTOR' 
    ? patients.filter(p => p.assignedDoctorId === currentUser.id)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Universal Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Icons.Activity size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-800">PAJR<span className="text-blue-600">.Connect</span></span>
        </div>
        
        {/* Doctor Info moved to Dashboard Dropdown - Keep header clean or just show logo/brand */}
      </header>

      {/* Main Routing Logic */}
      <main className="flex-1 w-full mx-auto">
        {currentUser.role === 'PATIENT' ? (
          <PatientDashboard 
            patient={patientDashboardProp}
            onLogout={handleLogout}
            onSendMessage={(content, type, fileName) => handleMessageSend(content, type, 'PATIENT', fileName)}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
             <DoctorDashboard 
                patients={myPatients} 
                selectedPatientId={activePatientId} 
                onSelectPatient={setActivePatientId}
                onSendMessage={(content, type) => handleMessageSend(content, type, 'DOCTOR')}
                onLogout={handleLogout}
             />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;