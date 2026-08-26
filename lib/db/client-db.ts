import Dexie, { Table } from 'dexie';

export interface Spend {
  id?: string;
  amount: number;
  category: string;
  note?: string;
  timestamp: number;
  friendId?: string; 
  tripId: string;
  syncStatus: 'pending' | 'synced';
}

export interface Trip {
  id: string; // matches Google Sheet Tab ID or name
  name: string;
  type: string;
  totalBudget?: number;
  lastOpenedAt: number;
}

export class LedgerDB extends Dexie {
  spends!: Table<Spend>;
  trips!: Table<Trip>;

  constructor() {
    super('CostLedgerDB');
    
    this.version(1).stores({
      spends: '++id, timestamp, syncStatus',
      activeBudget: 'id'
    });

    this.version(2).stores({
      spends: '++id, timestamp, syncStatus, tripId',
      trips: 'id, lastOpenedAt',
      activeBudget: null // Delete old table
    }).upgrade(async tx => {
      // Migrate existing active budget to trips
      const oldBudgets = await tx.table('activeBudget').toArray();
      if (oldBudgets.length > 0) {
        const trip = {
          ...oldBudgets[0],
          lastOpenedAt: Date.now()
        };
        await tx.table('trips').add(trip);
        // Update all spends to have this tripId
        await tx.table('spends').toCollection().modify({ tripId: trip.id });
      }
    });
  }
}

export const db = new LedgerDB();
