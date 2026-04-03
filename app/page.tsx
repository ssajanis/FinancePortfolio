'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPaise, formatCrLakh } from '@/lib/utils'

interface Snapshot {
  id: string
  name: string
  created_at: string
}

interface IncomeEntry {
  id: string
  type: string
  monthly_amount_paise: number
}

interface ExpenseEntry {
  id: string
  type: string
  monthly_amount_paise: number
}

interface InvestmentEntry {
  id: string
  type: string
  fields: {
    name?: string
    current_value_paise?: number
    monthly_contribution_paise?: number
  }
}

interface LoanEntry {
  id: string
  type: string
  emi_paise: number
  remaining_principal_paise: number
  remaining_tenure_months: number
  interest_rate_pct: number
}

interface AiInsight {
  id: string
  growth_strategy: string | null
  loan_optimizer: string | null
  retirement_plan: string | null
  health_score: number | null
}

interface SnapshotData {
  snapshot: Snapshot
  income_entries: IncomeEntry[]
  expense_entries: ExpenseEntry[]
  investment_entries: InvestmentEntry[]
  loan_entries: LoanEntry[]
  ai_insights: AiInsight[]
}

function calcHealthScore(
  income: number,
  expenses: number,
  totalEmi: number,
  totalInvestment: number,
  surplus: number
): { score: number; label: string; color: string } {
  let score = 0

  // Surplus ratio (30pts)
  const surplusRatio = income > 0 ? surplus / income : 0
  if (surplusRatio > 0.2) score += 30
  else if (surplusRatio >= 0.1) score += 20
  else if (surplusRatio >= 0.05) score += 10

  // EMI-to-income (30pts)
  const emiRatio = income > 0 ? totalEmi / income : 0
  if (emiRatio < 0.2) score += 30
  else if (emiRatio < 0.35) score += 20
  else if (emiRatio < 0.5) score += 10

  // Investment rate (25pts)
  const investRatio = income > 0 ? totalInvestment / income : 0
  if (investRatio > 0.15) score += 25
  else if (investRatio >= 0.1) score += 15
  else if (investRatio >= 0.05) score += 8

  // Loan coverage (15pts): (surplus * 6) / monthly_expenses
  const coverage = expenses > 0 ? (surplus * 6) / expenses : 0
  if (coverage > 6) score += 15
  else if (coverage >= 3) score += 9
  else if (coverage >= 1) score += 4

  let label = 'Needs Work'
  let color = '#EF4444'
  if (score >= 71) { label = 'Excellent'; color = '#22C55E' }
  else if (score >= 41) { label = 'Good'; color = '#F59E0B' }

  return { score, label, color }
}

