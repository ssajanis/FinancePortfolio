"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface SalaryRecord {
  id: string;
  owner: "self" | "spouse" | "other";
  label: string;
  income_type: string;
  base_salary_paise: number | null;
  flat_monthly_paise: number | null;
}

interface ExpenseBreakdownItem {
  category: string;
  amount_paise: number;
  percentage: number;
}

interface ExpenseResult {
  monthly_income_paise: number;
  income_breakdown: {
    self_paise: number;
    spouse_paise: number;
    other_paise: number;
  };
  total_fixed_paise: number;
  total_variable_paise: number;
  total_emis_paise: number;
  total_one_time_monthly_avg_paise: number;
  total_expenses_paise: number;
  monthly_surplus_paise: number;
  savings_rate_pct: number;
  target_savings_rate_pct: number;
  savings_gap_pct: number;
  amount_to_target_paise: number;
  debt_snowball: string[];
  debt_avalanche: string[];
  avalanche_saves_more: boolean;
  investment_opportunity_paise: number;
  expense_breakdown: ExpenseBreakdownItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return "₹" + rupees.toLocaleString("en-IN");
}

function formatPaiseAxis(val: number): string {
  if (val >= 100000) return "₹" + (val / 100000).toFixed(1) + "L";
  if (val >= 1000) return "₹" + (val / 1000).toFixed(0) + "K";
  return "₹" + val;
}

const inputClass =
  "w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00c853]";
const inputStyle = { backgroundColor: "#0a0f0d", color: "#e8f5e9", border: "1px solid #1e3a2a" };
const labelClass = "block text-xs mb-1";
const labelStyle = { color: "#a5d6a7" };
const cardStyle = { backgroundColor: "#0d1f17" };
const tooltipStyle = { backgroundColor: "#0d1f17", border: "1px solid #00c853", color: "#e8f5e9" };

const PIE_COLORS = ["#00c853", "#4fc3f7", "#ffb74d", "#f48fb1"];

// ---------------------------------------------------------------------------
// Income Summary
// ---------------------------------------------------------------------------

