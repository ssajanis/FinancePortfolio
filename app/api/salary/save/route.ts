import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { sources } = await req.json();

    const records = sources.map((s: Record<string, unknown>) => ({
      owner: s.owner,
      label: s.label,
      income_type: s.income_type,
      base_salary_paise: s.base_monthly_paise ?? null,
      increment_pct: s.increment_pct ?? null,
      switch_jump_pct: s.switch_jump_pct ?? null,
      switch_every_years: s.switch_every_years ?? null,
      inflation_rate: s.inflation_rate,
      flat_monthly_paise: s.flat_monthly_paise ?? null,
    }));

    const { data, error } = await supabase
      .from("salary_records")
      .insert(records)
      .select("id");

    if (error) return NextResponse.json({ success: false, error: error.message });

    return NextResponse.json({ success: true, ids: data.map((r: { id: unknown }) => r.id) });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
