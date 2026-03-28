"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Dashboard", href: "/" },
  { label: "Salary", href: "/salary" },
  { label: "Expenses", href: "/expenses" },
  { label: "Investments", href: "/investments" },
  { label: "Loans", href: "/loans" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{ backgroundColor: "#0d1f17", borderBottom: "1px solid #00c853" }}>
      <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-8">
        <span className="text-xl font-bold" style={{ color: "#00c853" }}>FinanceOS</span>
        <ul className="flex gap-6">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    color: isActive ? "#00c853" : "#e8f5e9",
                    textDecoration: isActive ? "underline" : "none",
                  }}
                  className="hover:text-[#00c853] transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