export default function DashboardPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [data, setData] = useState<SnapshotData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSnapshots, setLoadingSnapshots] = useState(true)

  useEffect(() => {
    fetch('/api/snapshots/list')
      .then(r => r.json())
      .then(res => {
        setSnapshots(res.snapshots ?? [])
        if (res.snapshots?.length > 0) setSelectedId(res.snapshots[0].id)
      })
      .finally(() => setLoadingSnapshots(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    fetch(`/api/snapshots/${selectedId}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res) })
      .finally(() => setLoading(false))
  }, [selectedId])

  const monthlyIncome = data
    ? data.income_entries.reduce((s, e) => s + e.monthly_amount_paise, 0)
    : 0
  const monthlyExpenses = data
    ? data.expense_entries.reduce((s, e) => s + e.monthly_amount_paise, 0)
    : 0
  const totalEmi = data
    ? data.loan_entries.reduce((s, l) => s + l.emi_paise, 0)
    : 0
  const monthlyInvestment = data
    ? data.investment_entries.reduce((s, i) => s + (i.fields?.monthly_contribution_paise ?? 0), 0)
    : 0
  const monthlySurplus = monthlyIncome - monthlyExpenses - totalEmi
  const totalLoans = data
    ? data.loan_entries.reduce((s, l) => s + l.remaining_principal_paise, 0)
    : 0
  const totalInvestments = data
    ? data.investment_entries.reduce((s, i) => s + (i.fields?.current_value_paise ?? 0), 0)
    : 0

  const surplusRatio = monthlyIncome > 0 ? monthlySurplus / monthlyIncome : 0
  const surplusColor =
    surplusRatio > 0.2 ? '#22C55E' : surplusRatio >= 0.1 ? '#F59E0B' : '#EF4444'

  const health = data
    ? calcHealthScore(monthlyIncome, monthlyExpenses, totalEmi, monthlyInvestment, monthlySurplus)
    : null

  const insight = data?.ai_insights?.[0] ?? null

  if (loadingSnapshots) {
    return <p className="text-sm text-gray-500">Loading...</p>
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-lg font-medium" style={{ color: '#1A1A1A' }}>No snapshots yet</p>
        <p className="text-sm text-gray-500">Create your first financial snapshot to get started.</p>
        <Link
          href="/snapshot/new"
          className="px-6 py-2 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          Create Snapshot
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Snapshot selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Snapshot:</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          style={{ borderColor: '#E5DDD0' }}
        >
          {snapshots.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} — {new Date(s.created_at).toLocaleDateString('en-IN')}
            </option>
          ))}
        </select>
        <Link
          href="/snapshot/new"
          className="px-4 py-1.5 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          + New Snapshot
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading snapshot...</p>}

      {data && !loading && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Monthly Income', value: formatPaise(monthlyIncome) },
              { label: 'Monthly Expenses', value: formatPaise(monthlyExpenses) },
              { label: 'Monthly Surplus', value: formatPaise(monthlySurplus), color: surplusColor },
              { label: 'Total Loans', value: formatCrLakh(totalLoans) },
              { label: 'Total Investments', value: formatCrLakh(totalInvestments) },
            ].map(tile => (
              <div
                key={tile.label}
                className="bg-white rounded-2xl p-4 shadow-sm"
                style={{ border: '1px solid #E5DDD0' }}
              >
                <p className="text-xs text-gray-500 mb-1">{tile.label}</p>
                <p
                  className="text-lg font-bold"
                  style={{ color: tile.color ?? '#1A1A1A' }}
                >
                  {tile.value}
                </p>
              </div>
            ))}
          </div>

          {/* 6 modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Overview */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #E5DDD0' }}>
              <h2 className="font-semibold mb-3">Income Overview</h2>
              {data.income_entries.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <ul className="space-y-2">
                  {data.income_entries.map(e => (
                    <li key={e.id} className="flex justify-between text-sm">
                      <span>{e.type}</span>
                      <span className="font-medium">{formatPaise(e.monthly_amount_paise)}/mo</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Expense Overview */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #E5DDD0' }}>
              <h2 className="font-semibold mb-3">Expense Overview</h2>
              {data.expense_entries.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <ul className="space-y-2">
                  {data.expense_entries.map(e => (
                    <li key={e.id} className="flex justify-between text-sm">
                      <span>{e.type}</span>
                      <span className="font-medium">{formatPaise(e.monthly_amount_paise)}/mo</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Investment Portfolio */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #E5DDD0' }}>
              <h2 className="font-semibold mb-3">Investment Portfolio</h2>
              {data.investment_entries.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <ul className="space-y-2">
                  {data.investment_entries.map(e => (
                    <li key={e.id} className="flex justify-between text-sm">
                      <span>{e.fields?.name ?? e.type} <span className="text-gray-400">({e.type})</span></span>
                      <span className="font-medium">{formatCrLakh(e.fields?.current_value_paise ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Loan Overview */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #E5DDD0' }}>
              <h2 className="font-semibold mb-3">Loan Overview</h2>
              {data.loan_entries.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b" style={{ borderColor: '#E5DDD0' }}>
                        <th className="text-left pb-2">Loan</th>
                        <th className="text-right pb-2">EMI</th>
                        <th className="text-right pb-2">Principal</th>
                        <th className="text-right pb-2">Tenure</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      {data.loan_entries.map(l => (
                        <tr key={l.id} className="border-b last:border-0" style={{ borderColor: '#F5F0E8' }}>
                          <td className="py-1.5">{l.type}</td>
                          <td className="py-1.5 text-right">{formatPaise(l.emi_paise)}</td>
                          <td className="py-1.5 text-right">{formatCrLakh(l.remaining_principal_paise)}</td>
                          <td className="py-1.5 text-right">{l.remaining_tenure_months}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Financial Health Score */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #E5DDD0' }}>
              <h2 className="font-semibold mb-3">Financial Health Score</h2>
              {health ? (
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow"
                    style={{ backgroundColor: health.color }}
                  >
                    {health.score}
                  </div>
                  <p className="font-medium text-sm" style={{ color: health.color }}>
                    {health.label}
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${health.score}%`, backgroundColor: health.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{health.score} / 100</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No data</p>
              )}
            </div>

            {/* Networth Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #E5DDD0' }}>
              <h2 className="font-semibold mb-3">Networth Summary</h2>
              {data.investment_entries.length === 0 && data.loan_entries.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Assets</span>
                    <span className="font-medium text-green-600">{formatCrLakh(totalInvestments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Liabilities</span>
                    <span className="font-medium text-red-500">{formatCrLakh(totalLoans)}</span>
                  </div>
                  <div className="border-t pt-3" style={{ borderColor: '#E5DDD0' }}>
                    <div className="flex justify-between font-semibold">
                      <span>Net Worth</span>
                      <span style={{ color: totalInvestments - totalLoans >= 0 ? '#22C55E' : '#EF4444' }}>
                        {formatCrLakh(totalInvestments - totalLoans)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">AI Insights</h2>
              <button
                className="px-4 py-1.5 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: '#1A1A1A' }}
              >
                Refresh Insights
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { label: 'Growth Strategy', key: 'growth_strategy' },
                { label: 'Loan Optimizer', key: 'loan_optimizer' },
                { label: 'Retirement Plan', key: 'retirement_plan' },
              ] as const).map(({ label, key }) => (
                <div
                  key={key}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                  style={{ border: '1px solid #E5DDD0' }}
                >
                  <h3 className="font-medium mb-2">{label}</h3>
                  <p className="text-sm text-gray-500">
                    {insight?.[key] ?? 'Generating insights...'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
