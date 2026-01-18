import { createClient } from '@supabase/supabase-js';
import { Patient, Message, VitalSign } from '../types';

// Assuming standard environment variables are injected
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Persists a message to the database.
 */
export const saveMessage = async (patientId: string, message: Partial<Message>) => {
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
  
  if (error) console.error('Supabase Save Error:', error);
  return data?.[0];
};

/**
 * Persists vital signs to the database.
 */
export const saveVitals = async (patientId: string, vitals: VitalSign[]) => {
  const rows = vitals.map(v => ({
    patient_id: patientId,
    type: v.type,
    value: v.value,
    unit: v.unit,
    timestamp: v.timestamp
  }));

  const { error } = await supabase.from('vitals').insert(rows);
  if (error) console.error('Supabase Vitals Error:', error);
};

/**
 * Fetches all patients assigned to a doctor.
 */
export const fetchDoctorPatients = async (doctorId: string): Promise<Patient[]> => {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      messages(*),
      vitals(*)
    `)
    .eq('assigned_doctor_id', doctorId);

  if (error) {
    console.error('Fetch Patients Error:', error);
    return [];
  }
  return data as Patient[];
};

/**
 * Subscribes to real-time message updates for a patient.
 */
export const subscribeToMessages = (patientId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`public:messages:patient_id=eq.${patientId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `patient_id=eq.${patientId}` }, callback)
    .subscribe();
};
