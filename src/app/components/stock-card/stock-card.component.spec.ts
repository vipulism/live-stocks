import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { FinnhubService } from '../../services/finnhub.service';
import { StockQuote } from '../../services/finnhub.types';
import { StockCardComponent } from './stock-card.component';

describe('StockCardComponent', () => {
  let component: StockCardComponent;
  let stockServiceSpy: {
    getQuote: ReturnType<typeof vi.fn>;
    addSymbol: ReturnType<typeof vi.fn>;
    removeSymbol: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
  };

  const baseStock: StockQuote = {
    symbol: 'AAPL',
    price: 100,
    change: 0.5,
    percentChange: 0.5,
    high: 101,
    low: 99,
    open: 100,
    previousClose: 99.5,
    timestamp: 1,
    state: 'same',
    disabled: false,
    fiftyTwoWeekHigh: 200,
    fiftyTwoWeekLow: 50,
  };

  beforeEach(async () => {
    stockServiceSpy = {
      getQuote: vi.fn(),
      addSymbol: vi.fn(),
      removeSymbol: vi.fn(),
      getProfile: vi.fn(),
    };
    stockServiceSpy.getProfile.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [StockCardComponent],
      providers: [
        { provide: FinnhubService, useValue: stockServiceSpy as unknown as FinnhubService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StockCardComponent);
    component = fixture.componentInstance;
    component.stock.set(baseStock);
  });

  it('disables stock and unsubscribes symbol when toggle is off', () => {
    component.toggleSocketSubs(false);

    expect(component.stock().disabled).toBe(true);
    expect(stockServiceSpy.removeSymbol).toHaveBeenCalledWith('AAPL');
    expect(stockServiceSpy.removeSymbol).toHaveBeenCalledTimes(1);
    expect(stockServiceSpy.addSymbol).not.toHaveBeenCalled();
  });

  it('refreshes quote and subscribes symbol when toggle is on', () => {
    const refreshedQuote: StockQuote = {
      ...baseStock,
      price: 111,
      state: 'up',
    };
    stockServiceSpy.getQuote.mockReturnValue(of(refreshedQuote));

    component.toggleSocketSubs(true);

    expect(stockServiceSpy.getQuote).toHaveBeenCalledWith('AAPL');
    expect(stockServiceSpy.getQuote).toHaveBeenCalledTimes(1);
    expect(stockServiceSpy.addSymbol).toHaveBeenCalledWith('AAPL');
    expect(stockServiceSpy.addSymbol).toHaveBeenCalledTimes(1);
    expect(component.stock().price).toBe(111);
    expect(component.stock().disabled).toBe(false);
  });
});
