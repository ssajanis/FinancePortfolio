import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  // Delete existing profile (single-row table)
  await supabase.from('profiles').delete().neq('id', 0)

  const { error } = await supabase.from('profiles').insert([body])

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
