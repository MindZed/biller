"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, History, Users, ArrowLeftRight } from "lucide-react"
import { motion } from "framer-motion"

export default function BottomNav() {
  const pathname = usePathname()

  const navs = [
    { name: "Home", href: "/", icon: Home },
    { name: "History", href: "/history", icon: History },
    { name: "Settle", href: "/balances", icon: ArrowLeftRight },
    { name: "Friends", href: "/friends", icon: Users },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-[70px] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50 rounded-full flex items-center justify-around px-2 z-50">
      {navs.map(n => {
        const isActive = pathname === n.href
        const Icon = n.icon
        
        return (
          <Link key={n.name} href={n.href} className="relative flex flex-col items-center justify-center gap-1 w-16 h-full group">
            {isActive && (
              <motion.div 
                layoutId="nav-pill"
                className="absolute inset-0 bg-white/5 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className={`w-6 h-6 transition-colors relative z-10 ${isActive ? 'text-rose-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <span className={`text-[10px] font-bold transition-colors relative z-10 ${isActive ? 'text-rose-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
              {n.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
