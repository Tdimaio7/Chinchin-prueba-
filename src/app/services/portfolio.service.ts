import { Injectable } from '@angular/core';

export interface Balance { symbol: string; amount: number }

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  // Saldo mock del usuario
  private balances: Balance[] = [
    { symbol: 'btc', amount: 0.1234 },
    { symbol: 'eth', amount: 1.5 },
    { symbol: 'usdt', amount: 200 }
  ];

  getBalances(): Balance[] {
    return this.balances;
  }

  setBalances(bal: Balance[]) {
    this.balances = bal;
  }
}
