'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface IncomeRow { type: string; amount: string }
interface ExpenseRow { category: string; amount: string }
interface InvestmentRow { type: string; name: string; currentValue: string; monthlyContrib: string }
interface LoanRow { name: string; emi: string; principal: string; tenure: string; rate: string }

const emptyIncome = (): IncomeRow => ({ type: '', amount: '' })
const emptyExpense = (): ExpenseRow => ({ category: '', amount: '' })
const emptyInvestment = (): InvestmentRow => ({ type: '', name: '', currentValue: '', monthlyContrib: '' })
const emptyLoan = (): LoanRow => ({ name: '', emi: '', principal: '', tenure: '', rate: '' })

const INCOME_TYPES = ['Salary', 'Business', 'Rental', 'Freelance', 'Interest', 'Other']
const EXPENSE_CATEGORIES = ['Rent', 'Groceries', 'Utilities', 'Transport', 'Insurance', 'Education', 'Entertainment', 'Medical', 'Other']
const INVESTMENT_TYPES = ['Mutual Fund', 'Stocks', 'PPF', 'EPF', 'NPS', 'FD', 'Gold', 'Real Estate', 'Other']

export default function NewSnapshotPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [income, setIncome] = useState<IncomeRow[]>([emptyIncome()])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([emptyExpense()])
  const [investments, setInvestments] = useState<InvestmentRow[]>([])
  const [loans, setLoans] = useState<LoanRow[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function updateRow<T>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number,
    field: keyof T,
    value: string
  ) {
    setter(rows => rows.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  function removeRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number) {
    setter(rows => rows.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!name.trim()) { setErrorMsg('Snapshot name is required'); return }
    setStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch('/api/snapshots/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          income_entries: income
            .filter(e => e.type && e.amount)
            .map(e => ({
              type: e.type,
              monthly_amount_paise: Math.round(parseFloat(e.amount) * 100),
            })),
          expense_entries: expenses
            .filter(e => e.category && e.amount)
            .map(e => ({
              category: e.category,
              monthly_amount_paise: Math.round(parseFloat(e.amount) * 100),
            })),
          investment_entries: investments
            .filter(e => e.type && e.name)
            .map(e => ({
              type: e.type,
              name: e.name,
              current_value_paise: Math.round(parseFloat(e.currentValue || '0') * 100),
              monthly_contribution_paise: Math.round(parseFloat(e.monthlyContrib || '0') * 100),
            })),
          loan_entries: loans
            .filter(e => e.name)
            .map(e => ({
              name: e.name,
              emi_paise: Math.round(parseFloat(e.emi || '0') * 100),
              principal_paise: Math.round(parseFloat(e.principal || '0') * 100),
              tenure_months: parseInt(e.tenure || '0'),
              rate_percent: parseFloat(e.rate || '0'),
            })),
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push('/')
      } else {
        setErrorMsg(data.error ?? 'Failed to save snapshot')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black'
  const inputStyle = { borderColor: '#E5DDD0' }
  const sectionClass = 'bg-white rounded-2xl p-6 shadow-sm space-y-4'
  const sectionBorder = { border: '1px solid #E5DDD0' }
  const addBtnClass = 'text-xs px-3 py-1 rounded-full border font-medium'
  const removeBtnClass = 'text-gray-400 hover:text-red-500 text-xl leading-none pb-1'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">New Snapshot</h1>
      </div>

      {/* Snapshot name */}
      <div className={sectionClass} style={sectionBorder}>
        <h2 className="font-semibold text-base">Snapshot Name</h2>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputClass}
          style={inputStyle}
          placeholder="e.g. April 2026"
        />
      </div>

      {/* Income */}
      <div className={sectionClass} style={sectionBorder}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Income</h2>
          <button onClick={() => setIncome(r => [...r, emptyIncome()])} className={addBtnClass} style={{ borderColor: '#1A1A1A' }}>
            + Add
          </button>
        </div>
        {income.length === 0 && <p className="text-sm text-gray-400">No income entries.</p>}
        {income.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Type</label>}
              <input
                list="income-types"
                value={row.type}
                onChange={e => updateRow(setIncome, i, 'type', e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. Salary"
              />
              <datalist id="income-types">
                {INCOME_TYPES.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Monthly Amount (₹)</label>}
              <input
                type="number"
                value={row.amount}
                onChange={e => updateRow(setIncome, i, 'amount', e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. 100000"
                min={0}
              />
            </div>
            <button onClick={() => removeRow(setIncome, i)} className={removeBtnClass} title="Remove">×</button>
          </div>
        ))}
      </div>

      {/* Expenses */}
      <div className={sectionClass} style={sectionBorder}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Expenses</h2>
          <button onClick={() => setExpenses(r => [...r, emptyExpense()])} className={addBtnClass} style={{ borderColor: '#1A1A1A' }}>
            + Add
          </button>
        </div>
        {expenses.length === 0 && <p className="text-sm text-gray-400">No expense entries.</p>}
        {expenses.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Category</label>}
              <input
                list="expense-categories"
                value={row.category}
                onChange={e => updateRow(setExpenses, i, 'category', e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. Rent"
              />
              <datalist id="expense-categories">
                {EXPENSE_CATEGORIES.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Monthly Amount (₹)</label>}
              <input
                type="number"
                value={row.amount}
                onChange={e => updateRow(setExpenses, i, 'amount', e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. 30000"
                min={0}
              />
            </div>
            <button onClick={() => removeRow(setExpenses, i)} className={removeBtnClass} title="Remove">×</button>
          </div>
        ))}
      </div>

      {/* Investments */}
      <div className={sectionClass} style={sectionBorder}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Investments</h2>
          <button onClick={() => setInvestments(r => [...r, emptyInvestment()])} className={addBtnClass} style={{ borderColor: '#1A1A1A' }}>
            + Add
          </button>
        </div>
        {investments.length === 0 && (
          <p className="text-sm text-gray-400">
            No investments.{' '}
            <button onClick={() => setInvestments([emptyInvestment()])} className="underline">Add one</button>
          </p>
        )}
        {investments.map((row, i) => (
          <div key={i} className="space-y-2 pb-4 border-b last:border-0" style={{ borderColor: '#F5F0E8' }}>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div>
                {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Type</label>}
                <input
                  list="investment-types"
                  value={row.type}
                  onChange={e => updateRow(setInvestments, i, 'type', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. Mutual Fund"
                />
                <datalist id="investment-types">
                  {INVESTMENT_TYPES.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Name</label>}
                <input
                  type="text"
                  value={row.name}
                  onChange={e => updateRow(setInvestments, i, 'name', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. HDFC Mid Cap"
                />
              </div>
              <button onClick={() => removeRow(setInvestments, i)} className={removeBtnClass} title="Remove">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Current Value (₹)</label>
                <input
                  type="number"
                  value={row.currentValue}
                  onChange={e => updateRow(setInvestments, i, 'currentValue', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 500000"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Monthly Contribution (₹)</label>
                <input
                  type="number"
                  value={row.monthlyContrib}
                  onChange={e => updateRow(setInvestments, i, 'monthlyContrib', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 5000"
                  min={0}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loans */}
      <div className={sectionClass} style={sectionBorder}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Loans</h2>
          <button onClick={() => setLoans(r => [...r, emptyLoan()])} className={addBtnClass} style={{ borderColor: '#1A1A1A' }}>
            + Add
          </button>
        </div>
        {loans.length === 0 && (
          <p className="text-sm text-gray-400">
            No loans.{' '}
            <button onClick={() => setLoans([emptyLoan()])} className="underline">Add one</button>
          </p>
        )}
        {loans.map((row, i) => (
          <div key={i} className="space-y-2 pb-4 border-b last:border-0" style={{ borderColor: '#F5F0E8' }}>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Loan Name</label>}
                <input
                  type="text"
                  value={row.name}
                  onChange={e => updateRow(setLoans, i, 'name', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. Home Loan"
                />
              </div>
              <button onClick={() => removeRow(setLoans, i)} className={removeBtnClass} title="Remove">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Outstanding Principal (₹)</label>
                <input
                  type="number"
                  value={row.principal}
                  onChange={e => updateRow(setLoans, i, 'principal', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 3000000"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Monthly EMI (₹)</label>
                <input
                  type="number"
                  value={row.emi}
                  onChange={e => updateRow(setLoans, i, 'emi', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 30000"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Remaining Tenure (months)</label>
                <input
                  type="number"
                  value={row.tenure}
                  onChange={e => updateRow(setLoans, i, 'tenure', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 240"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Interest Rate (%)</label>
                <input
                  type="number"
                  value={row.rate}
                  onChange={e => updateRow(setLoans, i, 'rate', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 8.5"
                  min={0}
                  step={0.1}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center gap-4 pb-8">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-6 py-2 rounded-full text-white text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          {status === 'saving' ? 'Saving...' : 'Save Snapshot'}
        </button>
        {errorMsg && <span className="text-sm text-red-500">{errorMsg}</span>}
      </div>
    </div>
  )
}
