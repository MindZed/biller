import { useEffect } from 'react'
import { db } from '../lib/db/client-db'
import { syncPendingSpends } from '../app/actions/sync'

export function useSyncEngine() {
  const handleSync = async () => {
    if (!navigator.onLine) return

    try {
      const pendingSpends = await db.spends.where('syncStatus').equals('pending').toArray()
      if (pendingSpends.length === 0) return

      const activeBudgetArr = await db.activeBudget.toArray()
      if (activeBudgetArr.length === 0) return
      
      const activeBudget = activeBudgetArr[0]

      // Sync to server action
      const results = await syncPendingSpends(pendingSpends, activeBudget.name)

      // Update Dexie statuses
      for (const res of results) {
        if (res.status === 'synced') {
          await db.spends.update(res.id, { syncStatus: 'synced' })
        }
      }
    } catch (error) {
      console.error("Sync Engine Error:", error)
    }
  }
  useEffect(() => {
    // Attempt sync on mount
    handleSync()

    // Setup listeners
    window.addEventListener('online', handleSync)
    const interval = setInterval(handleSync, 60000) // Also poll every 60s

    return () => {
      window.removeEventListener('online', handleSync)
      clearInterval(interval)
    }
  }, [])

  return { syncNow: handleSync }
}
