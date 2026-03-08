'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900">Trade Flow</h1>

      {status === 'authenticated' && session?.user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {session.user.name}{' '}
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {(session.user as any).role}
            </span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
