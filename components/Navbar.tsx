import Link from "next/link";

const links = [
  { label: "Dashboard", href: "/" },
  { label: "Salary", href: "/salary" },
  { label: "Expenses", href: "/expenses" },
  { label: "Investments", href: "/investments" },
  { label: "Loans", href: "/loans" },
];

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
        <span className="text-xl font-bold text-indigo-400">FinanceOS</span>
        <ul className="flex gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
