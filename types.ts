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
  confidenceScore: number;
  reasoning: string[];
  themes: string[];
  missingData: string[];
  clinicalActionSuggestion: string;
}

export interface Message {
  id: string;
  sender: 'PATIENT' | 'SYSTEM' | 'DOCTOR';
  content: string;
  fileName?: string;
  timestamp: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT';
}

export interface WearableDay {
  day: string;
  steps: number;
  sleepHours: number;
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
  assignedDoctorId: string;
  condition: string[];
  lastInteraction: string;
  riskStatus: RiskLevel;
  vitalsHistory: VitalSign[];
  messages: Message[];
  latestInsight?: ClinicalInsight;
  isFlagged: boolean;
  wearableHistory: WearableDay[];
  foodLogs: FoodEntry[];
}