"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getBalances, settleBalance } from "../actions/balances"
import BottomNav from "../../components/BottomNav"
import { ArrowLeftRight, CheckCircle2, Loader2, Sparkles } from "lucide-react"

const HoldToSettleButton = ({ onSettle, isSettling }: { onSettle: () => void, isSettling: boolean }) => {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (holding && progress < 100) {
      interval = setInterval(() => setProgress(p => Math.min(p + 2, 100)), 20)
    } else if (!holding && progress > 0 && progress < 100) {
      interval = setInterval(() => setProgress(p => Math.max(p - 5, 0)), 20)
    } else if (progress === 100) {
      setHolding(false)
      onSettle()
      setTimeout(() => setProgress(0), 1000)
    }
    return () => clearInterval(interval)
  }, [holding, progress, onSettle])

  return (
    <div 
      className="relative w-full h-14 bg-white/5 rounded-2xl overflow-hidden touch-none select-none"
      onPointerDown={() => setHolding(true)}
      onPointerUp={() => setHolding(false)}
      onPointerLeave={() => setHolding(false)}
    >
      <div 
        className="absolute inset-y-0 left-0 bg-rose-600 transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-2 font-bold z-10 pointer-events-none text-white">
        {isSettling ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeftRight className="w-5 h-5" />}
        {progress === 100 || isSettling ? 'Settling...' : 'Hold to Settle'}
      </div>
    </div>
  )
}

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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: "spring" }}
                  key={b.id}
                  className="bg-black/40 glass-inner backdrop-blur-2xl rounded-[2rem] p-5 flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-rose-500/20">
                        {b.friendName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-xl tracking-tight">{b.friendName}</p>
                        <p className={`text-sm font-semibold tracking-widest uppercase ${owesMe ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {owesMe ? 'Owes you' : 'You owe'}
                        </p>
                      </div>
                    </div>
                    <span className="text-4xl font-light tracking-tighter tabular-nums">
                      <span className="text-zinc-600 text-2xl mr-1">₹</span>{absAmount}
                    </span>
                  </div>

                  <HoldToSettleButton 
                    onSettle={() => handleSettle(b.friendId, b.amount)} 
                    isSettling={settling === b.friendId} 
                  />
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
