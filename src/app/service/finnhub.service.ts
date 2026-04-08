import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FinnhubService {
  private readonly finnhubConfig = environment.finnhub;

  constructor(private http: HttpClient) { }

  connect(stockSymbols: string[]): Observable<any> {
    return new Observable(observer => {
      const socket = new WebSocket(
        `${this.finnhubConfig.wsUrl}?token=${this.finnhubConfig.token}`
      );

      socket.onopen = () => {
        stockSymbols.forEach(symbol => {
          socket.send(JSON.stringify({
            type: 'subscribe',
            symbol
          }));
        });
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        observer.next(data);
      };

      socket.onerror = (error) => observer.error(error);
      socket.onclose = () => observer.complete();

      return () => socket.close();
    });
  }

  getStockDetails(symbol: string) {
    return this.http.get(
      `${this.finnhubConfig.restBaseUrl}/quote?symbol=${symbol}&token=${this.finnhubConfig.token}`
    );
  }
}
