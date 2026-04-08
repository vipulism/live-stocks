import { TestBed } from '@angular/core/testing';

import { FinnhubService } from './finnhub.service';

describe('Finnhub', () => {
  let service: FinnhubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinnhubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
