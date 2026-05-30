'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton({ isDemo = false }: { isDemo?: boolean }) {
  const router = useRouter()

  const handleLogout = async () => {
    if (isDemo) {
      await fetch('/api/demo-logout', { method: 'POST' })
    } else {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-400 hover:text-red-500 transition-colors"
    >
      {isDemo ? '데모 종료' : '로그아웃'}
    </button>
  )
}
