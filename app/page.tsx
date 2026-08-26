"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db, ActiveBudget } from "../lib/db/client-db"
import { useSyncEngine } from "../hooks/useSyncEngine"
import { Wallet, Loader2, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getFriends } from "./actions/friends"
import BottomNav from "../components/BottomNav"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [budget, setBudget] = useState<ActiveBudget | null>(null)
  const [loadingDb, setLoadingDb] = useState(true)
  const [amount, setAmount] = useState("0")
  const [category, setCategory] = useState("Food")
  const [note, setNote] = useState("")
  const [friends, setFriends] = useState<any[]>([])
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)

  const { syncNow } = useSyncEngine()

  useEffect(() => {
    if (status === "authenticated") {
      getFriends().then(f => setFriends(f))
      db.activeBudget.toArray().then(arr => {
        if (arr.length === 0) {
          router.push("/onboard")
        } else {
          setBudget(arr[0])
          setLoadingDb(false)
        }
      })
    }
  }, [status, router])

  const handleNumpad = (num: string) => {
    setAmount(prev => prev === "0" && num !== "." ? num : prev + num)
  }

  const handleDelete = () => {
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0")
  }

  const handleSubmit = async () => {
    if (!budget || amount === "0") return
    
    await db.spends.add({
      amount: parseFloat(amount),
      category,
      note,
      timestamp: Date.now(),
      syncStatus: "pending",
      friendId: selectedFriend || undefined
    })
    
    if (navigator.vibrate) navigator.vibrate(50)
    setAmount("0")
    setNote("")
    setSelectedFriend(null)
    
    // Attempt immediate sync to sheets since we are likely online
    syncNow()
  }

  if (status === "loading" || (status === "authenticated" && loadingDb)) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center bg-zinc-950 text-white p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/20">
            <Wallet className="w-10 h-10 text-zinc-900" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
            Cost Ledger
          </h1>
          <p className="text-zinc-400 text-center mb-12 max-w-sm text-lg leading-relaxed">
            Offline-first, collaborative expense tracking synced straight to your Google Sheets.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signIn("google")}
            className="flex items-center gap-3 bg-white text-zinc-950 px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-white/10"
          >
            Sign in with Google
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    )
  }

  const categories = ["Food", "Travel", "Stay", "Activity", "Shopping", "Other"]

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-white overflow-hidden pb-[80px]">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 pb-2 shrink-0 relative z-10"
      >
        <p className="text-rose-500 text-xs font-bold uppercase tracking-widest mb-1">{budget?.type}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{budget?.name}</h1>
      </motion.header>

      <div className="flex-1 px-6 flex flex-col justify-center items-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <motion.p 
          layout
          className="text-7xl font-light tracking-tighter tabular-nums relative z-10"
        >
          <span className="text-zinc-600 mr-1">₹</span>{amount}
        </motion.p>
        
        <motion.input 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          type="text"
          placeholder="Add a note..."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-3 text-center w-full max-w-xs text-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all placeholder:text-zinc-600 relative z-10"
        />
      </div>

      {friends.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-2 relative z-10"
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar mask-edges">
            <button 
              onClick={() => setSelectedFriend(null)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${selectedFriend === null ? 'bg-zinc-100 text-black' : 'bg-black/50 border border-white/5 text-zinc-500'}`}
            >
              Just me
            </button>
            {friends.map(f => (
              <button 
                key={f.userCode}
                onClick={() => setSelectedFriend(f.userCode)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${selectedFriend === f.userCode ? 'bg-rose-600 text-white' : 'bg-black/50 border border-white/5 text-zinc-500'}`}
              >
                Split with {f.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 shrink-0"
      >
        <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar mask-edges">
          {categories.map(c => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={c}
              onClick={() => setCategory(c)}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap font-semibold transition-all ${
                category === c 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25' 
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {c}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="p-6 bg-zinc-900/80 rounded-t-[40px] backdrop-blur-2xl border-t border-zinc-800/50 shadow-2xl"
      >
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <motion.button
              whileTap={{ scale: 0.9 }}
              key={num}
              onClick={() => handleNumpad(num.toString())}
              className="h-16 text-2xl font-medium bg-zinc-800/40 rounded-2xl hover:bg-zinc-700/50 transition-colors"
            >
              {num}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumpad(".")}
            className="h-16 text-2xl font-medium bg-zinc-800/40 rounded-2xl hover:bg-zinc-700/50 transition-colors"
          >
            .
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumpad("0")}
            className="h-16 text-2xl font-medium bg-zinc-800/40 rounded-2xl hover:bg-zinc-700/50 transition-colors"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            className="h-16 text-xl font-medium bg-zinc-800/40 rounded-2xl hover:bg-zinc-700/50 transition-colors text-zinc-400"
          >
            DEL
          </motion.button>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={amount === "0"}
          className="w-full bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-lg py-5 rounded-[24px] shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-5 h-5" />
          Add Expense
        </button>
      </motion.div>

      <BottomNav />
    </div>
  )
}
