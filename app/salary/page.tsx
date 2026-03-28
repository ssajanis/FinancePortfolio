"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface YearlyEntry {
  year: number;
  nominal_monthly_paise: number;
  real_monthly_paise: number;
  nominal_annual_paise: number;
  real_annual_paise: number;
}

interface SourceProjection {
  label: string;
  owner: string;
  yearly: YearlyEntry[];
  total_nominal_paise: number;
  total_real_paise: number;
}

interface CombinedYearlyEntry {
  year: number;
  nominal_monthly_paise: number;
  real_monthly_paise: number;
}

interface SalaryResponse {
  projections: SourceProjection[];
  combined: {
    yearly: CombinedYearlyEntry[];
    total_nominal_paise: number;
    total_real_paise: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return "₹" + rupees.toLocaleString("en-IN");
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

// ---------------------------------------------------------------------------
// Form sections
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function ProjectionTable({
  yearly,
  switchEvery,
  totalNominal,
  totalReal,
  showAnnual = true,
}: {
  yearly: YearlyEntry[] | CombinedYearlyEntry[];
  switchEvery?: number;
  totalNominal?: number;
  totalReal?: number;
  showAnnual?: boolean;
}) {
  const thStyle = { color: "#00c853", borderBottom: "1px solid #1e3a2a" };
  const tdStyle = { color: "#e8f5e9", borderBottom: "1px solid #1e3a2a" };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4" style={thStyle}>Year</th>
            <th className="text-right py-2 pr-4" style={thStyle}>Nominal Monthly</th>
            <th className="text-right py-2 pr-4" style={thStyle}>Real Monthly</th>
            {showAnnual && <th className="text-right py-2 pr-4" style={thStyle}>Nominal Annual</th>}
            {showAnnual && <th className="text-right py-2" style={thStyle}>Real Annual</th>}
          </tr>
        </thead>
        <tbody>
          {yearly.map((row) => {
            const isSwitchYear = switchEvery ? row.year % switchEvery === 0 : false;
            const rowStyle = isSwitchYear
              ? { borderLeft: "3px solid #00c853", paddingLeft: "8px" }
              : { borderLeft: "3px solid transparent", paddingLeft: "8px" };
            return (
              <tr key={row.year} style={rowStyle}>
                <td className="py-2 pr-4" style={tdStyle}>{row.year}</td>
                <td className="text-right py-2 pr-4" style={tdStyle}>
                  {formatPaise(row.nominal_monthly_paise)}
                </td>
                <td className="text-right py-2 pr-4" style={tdStyle}>
                  {formatPaise(row.real_monthly_paise)}
                </td>
                {"nominal_annual_paise" in row && showAnnual && (
                  <td className="text-right py-2 pr-4" style={tdStyle}>
                    {formatPaise((row as YearlyEntry).nominal_annual_paise)}
                  </td>
                )}
                {"real_annual_paise" in row && showAnnual && (
                  <td className="text-right py-2" style={tdStyle}>
                    {formatPaise((row as YearlyEntry).real_annual_paise)}
                  </td>
                )}
              </tr>
            );
          })}
          {totalNominal !== undefined && totalReal !== undefined && (
            <tr style={{ borderTop: "2px solid #00c853" }}>
              <td className="py-2 pr-4 font-semibold" style={{ color: "#00c853" }}>Total</td>
              <td className="text-right py-2 pr-4 font-semibold" style={{ color: "#00c853" }}>—</td>
              <td className="text-right py-2 pr-4 font-semibold" style={{ color: "#00c853" }}>—</td>
              {showAnnual && (
                <td className="text-right py-2 pr-4 font-semibold" style={{ color: "#00c853" }}>
                  {formatPaise(totalNominal)}
                </td>
              )}
              {showAnnual && (
                <td className="text-right py-2 font-semibold" style={{ color: "#00c853" }}>
                  {formatPaise(totalReal)}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ResultsSection({
  data,
  switchEveryMap,
}: {
  data: SalaryResponse;
  switchEveryMap: Record<string, number>;
}) {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-6" style={{ color: "#00c853" }}>Projections</h2>

      {data.projections.map((proj) => (
        <div key={proj.label} className="rounded-lg p-5 mb-6" style={{ backgroundColor: "#0d1f17" }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "#00c853" }}>
            {proj.label}{" "}
            <span className="text-sm font-normal" style={{ color: "#e8f5e9" }}>({proj.owner})</span>
          </h3>
          <ProjectionTable
            yearly={proj.yearly}
            switchEvery={switchEveryMap[proj.label]}
            totalNominal={proj.total_nominal_paise}
            totalReal={proj.total_real_paise}
          />
        </div>
      ))}

      <div className="rounded-lg p-5 mb-6" style={{ backgroundColor: "#0d1f17" }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#00c853" }}>Combined Household</h3>
        <ProjectionTable
          yearly={data.combined.yearly}
          totalNominal={data.combined.total_nominal_paise}
          totalReal={data.combined.total_real_paise}
          showAnnual={false}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SalaryPage() {
  const [self, setSelf] = useState<SalaryIncome>(defaultSalary("My Income"));
  const [spouse, setSpouse] = useState<SalaryIncome>(defaultSalary("Spouse Income"));
  const [otherSources, setOtherSources] = useState<IncomeSource[]>([{ label: "", monthlyAmount: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SalaryResponse | null>(null);
  const [switchEveryMap, setSwitchEveryMap] = useState<Record<string, number>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    const sources = [];
    const newSwitchEveryMap: Record<string, number> = {};

    // Self
    if (Number(self.baseMonthlySalary) > 0) {
      sources.push({
        label: self.label || "My Income",
        owner: "self",
        income_type: "salary",
        base_monthly_paise: Math.round(Number(self.baseMonthlySalary) * 100),
        increment_pct: Number(self.annualIncrement),
        switch_jump_pct: Number(self.jobSwitchJump),
        switch_every_years: Number(self.jobSwitchEvery),
        inflation_rate: Number(self.inflationRate),
      });
      newSwitchEveryMap[self.label || "My Income"] = Number(self.jobSwitchEvery);
    }

    // Spouse
    if (Number(spouse.baseMonthlySalary) > 0) {
      sources.push({
        label: spouse.label || "Spouse Income",
        owner: "spouse",
        income_type: "salary",
        base_monthly_paise: Math.round(Number(spouse.baseMonthlySalary) * 100),
        increment_pct: Number(spouse.annualIncrement),
        switch_jump_pct: Number(spouse.jobSwitchJump),
        switch_every_years: Number(spouse.jobSwitchEvery),
        inflation_rate: Number(spouse.inflationRate),
      });
      newSwitchEveryMap[spouse.label || "Spouse Income"] = Number(spouse.jobSwitchEvery);
    }

    // Other income
    for (const src of otherSources) {
      if (Number(src.monthlyAmount) > 0) {
        sources.push({
          label: src.label || "Other Income",
          owner: "other",
          income_type: "rental",
          flat_monthly_paise: Math.round(Number(src.monthlyAmount) * 100),
          inflation_rate: 6,
        });
      }
    }

    if (sources.length === 0) {
      setError("Please enter at least one income source.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/calculate/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `API error ${res.status}`);
      }

      const data: SalaryResponse = await res.json();
      setSwitchEveryMap(newSwitchEveryMap);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2" style={{ color: "#00c853" }}>Salary</h1>
      <p className="mb-8" style={{ color: "#e8f5e9" }}>Configure your income sources</p>
      <form onSubmit={handleSubmit}>
        <SalarySection title="Your Income (Self)" data={self} onChange={setSelf} />
        <SalarySection title="Spouse Income" data={spouse} onChange={setSpouse} />
        <OtherIncomeSection sources={otherSources} onChange={setOtherSources} />
        {error && (
          <p className="mb-4 text-sm" style={{ color: "#ef5350" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#00c853" }}
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </form>

      {results && <ResultsSection data={results} switchEveryMap={switchEveryMap} />}
    </div>
  );
}
