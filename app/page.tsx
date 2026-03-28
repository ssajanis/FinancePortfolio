import DashboardCard from "@/components/DashboardCard";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Salary" href="/salary" />
        <DashboardCard title="Expenses" href="/expenses" />
        <DashboardCard title="Investments" href="/investments" />
        <DashboardCard title="Loans" href="/loans" />
      </div>
    </div>
  );
}
