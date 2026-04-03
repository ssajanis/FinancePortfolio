import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  const { name, income_entries = [], expense_entries = [], investment_entries = [], loan_entries = [] } = body

  // Create the snapshot record
  const { data: snapshot, error: snapshotError } = await supabase
    .from('snapshots')
    .insert([{ name }])
    .select()
    .single()

  if (snapshotError) {
    return NextResponse.json({ success: false, error: snapshotError.message }, { status: 500 })
  }

  const snapshot_id = snapshot.id

  // Insert all entry tables in parallel using correct column names
  const inserts = await Promise.all([
    income_entries.length > 0
      ? supabase.from('income_entries').insert(
          income_entries.map((e: { type: string; monthly_amount_paise: number }) => ({
            snapshot_id,
            type: e.type,
            monthly_amount_paise: e.monthly_amount_paise,
          }))
        )
      : Promise.resolve({ error: null }),

    expense_entries.length > 0
      ? supabase.from('expense_entries').insert(
          expense_entries.map((e: { type: string; monthly_amount_paise: number }) => ({
            snapshot_id,
            type: e.type,
            monthly_amount_paise: e.monthly_amount_paise,
          }))
        )
      : Promise.resolve({ error: null }),

    investment_entries.length > 0
      ? supabase.from('investment_entries').insert(
          investment_entries.map((e: { type: string; name: string; current_value_paise: number; monthly_contribution_paise: number }) => ({
            snapshot_id,
            type: e.type,
            fields: {
              name: e.name,
              current_value_paise: e.current_value_paise,
              monthly_contribution_paise: e.monthly_contribution_paise,
            },
          }))
        )
      : Promise.resolve({ error: null }),

    loan_entries.length > 0
      ? supabase.from('loan_entries').insert(
          loan_entries.map((e: { type: string; emi_paise: number; remaining_principal_paise: number; remaining_tenure_months: number; interest_rate_pct: number }) => ({
            snapshot_id,
            type: e.type,
            emi_paise: e.emi_paise,
            remaining_principal_paise: e.remaining_principal_paise,
            remaining_tenure_months: e.remaining_tenure_months,
            interest_rate_pct: e.interest_rate_pct,
          }))
        )
      : Promise.resolve({ error: null }),
  ])

  const insertError = inserts.find(r => r.error)
  if (insertError?.error) {
    return NextResponse.json({ success: false, error: insertError.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, snapshot_id })
}
