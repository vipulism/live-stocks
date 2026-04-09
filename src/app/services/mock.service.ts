import { Injectable } from '@angular/core';
import { FinnhubTradeMessage, StockQuote, StockTrade } from './finnhub.types';
import { interval, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MockService {
  private readonly trackedSymbols = new Set<string>();
  private readonly symbolState = new Map<string, StockTrade>();
  private readonly seedPrices: Record<string, number> = {
    AAPL: 182,
    GOOGL: 174,
    MSFT: 420,
    TSLA: 172,
  };
  /**
   * Starts a fake market stream and emits trade messages periodically.
   */
  connect(stockSymbols: string[] = []): Observable<FinnhubTradeMessage> {
    this.disconnect();
    stockSymbols
      .map((symbol) => symbol.trim().toUpperCase())
      .filter((symbol) => symbol.length > 0)
      .forEach((symbol) => this.addSymbol(symbol));
    return interval(2500).pipe(
      map(() => ({
        type: 'trade',
        data: this.buildTrades(),
      }))
    );
  }
  /**
   * Adds one symbol to the simulated stream.
   */
  addSymbol(symbol: string): void {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized || this.trackedSymbols.has(normalized)) {
      return;
    }
    this.trackedSymbols.add(normalized);
    if (!this.symbolState.has(normalized)) {
      this.symbolState.set(normalized, {
        price: this.seedPrices[normalized] ?? this.randomInRange(40, 400),
        conditions: ['MOCK'],
        symbol: normalized,
        timestamp: Date.now(),
        volume: Math.floor(this.randomInRange(50, 5000)),
      });
    }
  }

  /**
   * Stops the simulated stream and clears state.
   */
  disconnect(): void {
    this.trackedSymbols.clear();
    this.symbolState.clear();
  }

  buildTrades(): StockTrade[] {
    const now = Date.now();
    const symbols = Array.from(this.trackedSymbols);
    // Pick unique random symbols each tick.
    const selectedSymbols = symbols
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(this.randomInRange(1, 3), symbols.length));

    return selectedSymbols.map((symbol) => {
      const previous =
        this.symbolState.get(symbol)?.price ?? this.randomInRange(40, 400);
      const next = this.roundToTwoDecimals(
        Math.max(1, previous + this.randomInRange(-2.5, 2.5))
      );
      const trade: StockTrade = {
        price: next,
        conditions: ['MOCK'],
        symbol,
        timestamp: now,
        volume: Math.floor(this.randomInRange(50, 5000)),
      };
      this.symbolState.set(symbol, trade);
      return trade;
    });
  }

  getQuotes(): StockQuote[] {
    return Array.from(this.symbolState.values()).map((trade) => ({
      price: trade.price,
      change: 0,
      percentChange: 0,
      high: trade.price,
      low: trade.price,
      open: trade.price,
      previousClose: trade.price,
      timestamp: trade.timestamp,
      symbol: trade.symbol,
      state: this.randomInRange(0, 1) > 0.5 ? 'up' : 'down',
      fiftyTwoWeekHigh: Number(this.randomInRange(100, 1000).toFixed(2)),
      fiftyTwoWeekLow: Number(this.randomInRange(10, 100).toFixed(2)),
    }));
  }

  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
