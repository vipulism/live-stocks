import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  FinnhubQuoteRaw,
  FinnhubTradeMessage,
  FinnhubTradeMessageRaw,
  FinnhubTradeRaw,
  StockQuote,
  StockTrade,
} from './finnhub.types';

@Injectable({
  providedIn: 'root',
})
/**
 * Handles Finnhub REST and websocket market data communication.
 */
export class FinnhubService {
  private readonly finnhubConfig = environment.finnhub;
  private socket: WebSocket | null = null;

  constructor(private http: HttpClient) { }

  connect(stockSymbols: string[] = []): Observable<FinnhubTradeMessage> {
    return new Observable(observer => {
      this.disconnect();

      this.socket = new WebSocket(
        `${this.finnhubConfig.wsUrl}?token=${this.finnhubConfig.token}`
      );

      this.socket.onopen = () => {
        stockSymbols.forEach(symbol => {
          this.socket?.send(JSON.stringify({
            type: 'subscribe',
            symbol,
          }));
        });
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data) as FinnhubTradeMessageRaw;
        observer.next({
          type: data.type,
          data: data.data?.map((trade) => this.mapTrade(trade)),
        });
      };

      this.socket.onerror = (error) => observer.error(error);
      this.socket.onclose = () => {
        this.socket = null;
        observer.complete();
      };

      return () => this.disconnect();
    });
  }


  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }


  getQuote(symbol: string): Observable<StockQuote> {
    const params = new HttpParams()
      .set('symbol', symbol)
      .set('token', this.finnhubConfig.token);

    return this.http.get<FinnhubQuoteRaw>(
      `${this.finnhubConfig.restBaseUrl}/quote`,
      { params }
    ).pipe(map((quote) => ({ ...this.mapQuote(quote, symbol) })));
  }

  getQuotes(symbols: string[]): Observable<StockQuote[]> {
    if (symbols.length === 0) {
      return of([]);
    }
    return forkJoin(symbols.map((symbol) => this.getQuote(symbol)));
  }

  private mapTrade(trade: FinnhubTradeRaw): StockTrade {
    return {
      conditions: trade.c,
      price: trade.p,
      symbol: trade.s,
      timestamp: trade.t,
      volume: trade.v,
    };
  }

  private mapQuote(quote: FinnhubQuoteRaw, symbol: string): StockQuote {
    return {
      price: quote.c,
      change: quote.d,
      percentChange: quote.dp,
      high: quote.h,
      low: quote.l,
      open: quote.o,
      previousClose: quote.pc,
      timestamp: quote.t,
      symbol: symbol,
      state: quote.d > 0 ? 'up' : quote.d < 0 ? 'down' : 'same',
    };
  }
}
