"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { db, Spend } from "../../lib/db/client-db"
import BottomNav from "../../components/BottomNav"
import { History as HistoryIcon, Clock, CheckCircle2, PieChart as PieChartIcon, List as ListIcon, X, Pencil } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { getFriends } from "../actions/friends"

type SplitMode = "split_equal" | "friend_owes_full" | "i_owe_full"
const CATEGORIES = ["Food", "Travel", "Stay", "Activity", "Shopping", "Other"]

export default function HistoryPage() {
  const [spends, setSpends] = useState<Spend[]>([])
  const [viewMode, setViewMode] = useState<"list" | "chart">("list")
  const [friends, setFriends] = useState<any[]>([])
  const [editingSpend, setEditingSpend] = useState<Spend | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editNote, setEditNote] = useState("")
  const [editCategory, setEditCategory] = useState("Food")
  const [editFriendId, setEditFriendId] = useState<string | null>(null)
  const [editSplitMode, setEditSplitMode] = useState<SplitMode>("split_equal")

  const loadSpends = () => {
    db.spends.orderBy('timestamp').reverse().toArray().then(s => setSpends(s))
  }

  useEffect(() => {
    loadSpends()
    getFriends().then(setFriends)
  }, [])

  const totalSpent = spends.reduce((acc, curr) => acc + curr.amount, 0)

  // Chart data aggregation
  const aggregatedData = spends.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(aggregatedData).map(([name, value]) => ({ name, value }))
  
  const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fff1f2', '#fecdd3']
  const friendNameByCode = new Map(friends.map(f => [f.userCode, f.name]))

  const openEdit = (spend: Spend) => {
    setEditingSpend(spend)
    setEditAmount(String(spend.amount))
    setEditNote(spend.note || "")
    setEditCategory(spend.category)
    setEditFriendId(spend.friendId || null)
    setEditSplitMode((spend.splitMode || "split_equal") as SplitMode)
  }

  const saveEdit = async () => {
    if (!editingSpend?.id) return
    const parsed = parseFloat(editAmount)
    if (!Number.isFinite(parsed) || parsed <= 0) return

    await db.spends.update(editingSpend.id, {
      amount: parsed,
      note: editNote.trim(),
      category: editCategory,
      friendId: editFriendId || undefined,
      splitMode: editFriendId ? editSplitMode : undefined,
      resyncOnly: true,
      syncStatus: "pending"
    })
    setEditingSpend(null)
    loadSpends()
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-white overflow-hidden pb-[80px] relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <header className="p-6 pt-12 pb-6 shrink-0 border-b border-white/10 bg-black/50 backdrop-blur-xl relative z-20 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Ledger</h1>
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
                <div key={entry.name} className="bg-black/40 glass-inner backdrop-blur-2xl rounded-3xl p-5 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <p className="text-sm font-bold tracking-widest uppercase text-zinc-500">{entry.name}</p>
                  </div>
                  <p className="text-2xl font-light tracking-tighter tabular-nums text-white">₹{entry.value}</p>
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
                className="bg-black/40 glass-inner backdrop-blur-2xl rounded-[2rem] p-5 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xl tracking-tight">{s.category}</span>
                    {s.friendId && (
                      <span className="text-[10px] uppercase tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                        {friendNameByCode.get(s.friendId) || s.friendId}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm font-medium">
                    {s.note || "No note"} • {new Date(s.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-light tracking-tighter tabular-nums text-rose-500">
                    <span className="text-zinc-600 mr-1 text-lg">₹</span>{s.amount}
                  </span>
                  <button
                    onClick={() => openEdit(s)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-300 bg-white/5 px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
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

      <AnimatePresence>
        {editingSpend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-6 flex items-center justify-center"
          >
            <motion.div
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.96 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Edit expense</h2>
                <button onClick={() => setEditingSpend(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                inputMode="decimal"
                placeholder="Amount"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500/60"
              />

              <input
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="Note"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500/60"
              />

              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setEditCategory(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${editCategory === c ? "bg-rose-600 text-white" : "bg-white/5 text-zinc-300"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setEditFriendId(null)
                    setEditSplitMode("split_equal")
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${editFriendId === null ? "bg-white text-black" : "bg-white/5 text-zinc-300"}`}
                >
                  Just me
                </button>
                {friends.map(f => (
                  <button
                    key={f.userCode}
                    onClick={() => setEditFriendId(f.userCode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${editFriendId === f.userCode ? "bg-rose-600 text-white" : "bg-white/5 text-zinc-300"}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {editFriendId && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setEditSplitMode("split_equal")}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${editSplitMode === "split_equal" ? "bg-emerald-600 text-white" : "bg-white/5 text-zinc-300"}`}
                  >
                    Split 50-50
                  </button>
                  <button
                    onClick={() => setEditSplitMode("friend_owes_full")}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${editSplitMode === "friend_owes_full" ? "bg-rose-600 text-white" : "bg-white/5 text-zinc-300"}`}
                  >
                    I paid full
                  </button>
                  <button
                    onClick={() => setEditSplitMode("i_owe_full")}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${editSplitMode === "i_owe_full" ? "bg-amber-600 text-white" : "bg-white/5 text-zinc-300"}`}
                  >
                    Friend paid full
                  </button>
                </div>
              )}

              <button
                onClick={saveEdit}
                className="w-full bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold py-2.5 rounded-xl"
              >
                Save changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
