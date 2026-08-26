"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react"
import { db } from "../../lib/db/client-db"
import { createBudget } from "../actions/sync"

export default function Onboard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("Event")
  const [peopleCount, setPeopleCount] = useState("1")

  const handleNext = () => {
    if (step < 3) setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      // Create on server (Google Sheets API)
      const { sheetId, tabName } = await createBudget(name, type)

      // Store locally
      await db.activeBudget.clear()
      await db.activeBudget.add({
        id: tabName, // We use tabName as ID for simpler syncing
        name,
        type,
        totalBudget: 0
      })

      router.push("/")
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const types = ["Trip", "Daily", "Event", "Monthly"]

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-white overflow-hidden p-6">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <header className="flex items-center justify-between mt-4 relative z-10">
        {step > 1 ? (
          <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
        ) : <div className="w-10" />}
        <div className="text-zinc-500 text-sm font-semibold tracking-widest uppercase">
          Step {step} of 3
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <h1 className="text-4xl font-extrabold mb-8 tracking-tight">Name your ledger</h1>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Trip to Goa"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-transparent border-b-2 border-zinc-800 text-3xl pb-4 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-700"
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <h1 className="text-4xl font-extrabold mb-8 tracking-tight">What kind of ledger?</h1>
              <div className="grid grid-cols-2 gap-4">
                {types.map(t => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={t}
                    onClick={() => setType(t)}
                    className={`p-6 rounded-3xl text-left font-bold text-xl border-2 transition-all ${
                      type === t 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <h1 className="text-4xl font-extrabold mb-4 tracking-tight">How many people?</h1>
              <p className="text-zinc-400 mb-8">Including you, how many people are in this ledger?</p>
              
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setPeopleCount(p => Math.max(1, parseInt(p)-1).toString())}
                  className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl active:bg-zinc-800"
                >
                  -
                </button>
                <div className="text-5xl font-black tabular-nums flex-1 text-center text-emerald-400">
                  {peopleCount}
                </div>
                <button 
                  onClick={() => setPeopleCount(p => (parseInt(p)+1).toString())}
                  className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl active:bg-zinc-800"
                >
                  +
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pb-8 relative z-10">
        {step < 3 ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!name.trim()}
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 h-16 bg-white text-zinc-950 text-xl font-bold rounded-2xl disabled:opacity-30 transition-all"
          >
            Continue
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 h-16 bg-gradient-to-r from-emerald-400 to-cyan-500 text-zinc-950 text-xl font-bold rounded-2xl disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Ledger"}
          </motion.button>
        )}
      </div>
    </div>
  )
}
