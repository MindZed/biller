"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, Spend } from "../../lib/db/client-db"
import BottomNav from "../../components/BottomNav"
import { History as HistoryIcon, Clock, CheckCircle2, PieChart as PieChartIcon, List as ListIcon } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

export default function HistoryPage() {
  const [spends, setSpends] = useState<Spend[]>([])
  const [viewMode, setViewMode] = useState<"list" | "chart">("list")

  useEffect(() => {
    // Load spends sorted by timestamp descending
    db.spends.orderBy('timestamp').reverse().toArray().then(s => setSpends(s))
  }, [])

  const totalSpent = spends.reduce((acc, curr) => acc + curr.amount, 0)

  // Chart data aggregation
  const aggregatedData = spends.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(aggregatedData).map(([name, value]) => ({ name, value }))
  
  const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fff1f2', '#fecdd3']

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-white overflow-hidden pb-[80px] relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <header className="p-6 pt-12 pb-6 shrink-0 border-b border-white/10 bg-black/50 backdrop-blur-xl relative z-20 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">History</h1>
          <p className="text-zinc-500 font-medium">
            Total Spent: <span className="text-white">₹{totalSpent}</span>
          </p>
        </div>
        <div className="bg-black/50 border border-white/10 rounded-full p-1 flex">
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-full transition-colors ${viewMode === "list" ? 'bg-rose-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <ListIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode("chart")}
            className={`p-2 rounded-full transition-colors ${viewMode === "chart" ? 'bg-rose-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <PieChartIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 hide-scrollbar relative z-10">
        {spends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <HistoryIcon className="w-16 h-16 mb-4 text-zinc-600" />
            <p className="text-lg">No expenses yet.</p>
          </div>
        ) : viewMode === "chart" ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full pt-10"
          >
            <div className="w-full h-64 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="bg-black/50 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <p className="text-sm font-bold text-zinc-400">{entry.name}</p>
                    <p className="text-lg font-black text-white">₹{entry.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            {spends.map((s, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={s.id || i}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{s.category}</span>
                    {s.friendId && (
                      <span className="text-[10px] uppercase tracking-widest bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                        Split: {s.friendId}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm">
                    {s.note || "No note"} • {new Date(s.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-black tabular-nums text-rose-500">
                    ₹{s.amount}
                  </span>
                  {s.syncStatus === 'synced' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Synced
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
