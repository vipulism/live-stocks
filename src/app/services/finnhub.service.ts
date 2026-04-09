import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, mergeMap, Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  FinnhubPriceMetricRaw,
  FinnhubProfileRaw,
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
  private readonly trackedSymbols = new Set<string>();

  constructor(private http: HttpClient) { }

  /**
   * Opens a websocket connection and subscribes to the provided symbols.
   */
  connect(stockSymbols: string[] = []): Observable<FinnhubTradeMessage> {
    return new Observable(observer => {
      this.disconnect();
      this.trackedSymbols.clear();
      stockSymbols
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => symbol.length > 0)
        .forEach((symbol) => this.trackedSymbols.add(symbol));

      this.socket = new WebSocket(
        `${this.finnhubConfig.wsUrl}?token=${this.finnhubConfig.token}`
      );

      this.socket.onopen = () => {
        this.trackedSymbols.forEach(symbol => {
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
        this.trackedSymbols.clear();
        observer.complete();
      };

      return () => this.disconnect();
    });
  }

  /**
   * Subscribes to one symbol on the current websocket session.
   */
  addSymbol(symbol: string): void {
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (normalizedSymbol.length === 0 || this.trackedSymbols.has(normalizedSymbol)) {
      return;
    }

    this.trackedSymbols.add(normalizedSymbol);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        symbol: normalizedSymbol,
      }));
    }
  }

  /**
   * Unsubscribes one symbol from the current websocket session.
   */
  removeSymbol(symbol: string): void {
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (normalizedSymbol.length === 0 || !this.trackedSymbols.has(normalizedSymbol)) {
      return;
    }

    this.trackedSymbols.delete(normalizedSymbol);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'unsubscribe',
        symbol: normalizedSymbol,
      }));
    }
  }

  /**
   * Closes the current websocket connection and clears tracked symbols.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.trackedSymbols.clear();
  }

  getQuote(symbol: string): Observable<StockQuote> {
    const params = new HttpParams()
      .set('symbol', symbol)
      .set('token', this.finnhubConfig.token);

    return this.getPriceMetric(symbol).pipe(
      mergeMap((priceMetric) => this.http.get<FinnhubQuoteRaw>(
        `${this.finnhubConfig.restBaseUrl}/quote`,
        { params }
      ).pipe(map((quote) => ({ ...this.mapQuote(quote, symbol, priceMetric) })))
      )
    );
  }

  getQuotes(symbols: string[]): Observable<StockQuote[]> {
    if (symbols.length === 0) {
      return of([]);
    }
    return forkJoin(symbols.map((symbol) => this.getQuote(symbol)));
  }

  getPriceMetric(symbol: string): Observable<FinnhubPriceMetricRaw> {
    const params = new HttpParams()
      .set('symbol', symbol)
      .set('token', this.finnhubConfig.token);

    return this.http.get<FinnhubPriceMetricRaw>(
      `${this.finnhubConfig.restBaseUrl}/stock/price-metric`,
      { params }
    ).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 403) {
          // fallback to mock data if the Premium API is access limit exceeded
          return of(this.mockPriceMetric());
        }
        return throwError(() => err);
      })
    );
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private mapTrade(trade: FinnhubTradeRaw): StockTrade {
    return {
      conditions: trade.c,
      price: this.roundToTwoDecimals(trade.p),
      symbol: trade.s,
      timestamp: trade.t,
      volume: trade.v,
    };
  }

  private mapQuote(quote: FinnhubQuoteRaw, symbol: string, priceMetric: FinnhubPriceMetricRaw): StockQuote {
    const change = this.roundToTwoDecimals(quote.d);

    return {
      price: this.roundToTwoDecimals(quote.c),
      change,
      percentChange: this.roundToTwoDecimals(quote.dp),
      high: this.roundToTwoDecimals(quote.h),
      low: this.roundToTwoDecimals(quote.l),
      open: this.roundToTwoDecimals(quote.o),
      previousClose: this.roundToTwoDecimals(quote.pc),
      timestamp: quote.t,
      symbol: symbol,
      state: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
      fiftyTwoWeekHigh: priceMetric["52WeekHigh"],
      fiftyTwoWeekLow: priceMetric["52WeekLow"],

    };
  }


  private mockPriceMetric(): FinnhubPriceMetricRaw {
    return { '52WeekHigh': 100, '52WeekLow': 50 };
  }
}