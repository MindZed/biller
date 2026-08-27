import Dexie, { Table } from 'dexie';

export interface Spend {
  id?: string | number;
  amount: number;
  category: string;
  note?: string;
  timestamp: number;
  friendId?: string; 
  splitMode?: 'split_equal' | 'friend_owes_full' | 'i_owe_full';
  resyncOnly?: boolean;
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

    this.version(3).stores({
      spends: '++id, timestamp, syncStatus, tripId',
      trips: 'id, lastOpenedAt'
    }).upgrade(async tx => {
      await tx.table('spends').toCollection().modify((spend: Spend) => {
        if (spend.friendId && !spend.splitMode) {
          spend.splitMode = 'split_equal'
        }
      })
    })
  }
}

export const db = new LedgerDB();
