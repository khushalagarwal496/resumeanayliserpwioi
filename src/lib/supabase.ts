import { createClient } from '@supabase/supabase-js';
import type { AtsResult } from './ats';

const supabaseUrl = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  'https://oaxhsfymosfqmgiazeti.supabase.co';

const supabaseAnonKey = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  'sb_publishable_FJ_Bs-8mdvFfZkBkHEnZww_btVBjpbq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ScanRecord {
  id?: string;
  created_at?: string;
  score: number;
  resume_name: string;
  resume_text: string;
  jd_text?: string;
  result: AtsResult;
  user_email?: string;
}

export async function saveScanToSupabase(record: ScanRecord) {
  try {
    if (supabaseUrl.includes("your-supabase-project")) {
      console.log("Supabase URL is placeholder. To connect your Supabase database, set VITE_SUPABASE_URL in .env");
      return;
    }
    const { data, error } = await supabase.from('resume_scans').insert([{
      score: record.score,
      resume_name: record.resume_name,
      resume_text: record.resume_text,
      jd_text: record.jd_text,
      result_json: JSON.stringify(record.result),
      user_email: record.user_email || 'guest'
    }]);

    if (error) {
      console.warn("Supabase save note:", error.message);
    } else {
      console.log("Saved scan to Supabase database successfully!");
    }
  } catch (err) {
    console.warn("Supabase integration note:", err);
  }
}
