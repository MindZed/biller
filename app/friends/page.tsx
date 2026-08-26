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

    try {
      await addFriend(newFriendCode.toUpperCase())
      setNewFriendCode("")
      const updatedFriends = await getFriends()
      setFriends(updatedFriends)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-white overflow-hidden pb-[80px]">
      <header className="p-6 pt-12 pb-4 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight">Friends</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 hide-scrollbar">
        {/* My Code Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6 mb-8 flex items-center justify-between"
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
              className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 font-bold tracking-widest uppercase focus:outline-none focus:border-rose-500/50 transition-colors placeholder:text-zinc-600 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
            />
            <button 
              disabled={adding || newFriendCode.length < 6}
              type="submit"
              className="w-16 flex items-center justify-center bg-white text-zinc-950 rounded-2xl disabled:opacity-50 transition-opacity"
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
            <div className="flex flex-col gap-3 pb-8">
              {friends.map((f: any, i) => (
                <div key={i} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="w-12 h-12 bg-gradient-to-tr from-rose-500 to-red-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
                    {f.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-bold">{f.name}</p>
                    <p className="text-zinc-500 text-sm">#{f.userCode}</p>
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
