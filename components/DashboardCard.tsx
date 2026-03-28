import Link from "next/link";

interface DashboardCardProps {
  title: string;
  href: string;
}

export default function DashboardCard({ title, href }: DashboardCardProps) {
  return (
    <Link href={href}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500 transition-colors cursor-pointer">
        <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">View details →</p>
      </div>
    </Link>
  );
}