function IncomeSummary({
  records,
  loading,
}: {
  records: SalaryRecord[];
  loading: boolean;
}) {
  const selfPaise = records
    .filter((r) => r.owner === "self")
    .reduce((s, r) => s + (r.base_salary_paise ?? 0), 0);
  const spousePaise = records
    .filter((r) => r.owner === "spouse")
    .reduce((s, r) => s + (r.base_salary_paise ?? 0), 0);
  const otherPaise = records
    .filter((r) => r.owner === "other")
    .reduce((s, r) => s + (r.flat_monthly_paise ?? 0), 0);
  const totalPaise = selfPaise + spousePaise + otherPaise;

  if (loading) {
    return (
      <div className="rounded-lg p-5 mb-6" style={cardStyle}>
        <p className="text-sm" style={{ color: "#a5d6a7" }}>Loading income data...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg p-5 mb-6" style={{ ...cardStyle, border: "1px solid #1e3a2a" }}>
        <p className="text-sm text-center leading-6" style={{ color: "#a5d6a7" }}>
          No income data found.<br />Please save your salary data first.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-5 mb-6" style={cardStyle}>
      <h2 className="text-base font-semibold mb-3" style={{ color: "#00c853" }}>
        Monthly Income Summary
      </h2>
      <div className="space-y-1 text-sm">
        {selfPaise > 0 && (
          <div className="flex justify-between py-1">
            <span style={{ color: "#a5d6a7" }}>Your Income</span>
            <span style={{ color: "#e8f5e9" }}>{formatPaise(selfPaise)}/month</span>
          </div>
        )}
        {spousePaise > 0 && (
          <div className="flex justify-between py-1">
            <span style={{ color: "#a5d6a7" }}>Spouse Income</span>
            <span style={{ color: "#e8f5e9" }}>{formatPaise(spousePaise)}/month</span>
          </div>
        )}
        {otherPaise > 0 && (
          <div className="flex justify-between py-1">
            <span style={{ color: "#a5d6a7" }}>Other Income</span>
            <span style={{ color: "#e8f5e9" }}>{formatPaise(otherPaise)}/month</span>
          </div>
        )}
        <div className="border-t pt-2 mt-1" style={{ borderColor: "#1e3a2a" }} />
        <div className="flex justify-between py-1 font-semibold">
          <span style={{ color: "#00c853" }}>Total Household Income</span>
          <span style={{ color: "#00c853" }}>{formatPaise(totalPaise)}/month</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expense form sections
// ---------------------------------------------------------------------------

function SimpleExpenseSection({
  title,
  addLabel,
  items,
  onChange,
  placeholder = "e.g. Rent",
}: {
  title: string;
  addLabel: string;
  items: SimpleExpense[];
  onChange: (items: SimpleExpense[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(true);

  const update = (i: number, key: keyof SimpleExpense, val: string) =>
    onChange(items.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));

  const add = () => onChange([...items, { name: "", amount: "" }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-lg p-5 mb-4" style={cardStyle}>
      <button
        type="button"
        className="w-full flex justify-between items-center mb-3"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base font-semibold" style={{ color: "#00c853" }}>
          {title}
        </span>
        <span style={{ color: "#00c853" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className={labelClass} style={labelStyle}>
                  Name
                </label>
                <input
                  type="text"
                  className={inputClass}
                  style={inputStyle}
                  placeholder={placeholder}
                  value={item.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass} style={labelStyle}>
                  Monthly Amount ₹
                </label>
                <input
                  type="number"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 15000"
                  value={item.amount}
                  onChange={(e) => update(i, "amount", e.target.value)}
                />
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="mb-0.5 px-2 py-2 rounded text-sm transition-colors hover:bg-red-900/30"
                  style={{ color: "#ef5350" }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="text-xs px-3 py-1.5 rounded border transition-colors hover:bg-[#00c853] hover:text-black"
            style={{ color: "#00c853", borderColor: "#00c853" }}
          >
            + {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function LoanEMISection({
  items,
  onChange,
}: {
  items: LoanEMI[];
  onChange: (items: LoanEMI[]) => void;
}) {
  const [open, setOpen] = useState(true);

  const update = (i: number, key: keyof LoanEMI, val: string) =>
    onChange(items.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));

  const add = () => onChange([...items, { name: "", amount: "", balance: "", rate: "" }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-lg p-5 mb-4" style={cardStyle}>
      <button
        type="button"
        className="w-full flex justify-between items-center mb-3"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base font-semibold" style={{ color: "#00c853" }}>
          Loan EMIs
        </span>
        <span style={{ color: "#00c853" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded p-3 relative"
              style={{ backgroundColor: "#0a1a10", border: "1px solid #1e3a2a" }}
            >
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-2 right-2 text-sm transition-colors hover:text-red-400"
                style={{ color: "#ef5350" }}
              >
                ✕
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass} style={labelStyle}>
                    Loan Name
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. Car Loan"
                    value={item.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass} style={labelStyle}>
                    Monthly EMI ₹
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. 8000"
                    value={item.amount}
                    onChange={(e) => update(i, "amount", e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass} style={labelStyle}>
                    Estimated Balance ₹
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. 500000"
                    value={item.balance}
                    onChange={(e) => update(i, "balance", e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass} style={labelStyle}>
                    Interest Rate %
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. 9.5"
                    step="0.1"
                    value={item.rate}
                    onChange={(e) => update(i, "rate", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="text-xs px-3 py-1.5 rounded border transition-colors hover:bg-[#00c853] hover:text-black"
            style={{ color: "#00c853", borderColor: "#00c853" }}
          >
            + Add Loan EMI
          </button>
        </div>
      )}
    </div>
  );
}

function OneTimeExpenseSection({
  items,
  onChange,
}: {
  items: OneTimeExpense[];
  onChange: (items: OneTimeExpense[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const currentYear = new Date().getFullYear();

  const update = (i: number, key: keyof OneTimeExpense, val: string) =>
    onChange(items.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)));

  const add = () =>
    onChange([...items, { name: "", amount: "", month: "", year: String(currentYear) }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return (
    <div className="rounded-lg p-5 mb-4" style={cardStyle}>
      <button
        type="button"
        className="w-full flex justify-between items-center mb-3"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base font-semibold" style={{ color: "#00c853" }}>
          One-Time Expenses
        </span>
        <span style={{ color: "#00c853" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded p-3 relative"
              style={{ backgroundColor: "#0a1a10", border: "1px solid #1e3a2a" }}
            >
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-2 right-2 text-sm transition-colors hover:text-red-400"
                style={{ color: "#ef5350" }}
              >
                ✕
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass} style={labelStyle}>
                    Expense Name
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. Vacation"
                    value={item.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass} style={labelStyle}>
                    Amount ₹
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    style={inputStyle}
                    placeholder="e.g. 50000"
                    value={item.amount}
                    onChange={(e) => update(i, "amount", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Month
                  </label>
                  <select
                    className={inputClass}
                    style={inputStyle}
                    value={item.month}
                    onChange={(e) => update(i, "month", e.target.value)}
                  >
                    <option value="">Select month</option>
                    {months.map((m, idx) => (
                      <option key={m} value={String(idx + 1)}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Year
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    style={inputStyle}
                    placeholder={String(currentYear)}
                    value={item.year}
                    onChange={(e) => update(i, "year", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="text-xs px-3 py-1.5 rounded border transition-colors hover:bg-[#00c853] hover:text-black"
            style={{ color: "#00c853", borderColor: "#00c853" }}
          >
            + Add One-Time Expense
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result cards
// ---------------------------------------------------------------------------

function CashFlowCard({ result }: { result: ExpenseResult }) {
  const surplusColor = result.monthly_surplus_paise >= 0 ? "#00c853" : "#ef5350";
  const divider = <div className="border-t my-2" style={{ borderColor: "#1e3a2a" }} />;

  return (
    <div className="rounded-lg p-5" style={cardStyle}>
      <h3 className="text-base font-semibold mb-4" style={{ color: "#00c853" }}>
        Monthly Cash Flow
      </h3>
      <div className="space-y-0.5 text-sm">
        <div className="flex justify-between py-1">
          <span style={{ color: "#a5d6a7" }}>Your Income</span>
          <span style={{ color: "#e8f5e9" }}>{formatPaise(result.income_breakdown.self_paise)}</span>
        </div>
        {result.income_breakdown.spouse_paise > 0 && (
          <div className="flex justify-between py-1">
            <span style={{ color: "#a5d6a7" }}>Spouse Income</span>
            <span style={{ color: "#e8f5e9" }}>{formatPaise(result.income_breakdown.spouse_paise)}</span>
          </div>
        )}
        {result.income_breakdown.other_paise > 0 && (
          <div className="flex justify-between py-1">
            <span style={{ color: "#a5d6a7" }}>Other Income</span>
            <span style={{ color: "#e8f5e9" }}>{formatPaise(result.income_breakdown.other_paise)}</span>
          </div>
        )}
        <div className="flex justify-between py-1 font-semibold">
          <span style={{ color: "#e8f5e9" }}>Total Income</span>
          <span style={{ color: "#e8f5e9" }}>{formatPaise(result.monthly_income_paise)}</span>
        </div>
        {divider}
        <div className="flex justify-between py-1">
          <span style={{ color: "#a5d6a7" }}>Total Fixed</span>
          <span style={{ color: "#e8f5e9" }}>{formatPaise(result.total_fixed_paise)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span style={{ color: "#a5d6a7" }}>Total Variable</span>
          <span style={{ color: "#e8f5e9" }}>{formatPaise(result.total_variable_paise)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span style={{ color: "#a5d6a7" }}>Total EMIs</span>
          <span style={{ color: "#e8f5e9" }}>{formatPaise(result.total_emis_paise)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span style={{ color: "#a5d6a7" }}>Total One-Time (monthly avg)</span>
          <span style={{ color: "#e8f5e9" }}>{formatPaise(result.total_one_time_monthly_avg_paise)}</span>
        </div>
        <div className="flex justify-between py-1 font-semibold">
          <span style={{ color: "#e8f5e9" }}>Total Expenses</span>
          <span style={{ color: "#e8f5e9" }}>{formatPaise(result.total_expenses_paise)}</span>
        </div>
        {divider}
        <div className="flex justify-between py-1 font-bold text-base">
          <span style={{ color: surplusColor }}>Monthly Surplus</span>
          <span style={{ color: surplusColor }}>{formatPaise(result.monthly_surplus_paise)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span style={{ color: "#a5d6a7" }}>Savings Rate</span>
          <span style={{ color: result.savings_rate_pct >= 30 ? "#00c853" : "#ffb74d" }}>
            {result.savings_rate_pct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function SavingsGapCard({ result }: { result: ExpenseResult }) {
  const onTarget = result.savings_gap_pct === 0;

  return (
    <div className="rounded-lg p-5" style={cardStyle}>
      <h3 className="text-base font-semibold mb-4" style={{ color: "#00c853" }}>
        Savings Gap Analysis
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span style={{ color: "#a5d6a7" }}>Target Savings Rate</span>
          <span style={{ color: "#00c853" }}>30%</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: "#a5d6a7" }}>Current Savings Rate</span>
          <span style={{ color: result.savings_rate_pct >= 30 ? "#00c853" : "#ffb74d" }}>
            {result.savings_rate_pct.toFixed(1)}%
          </span>
        </div>
        {!onTarget && (
          <>
            <div className="flex justify-between">
              <span style={{ color: "#a5d6a7" }}>Gap</span>
              <span style={{ color: "#ef5350" }}>{result.savings_gap_pct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#a5d6a7" }}>Amount needed to reach target</span>
              <span style={{ color: "#ef5350" }}>{formatPaise(result.amount_to_target_paise)}/month</span>
            </div>
            <div
              className="mt-3 p-3 rounded text-xs"
              style={{ backgroundColor: "#0a1a10", border: "1px solid #1e3a2a", color: "#a5d6a7" }}
            >
              Suggestion: Reduce variable expenses by{" "}
              <span style={{ color: "#ffb74d" }}>{formatPaise(result.amount_to_target_paise)}</span> to
              reach your savings target.
            </div>
          </>
        )}
        {onTarget && (
          <div
            className="mt-3 p-3 rounded text-xs"
            style={{ backgroundColor: "#0a2a10", border: "1px solid #00c853", color: "#00c853" }}
          >
            You are meeting the 30% savings target.
          </div>
        )}
      </div>
    </div>
  );
}

function DebtStrategyCard({
  result,
  loans,
}: {
  result: ExpenseResult;
  loans: LoanEMI[];
}) {
  if (result.debt_snowball.length === 0) return null;

  const filledLoans = loans.filter((l) => l.name && Number(l.amount) > 0);

  return (
    <div className="rounded-lg p-5" style={cardStyle}>
      <h3 className="text-base font-semibold mb-2" style={{ color: "#00c853" }}>
        Debt Strategy Comparison
      </h3>
      <p className="text-xs mb-4" style={{ color: "#a5d6a7" }}>
        Recommendation:{" "}
        <span style={{ color: "#00c853" }}>
          {result.avalanche_saves_more
            ? "Avalanche method — pay highest interest rate first (saves more interest)"
            : "Snowball method — pay smallest balance first (builds momentum)"}
        </span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e3a2a" }}>
              {["Loan Name", "EMI", "Est. Balance", "Rate %", "Snowball", "Avalanche"].map((h) => (
                <th
                  key={h}
                  className="text-left py-2 px-2 font-semibold"
                  style={{ color: "#00c853" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filledLoans.map((loan, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #1e3a2a" }}>
                <td className="py-2 px-2" style={{ color: "#e8f5e9" }}>{loan.name}</td>
                <td className="py-2 px-2" style={{ color: "#e8f5e9" }}>
                  {formatPaise(Math.round(Number(loan.amount) * 100))}
                </td>
                <td className="py-2 px-2" style={{ color: "#e8f5e9" }}>
                  {formatPaise(Math.round(Number(loan.balance) * 100))}
                </td>
                <td className="py-2 px-2" style={{ color: "#e8f5e9" }}>{loan.rate}%</td>
                <td className="py-2 px-2 text-center font-semibold" style={{ color: "#4fc3f7" }}>
                  #{result.debt_snowball.indexOf(loan.name) + 1}
                </td>
                <td className="py-2 px-2 text-center font-semibold" style={{ color: "#ffb74d" }}>
                  #{result.debt_avalanche.indexOf(loan.name) + 1}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvestmentCard({ result }: { result: ExpenseResult }) {
  return (
    <div className="rounded-lg p-5" style={cardStyle}>
      <h3 className="text-base font-semibold mb-4" style={{ color: "#00c853" }}>
        Investment Opportunity
      </h3>
      <div
        className="p-4 rounded"
        style={{ backgroundColor: "#0a1a10", border: "1px solid #1e3a2a" }}
      >
        <p className="text-sm" style={{ color: "#a5d6a7" }}>
          If you redirect{" "}
          <span style={{ color: "#00c853" }}>{formatPaise(result.total_variable_paise)}</span> from
          variable expenses into investments at 12% annual return,
        </p>
        <p className="mt-3 text-xl font-bold" style={{ color: "#00c853" }}>
          your corpus grows to {formatPaise(result.investment_opportunity_paise)} over 10 years
        </p>
        <p className="mt-2 text-xs" style={{ color: "#4a7a5a" }}>
          Assumes 1% monthly compounding (annuity-due) over 120 months
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

function ExpenseCharts({ result }: { result: ExpenseResult }) {
  const pieData = result.expense_breakdown
    .filter((b) => b.amount_paise > 0)
    .map((b) => ({
      name: b.category,
      value: Math.round(b.amount_paise / 100),
      paise: b.amount_paise,
      percentage: b.percentage,
    }));

  const barData = [
    { label: "Income", amount: Math.round(result.monthly_income_paise / 100) },
    { label: "Expenses", amount: Math.round(result.total_expenses_paise / 100) },
  ];

  const expensesExceedIncome = result.total_expenses_paise > result.monthly_income_paise;

  return (
    <div className="space-y-6 mt-6">
      <div className="rounded-lg p-5" style={cardStyle}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "#00c853" }}>
          Expense Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={110}
              dataKey="value"
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              labelLine={{ stroke: "#1e3a2a" }}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string, entry) => {
                const p = (entry as { payload?: { paise?: number; percentage?: number } }).payload;
                if (p?.paise !== undefined && p?.percentage !== undefined) {
                  return [`${formatPaise(p.paise)} (${p.percentage.toFixed(1)}%)`, name];
                }
                return [formatPaise(value * 100), name];
              }}
            />
            <Legend wrapperStyle={{ color: "#e8f5e9" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg p-5" style={cardStyle}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "#00c853" }}>
          Income vs Expenses
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} barCategoryGap="45%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2f1f" />
            <XAxis dataKey="label" stroke="#e8f5e9" tick={{ fill: "#e8f5e9", fontSize: 12 }} />
            <YAxis
              stroke="#e8f5e9"
              tick={{ fill: "#e8f5e9", fontSize: 12 }}
              tickFormatter={formatPaiseAxis}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => formatPaise(value * 100)}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} name="Amount">
              <Cell fill="#00c853" />
              <Cell fill={expensesExceedIncome ? "#ef5350" : "#ffb74d"} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExpensesPage() {
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(true);

  const [fixedExpenses, setFixedExpenses] = useState<SimpleExpense[]>([{ name: "", amount: "" }]);
  const [variableExpenses, setVariableExpenses] = useState<SimpleExpense[]>([
    { name: "", amount: "" },
  ]);
  const [loanEmis, setLoanEmis] = useState<LoanEMI[]>([]);
  const [oneTimeExpenses, setOneTimeExpenses] = useState<OneTimeExpense[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExpenseResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetch("/api/salary/records")
      .then((r) => r.json())
      .then((data) => setSalaryRecords(data.records ?? []))
      .catch(() => {})
      .finally(() => setIncomeLoading(false));
  }, []);

  const selfPaise = salaryRecords
    .filter((r) => r.owner === "self")
    .reduce((s, r) => s + (r.base_salary_paise ?? 0), 0);
  const spousePaise = salaryRecords
    .filter((r) => r.owner === "spouse")
    .reduce((s, r) => s + (r.base_salary_paise ?? 0), 0);
  const otherPaise = salaryRecords
    .filter((r) => r.owner === "other")
    .reduce((s, r) => s + (r.flat_monthly_paise ?? 0), 0);
  const totalIncomePaise = selfPaise + spousePaise + otherPaise;

  const buildPayload = () => ({
    monthly_income_paise: totalIncomePaise,
    income_breakdown: {
      self_paise: selfPaise,
      spouse_paise: spousePaise,
      other_paise: otherPaise,
    },
    fixed_expenses: fixedExpenses
      .filter((e) => e.name && Number(e.amount) > 0)
      .map((e) => ({ name: e.name, amount_paise: Math.round(Number(e.amount) * 100) })),
    variable_expenses: variableExpenses
      .filter((e) => e.name && Number(e.amount) > 0)
      .map((e) => ({ name: e.name, amount_paise: Math.round(Number(e.amount) * 100) })),
    loan_emis: loanEmis
      .filter((e) => e.name && Number(e.amount) > 0)
      .map((e) => ({
        name: e.name,
        amount_paise: Math.round(Number(e.amount) * 100),
        estimated_balance_paise: Math.round(Number(e.balance) * 100),
        interest_rate_pct: Number(e.rate),
      })),
    one_time_expenses: oneTimeExpenses
      .filter((e) => e.name && Number(e.amount) > 0 && e.month && e.year)
      .map((e) => ({
        name: e.name,
        amount_paise: Math.round(Number(e.amount) * 100),
        month: Number(e.month),
        year: Number(e.year),
      })),
  });

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setSaveStatus("idle");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/calculate/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        }
      );

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `API error ${res.status}`);
      }

      setResults(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/expenses/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixed_expenses: fixedExpenses,
          variable_expenses: variableExpenses,
          loan_emis: loanEmis,
          one_time_expenses: oneTimeExpenses,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleExportPdf = async () => {
    if (!results) return;
    setPdfLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/generate/expenses-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(results),
        }
      );
      if (!res.ok) throw new Error(`PDF error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "FinanceOS-Expense-Report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2" style={{ color: "#00c853" }}>
        Expenses
      </h1>
      <p className="mb-6" style={{ color: "#e8f5e9" }}>
        Track and optimise your household spending
      </p>

      <IncomeSummary records={salaryRecords} loading={incomeLoading} />

      <form onSubmit={handleCalculate}>
        <SimpleExpenseSection
          title="Fixed Expenses"
          addLabel="Add Fixed Expense"
          items={fixedExpenses}
          onChange={setFixedExpenses}
          placeholder="e.g. Rent"
        />
        <SimpleExpenseSection
          title="Variable Expenses"
          addLabel="Add Variable Expense"
          items={variableExpenses}
          onChange={setVariableExpenses}
          placeholder="e.g. Food"
        />
        <LoanEMISection items={loanEmis} onChange={setLoanEmis} />
        <OneTimeExpenseSection items={oneTimeExpenses} onChange={setOneTimeExpenses} />

        {error && (
          <p className="mb-4 text-sm" style={{ color: "#ef5350" }}>
            {error}
          </p>
        )}
        {saveStatus === "error" && saveError && (
          <p className="mb-4 text-sm" style={{ color: "#ef5350" }}>
            Save failed: {saveError}
          </p>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#00c853" }}
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="flex-1 py-3 rounded font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "transparent",
              border: "1px solid #00c853",
              color: saveStatus === "saved" ? "#00c853" : "#e8f5e9",
            }}
          >
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved ✅" : "Save"}
          </button>
        </div>
      </form>

      {results && (
        <>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={pdfLoading}
              className="px-5 py-2 rounded font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#00c853" }}
            >
              {pdfLoading ? "Generating PDF..." : "Export PDF"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <CashFlowCard result={results} />
            <SavingsGapCard result={results} />
            <DebtStrategyCard result={results} loans={loanEmis} />
            <InvestmentCard result={results} />
          </div>

          <ExpenseCharts result={results} />
        </>
      )}
    </div>
  );
}
