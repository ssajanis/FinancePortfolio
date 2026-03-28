"use client";

import { useState } from "react";

interface IncomeSource {
  label: string;
  monthlyAmount: string;
}

interface SalaryIncome {
  label: string;
  baseMonthlySalary: string;
  annualIncrement: string;
  jobSwitchJump: string;
  jobSwitchEvery: string;
  inflationRate: string;
}

const defaultSalary = (label: string): SalaryIncome => ({
  label,
  baseMonthlySalary: "",
  annualIncrement: "",
  jobSwitchJump: "",
  jobSwitchEvery: "",
  inflationRate: "6",
});

const inputClass =
  "w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00c853]";
const inputStyle = { backgroundColor: "#0a0f0d", color: "#e8f5e9", border: "1px solid #1e3a2a" };
const labelClass = "block text-sm mb-1";
const labelStyle = { color: "#e8f5e9" };

function SalarySection({
  title,
  data,
  onChange,
}: {
  title: string;
  data: SalaryIncome;
  onChange: (updated: SalaryIncome) => void;
}) {
  const [open, setOpen] = useState(true);

  const field = (key: keyof SalaryIncome, label: string, type = "number", placeholder = "") => (
    <div>
      <label style={labelStyle} className={labelClass}>{label}</label>
      <input
        type={type}
        className={inputClass}
        style={inputStyle}
        placeholder={placeholder}
        value={data[key]}
        onChange={(e) => onChange({ ...data, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="rounded-lg p-5 mb-4" style={{ backgroundColor: "#0d1f17" }}>
      <button
        type="button"
        className="w-full flex justify-between items-center mb-4"
        onClick={() => setOpen(!open)}
      >
        <span className="text-lg font-semibold" style={{ color: "#00c853" }}>{title}</span>
        <span style={{ color: "#00c853" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("label", "Label", "text", title)}
          {field("baseMonthlySalary", "Base Monthly Salary (₹)", "number", "e.g. 100000")}
          {field("annualIncrement", "Annual Increment %", "number", "e.g. 10")}
          {field("jobSwitchJump", "Job Switch Jump %", "number", "e.g. 30")}
          {field("jobSwitchEvery", "Job Switch Every X Years", "number", "e.g. 3")}
          {field("inflationRate", "Inflation Rate %", "number", "e.g. 6")}
        </div>
      )}
    </div>
  );
}

function OtherIncomeSection({
  sources,
  onChange,
}: {
  sources: IncomeSource[];
  onChange: (updated: IncomeSource[]) => void;
}) {
  const [open, setOpen] = useState(true);

  const updateSource = (index: number, key: keyof IncomeSource, value: string) => {
    const updated = sources.map((s, i) => (i === index ? { ...s, [key]: value } : s));
    onChange(updated);
  };

  const addSource = () => {
    if (sources.length < 3) onChange([...sources, { label: "", monthlyAmount: "" }]);
  };

  return (
    <div className="rounded-lg p-5 mb-4" style={{ backgroundColor: "#0d1f17" }}>
      <button
        type="button"
        className="w-full flex justify-between items-center mb-4"
        onClick={() => setOpen(!open)}
      >
        <span className="text-lg font-semibold" style={{ color: "#00c853" }}>Other Income</span>
        <span style={{ color: "#00c853" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-4">
          {sources.map((source, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle} className={labelClass}>Label</label>
                <input
                  type="text"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. Rental Income"
                  value={source.label}
                  onChange={(e) => updateSource(i, "label", e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle} className={labelClass}>Monthly Amount (₹)</label>
                <input
                  type="number"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="e.g. 20000"
                  value={source.monthlyAmount}
                  onChange={(e) => updateSource(i, "monthlyAmount", e.target.value)}
                />
              </div>
            </div>
          ))}
          {sources.length < 3 && (
            <button
              type="button"
              onClick={addSource}
              className="text-sm px-4 py-2 rounded border transition-colors hover:bg-[#00c853] hover:text-black"
              style={{ color: "#00c853", borderColor: "#00c853" }}
            >
              + Add another source
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SalaryPage() {
  const [self, setSelf] = useState<SalaryIncome>(defaultSalary("My Income"));
  const [spouse, setSpouse] = useState<SalaryIncome>(defaultSalary("Spouse Income"));
  const [otherSources, setOtherSources] = useState<IncomeSource[]>([{ label: "", monthlyAmount: "" }]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ self, spouse, otherSources });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2" style={{ color: "#00c853" }}>Salary</h1>
      <p className="mb-8" style={{ color: "#e8f5e9" }}>Configure your income sources</p>
      <form onSubmit={handleSubmit}>
        <SalarySection title="Your Income (Self)" data={self} onChange={setSelf} />
        <SalarySection title="Spouse Income" data={spouse} onChange={setSpouse} />
        <OtherIncomeSection sources={otherSources} onChange={setOtherSources} />
        <button
          type="submit"
          className="w-full py-3 rounded font-semibold text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#00c853" }}
        >
          Calculate
        </button>
      </form>
    </div>
  );
}
