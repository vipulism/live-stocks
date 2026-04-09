import { vi } from 'vitest';
import { App } from './app';
import { FinnhubService } from './services/finnhub.service';
import { MockService } from './services/mock.service';
import { StockQuote, StockTrade } from './services/finnhub.types';

describe('App', () => {
  let app: App;

  beforeEach(() => {
    const stockServiceStub = {
      disconnect: vi.fn(),
      getQuotes: vi.fn(),
      connect: vi.fn(),
      addSymbol: vi.fn(),
      removeSymbol: vi.fn(),
      getQuote: vi.fn(),
      getProfile: vi.fn(),
    } as unknown as FinnhubService;
    const mockServiceStub = {
      disconnect: vi.fn(),
      getQuotes: vi.fn(),
      connect: vi.fn(),
      addSymbol: vi.fn(),
    } as unknown as MockService;

    app = new App(stockServiceStub, mockServiceStub);
  });

  it('updates only the matching symbol when a trade is received', () => {
    const initialStocks: StockQuote[] = [
      {
        symbol: 'AAPL',
        price: 100,
        change: 1,
        percentChange: 1,
        high: 101,
        low: 99,
        open: 100,
        previousClose: 99,
        timestamp: 1,
        state: 'same',
        fiftyTwoWeekHigh: 200,
        fiftyTwoWeekLow: 50,
      },
      {
        symbol: 'MSFT',
        price: 300,
        change: 2,
        percentChange: 0.5,
        high: 305,
        low: 295,
        open: 299,
        previousClose: 298,
        timestamp: 1,
        state: 'up',
        fiftyTwoWeekHigh: 400,
        fiftyTwoWeekLow: 200,
      },
    ];
    const trades: StockTrade[] = [
      {
        symbol: 'AAPL',
        price: 101,
        conditions: ['X'],
        timestamp: 2,
        volume: 1000,
      },
    ];

    app.stockList.set(initialStocks);
    app.updateStocks(trades);

    const updated = app.stockList();
    expect(updated[0].symbol).toBe('AAPL');
    expect(updated[0].price).toBe(101);
    expect(updated[0].state).toBe('up');
    expect(updated[1]).toEqual(initialStocks[1]);
  });

  it('does not update a stock when it is disabled', () => {
    const disabledStock: StockQuote = {
      symbol: 'AAPL',
      price: 100,
      change: 1,
      percentChange: 1,
      high: 101,
      low: 99,
      open: 100,
      previousClose: 99,
      timestamp: 1,
      state: 'same',
      disabled: true,
      fiftyTwoWeekHigh: 200,
      fiftyTwoWeekLow: 50,
    };
    const trade: StockTrade = {
      symbol: 'AAPL',
      price: 105,
      conditions: ['X'],
      timestamp: 2,
      volume: 1100,
    };

    app.stockList.set([disabledStock]);
    app.updateStocks([trade]);

    expect(app.stockList()[0]).toEqual(disabledStock);
  });
}); 
