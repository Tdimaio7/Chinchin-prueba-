/**
 * CryptoService
 * - Encapsula llamadas externas a CoinGecko para obtener mercados, detalles y series históricas.
 * - Implementa fallback a datos mock en caso de error de red o rate-limits.
 *
 * Contrato:
 * - fetchMarket(): Observable<CryptoItem[]>
 * - fetchMarketChart(id, days): Observable<{prices: number[][]} | null>
 * - fetchCoinById(id): Observable<any | null>
 *
 * Seguridad:
 * - No envía credenciales; consume API pública de CoinGecko.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CryptoItem {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private COINGECKO_MARKETS = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h';
  private FIXED_PTR_PRICE = 60;
  private FIXED_BS_PRICE = +(1 / 37.85).toFixed(8);

  constructor(private http: HttpClient) {}

  fetchMarket(): Observable<CryptoItem[]> {
    return this.http.get<any[]>(this.COINGECKO_MARKETS).pipe(
      map(list => {
        const mapped = list.map(i => ({ id: i.id, symbol: i.symbol, name: i.name, current_price: i.current_price, price_change_percentage_24h: i.price_change_percentage_24h })) as CryptoItem[];
        return this.ensureFixedRates(mapped);
      }),
      catchError(() => of(this.ensureFixedRates(this.mockData())))
    );
  }

  fetchMarketChart(id: string, days = 30): Observable<{ prices: number[][] } | null> {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
    return this.http.get<any>(url).pipe(
      map(r => ({ prices: r.prices })),
      catchError(() => of(null))
    );
  }

  fetchCoinById(id: string): Observable<any | null> {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true`;
    return this.http.get<any>(url).pipe(catchError(() => of(null)));
  }

  private mockData(): CryptoItem[] {
    return [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 60000, price_change_percentage_24h: 1.2 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3500, price_change_percentage_24h: -0.5 },
      { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1.0, price_change_percentage_24h: 0.0 },
      { id: 'ptr', symbol: 'ptr', name: 'PTR', current_price: this.FIXED_PTR_PRICE, price_change_percentage_24h: 0 },
      { id: 'bs', symbol: 'bs', name: 'Bolívar (BS)', current_price: this.FIXED_BS_PRICE, price_change_percentage_24h: 0 }
    ];
  }

  private ensureFixedRates(list: CryptoItem[]): CryptoItem[] {
    const out = list.slice();
    if (!out.find(i => i.id === 'ptr' || i.symbol?.toLowerCase() === 'ptr')) {
      out.push({ id: 'ptr', symbol: 'ptr', name: 'PTR', current_price: this.FIXED_PTR_PRICE, price_change_percentage_24h: 0 });
    }
    if (!out.find(i => i.id === 'bs' || i.symbol?.toLowerCase() === 'bs')) {
      out.push({ id: 'bs', symbol: 'bs', name: 'Bolívar (BS)', current_price: this.FIXED_BS_PRICE, price_change_percentage_24h: 0 });
    }
    return out;
  }
}
