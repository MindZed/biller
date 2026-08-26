"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { db, Trip, Spend } from "../lib/db/client-db"
import { useSyncEngine } from "../hooks/useSyncEngine"
import { Wallet, Loader2, ArrowRight, ChevronDown, Plus, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getFriends } from "./actions/friends"
import BottomNav from "../components/BottomNav"
import Image from "next/image"

const WITTY_TEXTS = [
  "Again a spend?",
  "Hell na, too much spends.",
  "Another one?",
  "Swipe that card!",
  "Oops, money gone.",
  "Treat yo self?",
  "Ouch, my wallet."
]

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Data State
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [recentSpends, setRecentSpends] = useState<Spend[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [loadingDb, setLoadingDb] = useState(true)

  // UI State
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false)
  const [wittyText, setWittyText] = useState("")

  // Form State
  const [amount, setAmount] = useState("0")
  const [category, setCategory] = useState("Food")
  const [note, setNote] = useState("")
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)

  const { syncNow } = useSyncEngine()

  useEffect(() => {
    setWittyText(WITTY_TEXTS[Math.floor(Math.random() * WITTY_TEXTS.length)])
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      getFriends().then(f => setFriends(f))
      loadData()
    }
  }, [status, router])

  const loadData = async () => {
    const allTrips = await db.trips.toArray()
    if (allTrips.length === 0) {
      router.push("/onboard")
      return
    }

    // Sort by last opened
    allTrips.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
    const currentTrip = allTrips[0]
    
    setTrips(allTrips)
    setActiveTrip(currentTrip)

    // Load recent 3 spends for this trip
    const spends = await db.spends
      .where('tripId').equals(currentTrip.id)
      .reverse()
      .sortBy('timestamp')
    
    setRecentSpends(spends.slice(0, 3))
    setLoadingDb(false)
  }

  const handleSwitchTrip = async (tripId: string) => {
    setLoadingDb(true)
    setIsTripDropdownOpen(false)
    await db.trips.update(tripId, { lastOpenedAt: Date.now() })
    await loadData()
  }

  const handleNumpad = (num: string) => {
    setAmount(prev => prev === "0" && num !== "." ? num : prev + num)
  }

  const handleDelete = () => {
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0")
  }

  const handleSubmit = async () => {
    if (!activeTrip || amount === "0") return
    
    await db.spends.add({
      amount: parseFloat(amount),
      category,
      note,
      timestamp: Date.now(),
      syncStatus: "pending",
      friendId: selectedFriend || undefined,
      tripId: activeTrip.id
    })
    
    if (navigator.vibrate) navigator.vibrate(50)
    setAmount("0")
    setNote("")
    setSelectedFriend(null)
    setIsAddingMode(false)
    
    // Attempt immediate sync to sheets since we are likely online
    syncNow()
    loadData() // Refresh recent spends
  }

  if (status === "loading" || (status === "authenticated" && loadingDb)) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-white relative">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center text-white p-6 relative overflow-hidden">
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
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 text-center">
            Mindzed Biller
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
          
          <div className="mt-12 flex items-center gap-6 text-sm font-medium text-zinc-500">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </motion.div>
      </div>
    )
  }

  const categories = ["Food", "Travel", "Stay", "Activity", "Shopping", "Other"]

  return (
    <div className="flex flex-col h-[100dvh] text-white overflow-hidden relative">
      
      {/* Header / Trip Switcher */}
      <header className="p-6 pt-12 shrink-0 relative z-50 flex items-center justify-center">
        <div className="relative">
          <button 
            onClick={() => setIsTripDropdownOpen(!isTripDropdownOpen)}
            className="flex items-center gap-2 bg-black/40 glass-inner backdrop-blur-xl px-5 py-3 rounded-full text-lg font-bold tracking-tight shadow-xl"
          >
            {activeTrip?.name}
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isTripDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isTripDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-64 bg-black/80 glass-inner backdrop-blur-3xl rounded-3xl p-2 shadow-2xl flex flex-col gap-1"
              >
                {trips.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => handleSwitchTrip(t.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl font-semibold transition-colors ${t.id === activeTrip?.id ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-white/5 text-zinc-300'}`}
                  >
                    {t.name}
                    {t.id === activeTrip?.id && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                  </button>
                ))}
                <div className="h-px bg-white/10 my-1 mx-2" />
                <button 
                  onClick={() => router.push('/onboard')}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-emerald-400 hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  New Ledger
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {!isAddingMode ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col items-center justify-center gap-12"
            >
              {/* Witty Text */}
              <div className="flex flex-col items-center gap-4">
                <Image src="/logo.png" alt="Logo" width={48} height={48} className="drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
                <h2 className="text-2xl font-medium tracking-tight text-zinc-400 text-center">
                  {wittyText}
                </h2>
              </div>

              {/* Magic Input Bar */}
              <button 
                onClick={() => setIsAddingMode(true)}
                className="relative w-full h-20 rounded-[2rem] p-[2px] overflow-hidden group shadow-2xl shadow-rose-900/20 transition-transform active:scale-95"
              >
                <div className="glow-border" />
                <div className="absolute inset-[2px] bg-zinc-950/90 backdrop-blur-3xl rounded-[calc(2rem-2px)] flex items-center justify-center gap-3 glass-inner transition-colors group-hover:bg-zinc-900/90">
                  <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                    Add Expense
                  </span>
                </div>
              </button>

              {/* Recent Expenses Bento */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-500">Recent</h3>
                </div>
                <div className="bg-black/40 glass-inner backdrop-blur-xl rounded-[2rem] p-4 flex flex-col gap-3">
                  {recentSpends.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-sm font-medium">No spends yet in this trip.</div>
                  ) : (
                    recentSpends.map(spend => (
                      <div key={spend.id} className="flex items-center justify-between bg-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
                            {spend.category.slice(0,2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold">{spend.category}</span>
                            {spend.note && <span className="text-xs text-zinc-500">{spend.note}</span>}
                          </div>
                        </div>
                        <span className="font-black text-lg">₹{spend.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="adding"
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col bg-zinc-950/95 backdrop-blur-3xl z-40 pb-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 shrink-0">
                <p className="text-rose-500 font-bold tracking-widest uppercase text-sm">New Expense</p>
                <button 
                  onClick={() => setIsAddingMode(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center px-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
                
                <motion.p 
                  layout
                  className="text-7xl font-light tracking-tighter tabular-nums relative z-10"
                >
                  <span className="text-zinc-600 mr-1 text-4xl">₹</span>{amount}
                </motion.p>
                
                <input 
                  type="text"
                  placeholder="What was this for?"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="mt-4 bg-black/50 border border-white/10 rounded-2xl px-6 py-3 text-center w-full max-w-sm text-lg focus:outline-none focus:border-rose-500/50 transition-all placeholder:text-zinc-600 relative z-10 shadow-xl"
                />
              </div>

              {friends.length > 0 && (
                <div className="px-6 py-2 relative z-10 shrink-0">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mask-edges pb-2">
                    <button 
                      onClick={() => setSelectedFriend(null)}
                      className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-colors ${selectedFriend === null ? 'bg-white text-black' : 'bg-black/50 glass-inner text-zinc-400'}`}
                    >
                      Just me
                    </button>
                    {friends.map(f => (
                      <button 
                        key={f.userCode}
                        onClick={() => setSelectedFriend(f.userCode)}
                        className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${selectedFriend === f.userCode ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 'bg-black/50 glass-inner text-zinc-400'}`}
                      >
                        Split with {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-6 py-2 shrink-0">
                <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar mask-edges">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold transition-all ${
                        category === c 
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25' 
                          : 'bg-black/40 glass-inner text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-2 shrink-0">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      onClick={() => handleNumpad(num.toString())}
                      className="h-14 text-2xl font-medium bg-white/5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => handleNumpad(".")}
                    className="h-14 text-2xl font-medium bg-white/5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors flex items-center justify-center"
                  >
                    .
                  </button>
                  <button
                    onClick={() => handleNumpad("0")}
                    className="h-14 text-2xl font-medium bg-white/5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    onClick={handleDelete}
                    className="h-14 text-lg font-bold text-rose-500 bg-rose-500/10 rounded-full hover:bg-rose-500/20 active:bg-rose-500/30 transition-colors flex items-center justify-center"
                  >
                    DEL
                  </button>
                </div>
                
                <button 
                  onClick={handleSubmit}
                  disabled={amount === "0"}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-lg py-4 rounded-[1.5rem] shadow-[0_0_30px_-10px_rgba(225,29,72,0.5)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ArrowRight className="w-6 h-6" />
                  Add Expense
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isAddingMode && <BottomNav />}
    </div>
  )
}
