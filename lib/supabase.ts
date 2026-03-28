import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("tax_config")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Supabase connection error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("Supabase connected ✅");
  return { success: true };
}
