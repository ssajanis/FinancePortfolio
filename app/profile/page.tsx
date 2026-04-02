'use client'

import { useEffect, useState } from 'react'

const GOALS = [
  'Buy a house',
  'Buy a car',
  'Child education fund',
  'Gold purchase',
  'International travel',
  'Business startup',
  'Other',
]

interface ProfileForm {
  full_name: string
  current_age: string
  retirement_age: string
  target_networth_10y: string
  target_networth_20y: string
  target_networth_30y: string
  liquid_networth_target: string
  asset_networth_target: string
  goals: string[]
}

const empty: ProfileForm = {
  full_name: '',
  current_age: '',
  retirement_age: '',
  target_networth_10y: '',
  target_networth_20y: '',
  target_networth_30y: '',
  liquid_networth_target: '',
  asset_networth_target: '',
  goals: [],
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(empty)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/profile/get')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.profile) {
          setForm({
            full_name: res.profile.full_name ?? '',
            current_age: res.profile.current_age?.toString() ?? '',
            retirement_age: res.profile.retirement_age?.toString() ?? '',
            target_networth_10y: res.profile.target_networth_10y?.toString() ?? '',
            target_networth_20y: res.profile.target_networth_20y?.toString() ?? '',
            target_networth_30y: res.profile.target_networth_30y?.toString() ?? '',
            liquid_networth_target: res.profile.liquid_networth_target?.toString() ?? '',
            asset_networth_target: res.profile.asset_networth_target?.toString() ?? '',
            goals: res.profile.goals ?? [],
          })
        }
      })
  }, [])

  function handleChange(field: keyof ProfileForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleGoal(goal: string) {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(goal)
        ? f.goals.filter(g => g !== goal)
        : [...f.goals, goal],
    }))
  }

  async function handleSave() {
    setStatus('saving')
    try {
      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          current_age: form.current_age ? parseInt(form.current_age) : null,
          retirement_age: form.retirement_age ? parseInt(form.retirement_age) : null,
          target_networth_10y: form.target_networth_10y ? parseFloat(form.target_networth_10y) : null,
          target_networth_20y: form.target_networth_20y ? parseFloat(form.target_networth_20y) : null,
          target_networth_30y: form.target_networth_30y ? parseFloat(form.target_networth_30y) : null,
          liquid_networth_target: form.liquid_networth_target ? parseFloat(form.liquid_networth_target) : null,
          asset_networth_target: form.asset_networth_target ? parseFloat(form.asset_networth_target) : null,
          goals: form.goals,
        }),
      })
      const data = await res.json()
      setStatus(data.success ? 'saved' : 'error')
      if (data.success) setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
    }
  }

  const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black'
  const inputStyle = { borderColor: '#E5DDD0' }
  const sectionClass = 'bg-white rounded-2xl p-6 shadow-sm space-y-4'
  const sectionBorder = { border: '1px solid #E5DDD0' }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Section 1 — Personal Details */}
      <div className={sectionClass} style={sectionBorder}>
        <h2 className="font-semibold text-base">Personal Details</h2>

        <div>
          <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => handleChange('full_name', e.target.value)}
            className={inputClass}
            style={inputStyle}
            placeholder="e.g. Sajan Vaidhyanathan"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Current Age</label>
            <input
              type="number"
              value={form.current_age}
              onChange={e => handleChange('current_age', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. 35"
              min={0}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Expected Retirement Age</label>
            <input
              type="number"
              value={form.retirement_age}
              onChange={e => handleChange('retirement_age', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. 60"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Section 2 — Networth Goals */}
      <div className={sectionClass} style={sectionBorder}>
        <h2 className="font-semibold text-base">Networth Goals</h2>

        {[
          { label: 'Target Networth in 10 Years ₹', field: 'target_networth_10y' as const },
          { label: 'Target Networth in 20 Years ₹', field: 'target_networth_20y' as const },
          { label: 'Target Networth in 30 Years ₹', field: 'target_networth_30y' as const },
          { label: 'Liquid Networth Target ₹', field: 'liquid_networth_target' as const },
          { label: 'Asset Networth Target ₹', field: 'asset_networth_target' as const },
        ].map(({ label, field }) => (
          <div key={field}>
            <label className="text-sm text-gray-600 mb-1 block">{label}</label>
            <input
              type="number"
              value={form[field]}
              onChange={e => handleChange(field, e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. 10000000"
              min={0}
            />
          </div>
        ))}
      </div>

      {/* Section 3 — Major Future Goals */}
      <div className={sectionClass} style={sectionBorder}>
        <h2 className="font-semibold text-base">Major Future Goals</h2>
        <div className="grid grid-cols-2 gap-3">
          {GOALS.map(goal => (
            <label key={goal} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.goals.includes(goal)}
                onChange={() => toggleGoal(goal)}
                className="rounded"
              />
              {goal}
            </label>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-6 py-2 rounded-full text-white text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          {status === 'saving' ? 'Saving...' : 'Save'}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-green-600 font-medium">Saved ✅</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-red-500">Error saving profile.</span>
        )}
      </div>
    </div>
  )
}
