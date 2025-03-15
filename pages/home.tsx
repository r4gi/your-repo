// pages/home.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      } else {
        router.push('/signup') // ユーザーがログインしていない場合はサインアップページにリダイレクト
      }
    }
    getSession()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="text-center">
        {user ? (
          <div>
            <h1 className="text-4xl font-bold text-indigo-600 mb-4">ようこそ、{user.email}さん</h1>
            <p>サインアップが成功しました！</p>
          </div>
        ) : (
          <p>読み込み中...</p>
        )}
      </div>
    </div>
  )
}
