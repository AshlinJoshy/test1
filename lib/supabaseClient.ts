import { createClient } from "@supabase/supabase-js";

// These are PUBLIC (publishable/anon) Supabase keys — they are meant to be
// exposed in the browser, so shipping them as defaults leaks nothing that the
// client bundle wouldn't already contain. Set the NEXT_PUBLIC_* env vars in
// Vercel (or .env.local) to point the app at a different Supabase project.
const DEFAULT_SUPABASE_URL = "https://bniwgbwkwqqgoptcqdqu.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_i7VeWNHcvtbiu8-xTGN0EA_G5-ECGOv";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  title: string;
  client: string | null;
  deal_value: number | null;
  priority: "Low" | "Medium" | "High";
  status: "Lead" | "Contacted" | "Proposal" | "Won" | "Lost";
  follow_up_date: string | null;
  notes: string | null;
  done: boolean;
  created_at: string;
};
