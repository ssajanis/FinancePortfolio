import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()
  const id = params.id

  const [snapshot, income, expenses, investments, loans, insights] = await Promise.all([
    supabase.from('snapshots').select('*').eq('id', id).single(),
    supabase.from('income_entries').select('*').eq('snapshot_id', id),
    supabase.from('expense_entries').select('*').eq('snapshot_id', id),
    supabase.from('investment_entries').select('*').eq('snapshot_id', id),
    supabase.from('loan_entries').select('*').eq('snapshot_id', id),
    supabase.from('ai_insights').select('*').eq('snapshot_id', id),
  ])

  if (snapshot.error) {
    return NextResponse.json({ success: false, error: snapshot.error.message }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    snapshot: snapshot.data,
    income_entries: income.data ?? [],
    expense_entries: expenses.data ?? [],
    investment_entries: investments.data ?? [],
    loan_entries: loans.data ?? [],
    ai_insights: insights.data ?? [],
  })
}
