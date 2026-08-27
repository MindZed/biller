"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, Copy, Check, Plus, Loader2 } from "lucide-react"
import { getMyUserCode, getFriends, addFriend } from "../actions/friends"
import BottomNav from "../../components/BottomNav"

export default function Friends() {
  const [myCode, setMyCode] = useState("")
  const [friends, setFriends] = useState<any[]>([])
  const [loadingCode, setLoadingCode] = useState(true)
  const [copied, setCopied] = useState(false)

  const [newFriendCode, setNewFriendCode] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getMyUserCode().then(code => {
      setMyCode(code || "")
      setLoadingCode(false)
    })
    getFriends().then(f => setFriends(f))
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFriendCode || newFriendCode.length < 6) return
    setAdding(true)
    setError("")

    const result = await addFriend(newFriendCode.toUpperCase())
    if (!result.success) {
      setError(result.error || "Failed to add friend.")
      setAdding(false)
      return
    }

    try {
      setNewFriendCode("")
      const updatedFriends = await getFriends()
      setFriends(updatedFriends)
    } catch {
      setError("Friend added, but failed to refresh list. Please reload.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-white overflow-hidden pb-[80px] relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <header className="p-6 pt-12 pb-4 shrink-0 relative z-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Friends</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 hide-scrollbar relative z-10">
        {/* My Code Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 glass-inner backdrop-blur-2xl rounded-[2rem] p-6 mb-8 flex items-center justify-between"
        >
          <div>
            <p className="text-rose-500/80 text-sm font-semibold uppercase tracking-widest mb-1">Your Link Code</p>
            {loadingCode ? (
              <div className="h-8 w-24 bg-zinc-900 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-black tracking-widest text-rose-500">{myCode}</p>
            )}
          </div>
          <button 
            onClick={copyCode}
            className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500/20 transition-colors"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </motion.div>

        {/* Add Friend Form */}
        <motion.form 
          onSubmit={handleAddFriend}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-3">
            <input 
              type="text"
              placeholder="Enter Friend Code"
              maxLength={6}
              value={newFriendCode}
              onChange={e => setNewFriendCode(e.target.value.toUpperCase())}
              className="flex-1 bg-black/40 glass-inner backdrop-blur-xl rounded-2xl px-5 py-4 font-bold tracking-widest uppercase focus:outline-none focus:bg-black/60 transition-colors placeholder:text-zinc-600 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
            />
            <button 
              disabled={adding || newFriendCode.length < 6}
              type="submit"
              className="w-16 flex items-center justify-center bg-white text-zinc-950 rounded-2xl disabled:opacity-50 transition-opacity shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {adding ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2 font-medium ml-2">{error}</p>}
        </motion.form>

        {/* Friends List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-4 text-zinc-300">Your Linked Friends</h2>
          {friends.length === 0 ? (
            <div className="bg-zinc-900/50 rounded-3xl p-8 flex flex-col items-center text-center">
              <Users className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-zinc-500 font-medium">You haven't added any friends yet. Add a friend to start splitting expenses!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-8">
              {friends.map((f: any, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center gap-3 bg-black/40 glass-inner backdrop-blur-xl rounded-[2rem] p-5">
                  <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-rose-500/20">
                    {f.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-lg tracking-tight">{f.name}</p>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">#{f.userCode}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      <BottomNav />
    </div>
  )
}
