import Dexie, { Table } from 'dexie';

export interface Spend {
  id?: string;
  amount: number;
  category: string;
  note?: string;
  timestamp: number;
  friendId?: string; 
  syncStatus: 'pending' | 'synced';
}

export interface ActiveBudget {
  id: string; // matches Google Sheet Tab ID or name
  name: string;
  type: string;
  totalBudget: number;
}

export class LedgerDB extends Dexie {
  spends!: Table<Spend>;
  activeBudget!: Table<ActiveBudget>;

  constructor() {
    super('CostLedgerDB');
    this.version(1).stores({
      spends: '++id, timestamp, syncStatus',
      activeBudget: 'id'
    });
  }
}

export const db = new LedgerDB();
