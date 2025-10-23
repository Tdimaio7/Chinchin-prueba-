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
  // Usamos CoinGecko API pública (no requiere API key)
  private COINGECKO_MARKETS = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h';

  constructor(private http: HttpClient) {}

  fetchMarket(): Observable<CryptoItem[]> {
    return this.http.get<any[]>(this.COINGECKO_MARKETS).pipe(
      map(list => list.map(i => ({ id: i.id, symbol: i.symbol, name: i.name, current_price: i.current_price, price_change_percentage_24h: i.price_change_percentage_24h })) as CryptoItem[]),
      catchError(() => of(this.mockData()))
    );
  }

  fetchMarketChart(id: string, days = 30): Observable<{ prices: number[][] } | null> {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
    return this.http.get<any>(url).pipe(
      map(r => ({ prices: r.prices })),
      catchError(() => of(null))
    );
  }

  // Detalle del coin (market data, volumen, market cap)
  fetchCoinById(id: string): Observable<any | null> {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true`;
    return this.http.get<any>(url).pipe(catchError(() => of(null)));
  }

  // Datos mock en caso de fallo de la API
  private mockData(): CryptoItem[] {
    return [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 60000, price_change_percentage_24h: 1.2 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3500, price_change_percentage_24h: -0.5 },
      { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1.0, price_change_percentage_24h: 0.0 }
    ];
  }
}
