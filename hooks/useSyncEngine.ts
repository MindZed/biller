import { useEffect } from 'react'
import { db } from '../lib/db/client-db'
import { syncPendingSpends } from '../app/actions/sync'

export function useSyncEngine() {
  const handleSync = async () => {
    if (!navigator.onLine) return

    try {
      const pendingSpends = await db.spends.where('syncStatus').equals('pending').toArray()
      if (pendingSpends.length === 0) return

      const trips = await db.trips.toArray()
      if (trips.length === 0) return

      // Group spends by tripId
      const spendsByTrip = pendingSpends.reduce((acc, spend) => {
        if (!acc[spend.tripId]) acc[spend.tripId] = []
        acc[spend.tripId].push(spend)
        return acc
      }, {} as Record<string, typeof pendingSpends>)

      for (const tripId in spendsByTrip) {
        const trip = trips.find(t => t.id === tripId)
        if (!trip) continue

        const results = await syncPendingSpends(spendsByTrip[tripId], trip.name)
        for (const res of results) {
          if (res.status === 'synced') {
            await db.spends.update(res.id, { syncStatus: 'synced' })
          }
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
