import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { RealtimePostgresInsertPayload, RealtimePostgresDeletePayload } from '@supabase/supabase-js'

interface Memo {
  id: number
  content: string
  created_at?: string
}

export default function Home() {
  const [memoContent, setMemoContent] = useState('')
  const [memos, setMemos] = useState<any[]>([])

  // メモの追加
  const addMemo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (memoContent.trim() === '') return

    const { data, error } = await supabase
      .from('memos')
      .insert([{ content: memoContent }])
      .select('*')

    if (error) {
      console.error('Error inserting memo:', error)
    } else if (data) {
      // 新しいメモを最初に追加（重複を避けるためIDで確認）
      setMemos((prevMemos) => {
        const newMemo = data[0]
        // すでにリストに同じIDのメモが存在しない場合のみ追加
        if (!prevMemos.some((memo) => memo.id === newMemo.id)) {
          return [newMemo, ...prevMemos]
        }
        return prevMemos
      })
      setMemoContent('')
    }
  }

  // メモの削除
  const deleteMemo = async (id: number) => {
    const { error } = await supabase.from('memos').delete().eq('id', id)
    if (error) {
      console.error('Error deleting memo:', error)
    } else {
      // メモ削除後にローカルでリストを更新
      setMemos((prevMemos) => prevMemos.filter((memo) => memo.id !== id))
    }
  }

  // メモの取得
  const fetchMemos = async () => {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false }) // 最新のメモを表示
    if (error) {
      console.error('Error fetching memos:', error)
    } else {
      setMemos(data || [])
    }
  }

  // Supabaseのリアルタイム機能を利用して、メモの変更を監視する
  useEffect(() => {
    fetchMemos()

    const subscription = supabase
      .channel('memos')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'memos' },
        (payload: RealtimePostgresInsertPayload<Memo>) => {
          setMemos((prevMemos) => {
            const newMemo = payload.new
            if (!prevMemos.some((memo) => memo.id === newMemo.id)) {
              return [newMemo, ...prevMemos]
            }
            return prevMemos
          })
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'memos' },
        (payload: RealtimePostgresDeletePayload<Memo>) => {
          setMemos((prevMemos) =>
            prevMemos.filter((memo) => memo.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8 text-center">
          メモ帳
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8"
        >
          <form onSubmit={addMemo} className="flex gap-2">
            <input
              type="text"
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="新しいメモを入力..."
              className="flex-1 h-12 px-4 bg-white/90 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all text-gray-700"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <span className="text-2xl">＋</span>
            </motion.button>
          </form>
        </motion.div>

        <motion.ul layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {memos.map((memo) => (
              <motion.li
                key={memo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                layout
                className="group bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <motion.span 
                    layout="position"
                    className="text-gray-700 font-medium flex-1 break-all pr-4"
                  >
                    {memo.content}
                  </motion.span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteMemo(memo.id)}
                    className="opacity-0 group-hover:opacity-100 ml-4 text-white bg-red-500 hover:bg-red-600 transition-all duration-200 w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 011-1h6a1 1 0 011 1h3a1 1 0 011 1v1h-12V3a1 1 0 011-1zm1 3h8a1 1 0 011 1v12a2 2 0 002 2h-12a2 2 0 002-2V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </motion.button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </div>
  )
}
