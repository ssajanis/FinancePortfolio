import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface SimpleExpense {
  name: string;
  amount: string;
}

interface LoanEMI {
  name: string;
  amount: string;
  balance: string;
  rate: string;
}

interface OneTimeExpense {
  name: string;
  amount: string;
  month: string;
  year: string;
}

export async function POST(req: NextRequest) {
  try {
    const { fixed_expenses, variable_expenses, loan_emis, one_time_expenses } = await req.json() as {
      fixed_expenses: SimpleExpense[];
      variable_expenses: SimpleExpense[];
      loan_emis: LoanEMI[];
      one_time_expenses: OneTimeExpense[];
    };

    // Soft-delete existing records
    const { error: deleteError } = await supabase
      .from("expenses")
      .update({ deleted_at: new Date().toISOString() })
      .is("deleted_at", null);

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message });
    }

    const records: Record<string, unknown>[] = [];

    for (const item of fixed_expenses ?? []) {
      if (item.name && Number(item.amount) > 0) {
        records.push({
          category: "fixed",
          name: item.name,
          amount_paise: Math.round(Number(item.amount) * 100),
          month: null,
          year: null,
        });
      }
    }

    for (const item of variable_expenses ?? []) {
      if (item.name && Number(item.amount) > 0) {
        records.push({
          category: "variable",
          name: item.name,
          amount_paise: Math.round(Number(item.amount) * 100),
          month: null,
          year: null,
        });
      }
    }

    for (const item of loan_emis ?? []) {
      if (item.name && Number(item.amount) > 0) {
        records.push({
          category: "emi",
          name: item.name,
          amount_paise: Math.round(Number(item.amount) * 100),
          estimated_balance_paise: Math.round(Number(item.balance) * 100),
          interest_rate_pct: Number(item.rate),
          month: null,
          year: null,
        });
      }
    }

    for (const item of one_time_expenses ?? []) {
      if (item.name && Number(item.amount) > 0) {
        records.push({
          category: "one_time",
          name: item.name,
          amount_paise: Math.round(Number(item.amount) * 100),
          month: Number(item.month),
          year: Number(item.year),
        });
      }
    }

    if (records.length === 0) {
      return NextResponse.json({ success: true, ids: [] });
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert(records)
      .select("id");

    if (error) {
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, ids: data.map((r: { id: unknown }) => r.id) });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
