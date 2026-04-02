'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { label: 'Dashboard', href: '/' },
  { label: 'New Snapshot', href: '/snapshot/new' },
  { label: 'Profile', href: '/profile' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5DDD0' }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
        <span className="font-bold text-xl" style={{ color: '#1A1A1A' }}>
          FinanceOS
        </span>
        <div className="flex gap-6">
          {links.map(({ label, href }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors hover:text-black ${
                  isActive ? 'font-bold underline' : 'font-normal'
                }`}
                style={{ color: '#1A1A1A' }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
