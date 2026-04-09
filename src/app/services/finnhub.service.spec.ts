import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FinnhubService } from './finnhub.service';
import { FinnhubPriceMetricRaw, FinnhubQuoteRaw } from './finnhub.types';

describe('FinnhubService', () => {
  let service: FinnhubService;
  let httpClientSpy: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpClientSpy = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        FinnhubService,
        { provide: HttpClient, useValue: httpClientSpy as unknown as HttpClient },
      ],
    });

    service = TestBed.inject(FinnhubService);
  });

  it('returns an empty array when getQuotes receives no symbols', async () => {
    const result = await firstValueFrom(service.getQuotes([]));

    expect(result).toEqual([]);
    expect(httpClientSpy.get).not.toHaveBeenCalled();
  });

  it('returns fallback price metric for HTTP 403 responses', async () => {
    httpClientSpy.get.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );

    const result = await firstValueFrom(service.getPriceMetric('AAPL'));

    expect(result).toEqual({
      '52WeekHigh': 100,
      '52WeekLow': 50,
    });
  });

  it('rethrows non-403 errors when loading price metric', async () => {
    const httpError = new HttpErrorResponse({ status: 500 });
    httpClientSpy.get.mockReturnValue(throwError(() => httpError));
    await expect(firstValueFrom(service.getPriceMetric('AAPL'))).rejects.toBe(httpError);
  });

  it('maps quote and metric data into a StockQuote with state', async () => {
    const metric: FinnhubPriceMetricRaw = {
      '52WeekHigh': 210,
      '52WeekLow': 110,
    };
    const quote: FinnhubQuoteRaw = {
      c: 151.456,
      d: 1.234,
      dp: 0.8199,
      h: 152.22,
      l: 149.43,
      o: 150.1,
      pc: 150.222,
      t: 1710000000,
    };

    httpClientSpy.get
      .mockReturnValueOnce(of(metric))
      .mockReturnValueOnce(of(quote));

    const result = await firstValueFrom(service.getQuote('AAPL'));

    expect(result).toEqual({
      symbol: 'AAPL',
      price: 151.46,
      change: 1.23,
      percentChange: 0.82,
      high: 152.22,
      low: 149.43,
      open: 150.1,
      previousClose: 150.22,
      timestamp: 1710000000,
      state: 'up',
      fiftyTwoWeekHigh: 210,
      fiftyTwoWeekLow: 110,
    });
  });
});

