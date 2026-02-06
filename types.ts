
export interface User {
  username: string;
  fullName: string;
  shares: number;
  shareValue: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: 'Market' | 'Internal' | 'Report';
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  amount: number;
  status: 'PENDING' | 'COMPLETED';
  timestamp: Date;
}
