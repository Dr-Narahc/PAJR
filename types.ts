export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export type UserRole = 'PATIENT' | 'DOCTOR';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phoneNumber: string;
  avatarUrl?: string;
}

export interface VitalSign {
  type: 'BP_SYSTOLIC' | 'BP_DIASTOLIC' | 'GLUCOSE' | 'SPO2' | 'HEART_RATE' | 'WEIGHT' | 'TEMP' | 'URINE_OUTPUT';
  value: number;
  unit: string;
  timestamp: string;
}

export interface ClinicalInsight {
  summary: string;
  riskLevel: RiskLevel;
  confidenceScore: number; // 0-1
  reasoning: string[]; // "Why this was flagged"
  themes: string[]; // "Thematic Analysis" e.g., "Glycemic Instability"
  missingData: string[]; // "What the system cannot conclude"
  clinicalActionSuggestion: string; // Non-prescriptive, workflow oriented
}

export interface Message {
  id: string;
  sender: 'PATIENT' | 'SYSTEM' | 'DOCTOR';
  content: string;
  fileName?: string;
  timestamp: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT';
}

export interface WearableData {
  steps: number;
  sleepHours: number;
  heartRateAvg: number;
  caloriesBurned: number;
  lastSync: string;
}

export interface FoodEntry {
  id: string;
  imageUrl: string;
  timestamp: string;
  analysis: {
    mealType: string;
    caloriesEstimate: number;
    carbs: string;
    protein: string;
    flag: 'Balanced' | 'High Carb' | 'Low Protein';
  };
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  assignedDoctorId: string; // Connection logic
  condition: string[]; // e.g., ["Type 2 Diabetes", "Hypertension"]
  lastInteraction: string;
  riskStatus: RiskLevel;
  vitalsHistory: VitalSign[];
  messages: Message[];
  latestInsight?: ClinicalInsight;
  isFlagged: boolean;
  wearableData?: WearableData;
  foodLogs?: FoodEntry[];
}