import { createClient } from '@supabase/supabase-js';
import { Patient, Message, VitalSign } from '../types';

/**
 * Supabase configuration using provided project details.
 * We prioritize environment variables but provide a hardcoded fallback for the URL.
 */
const getSupabaseConfig = () => {
  const fallbackUrl = 'https://fulxsqwhgnpztikqspyi.supabase.co';
  
  // Safely access process.env
  const env = typeof process !== 'undefined' ? process.env : {};
  
  const url = env.SUPABASE_URL || fallbackUrl;
  const key = env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHhzcXdoZ25wenRpa3FzcHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0NjEyMjksImV4cCI6MjAzMTAzNzIyOX0.placeholder'; 

  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

// Initialize the client. This will no longer throw "supabaseUrl is required" because of the fallback.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if we are using a real key (anon keys usually start with 'ey')
const isUsingPlaceholder = !supabaseAnonKey || supabaseAnonKey === 'placeholder-key' || supabaseAnonKey.includes('.placeholder');

/**
 * Persists a message to the database.
 */
export const saveMessage = async (patientId: string, message: Partial<Message>) => {
  if (isUsingPlaceholder) {
    console.warn('[Supabase] Messaging persistence skipped: Valid SUPABASE_ANON_KEY is missing.');
    return { ...message, id: Date.now().toString(), timestamp: new Date().toISOString() };
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        patient_id: patientId,
        sender: message.sender,
        content: message.content,
        type: message.type,
        file_name: message.fileName,
        timestamp: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('[Supabase] Error saving message:', error);
      return null;
    }
    return data?.[0];
  } catch (err) {
    console.error('[Supabase] Exception in saveMessage:', err);
    return null;
  }
};

/**
 * Persists vital signs to the database.
 */
export const saveVitals = async (patientId: string, vitals: VitalSign[]) => {
  if (isUsingPlaceholder) return;

  try {
    const rows = vitals.map(v => ({
      patient_id: patientId,
      type: v.type,
      value: v.value,
      unit: v.unit,
      timestamp: v.timestamp
    }));

    const { error } = await supabase.from('vitals').insert(rows);
    if (error) console.error('[Supabase] Error saving vitals:', error);
  } catch (err) {
    console.error('[Supabase] Exception in saveVitals:', err);
  }
};

/**
 * Fetches all patients assigned to a doctor.
 */
export const fetchDoctorPatients = async (doctorId: string): Promise<Patient[]> => {
  if (isUsingPlaceholder) {
    console.warn('[Supabase] Fetching skipped: Valid SUPABASE_ANON_KEY is missing.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        messages(*),
        vitals(*)
      `)
      .eq('assigned_doctor_id', doctorId);

    if (error) {
      console.error('[Supabase] Error fetching patients:', error);
      return [];
    }
    return data as Patient[];
  } catch (err) {
    console.error('[Supabase] Exception in fetchDoctorPatients:', err);
    return [];
  }
};

/**
 * Subscribes to real-time message updates for a patient.
 */
export const subscribeToMessages = (patientId: string, callback: (payload: any) => void) => {
  if (isUsingPlaceholder) {
    return { unsubscribe: () => {} };
  }

  return supabase
    .channel(`public:messages:patient_id=eq.${patientId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages', 
      filter: `patient_id=eq.${patientId}` 
    }, callback)
    .subscribe();
};