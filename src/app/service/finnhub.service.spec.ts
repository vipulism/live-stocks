import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FinnhubService } from './finnhub.service';

describe('Finnhub', () => {
  let service: FinnhubService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(FinnhubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
