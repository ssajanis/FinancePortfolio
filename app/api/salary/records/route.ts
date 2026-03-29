import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("salary_records")
      .select("id, owner, label, income_type, base_salary_paise, flat_monthly_paise")
      .order("id", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message, records: [] });
    }

    return NextResponse.json({ success: true, records: data ?? [] });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      records: [],
    });
  }
}
