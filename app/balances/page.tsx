"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getBalances, settleBalance } from "../actions/balances"
import BottomNav from "../../components/BottomNav"
import { ArrowLeftRight, CheckCircle2, Loader2 } from "lucide-react"

export default function BalancesPage() {
  const [balances, setBalances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState<string | null>(null)

  const loadBalances = async () => {
    setLoading(true)
    const data = await getBalances()
    setBalances(data)
    setLoading(false)
  }

  useEffect(() => {
    loadBalances()
  }, [])

  const handleSettle = async (friendId: string, amount: number) => {
    setSettling(friendId)
    await settleBalance(friendId, amount)
    await loadBalances()
    setSettling(null)
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-white overflow-hidden pb-[80px] relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <header className="p-6 pt-12 pb-4 shrink-0 relative z-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Settlements</h1>
        <p className="text-zinc-500 font-medium mt-1">Track and clear debts</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 hide-scrollbar relative z-10">
        {loading ? (
          <div className="flex justify-center mt-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : balances.filter(b => Math.abs(b.amount) > 0.01).length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 opacity-50 text-center">
            <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
            <p className="text-lg font-bold">All settled up!</p>
            <p className="text-zinc-500 text-sm mt-2">You don't owe anyone, and no one owes you.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {balances.filter(b => Math.abs(b.amount) > 0.01).map((b, i) => {
              const owesMe = b.amount > 0
              const absAmount = Math.abs(b.amount)

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={b.id}
                  className="bg-black/50 backdrop-blur-md border border-white/5 rounded-3xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-red-600 rounded-full flex items-center justify-center font-bold text-white">
                        {b.friendName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{b.friendName}</p>
                        <p className={`text-sm font-semibold ${owesMe ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {owesMe ? 'Owes you' : 'You owe'}
                        </p>
                      </div>
                    </div>
                    <span className="text-3xl font-black tabular-nums">
                      ₹{absAmount}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleSettle(b.friendId, b.amount)}
                    disabled={settling === b.friendId}
                    className="w-full bg-white/10 hover:bg-white/20 active:bg-white/5 text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {settling === b.friendId ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeftRight className="w-5 h-5" />}
                    Settle Up
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
