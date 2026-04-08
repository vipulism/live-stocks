import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StockCardComponent } from './components/stock-card/stock-card.component';
import { FinnhubService } from './service/finnhub.service';
import { filter, map } from 'rxjs/operators';
import { StockQuote, StockTrade } from './service/finnhub.types';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StockCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('live-stocks');


  symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
  cards = signal<StockQuote[]>([]);
  constructor(private stockService: FinnhubService) { }

  ngOnInit(): void {
    this.stockService.connect(this.symbols)
      .pipe(
        filter(res => res.type === 'trade'),
        map((res: any) => res.data ?? [])
      ).subscribe((trades) => {
        console.log(trades);
        this.cards.update(cards =>
          cards.map(card => {
            const trade = trades.find((t: StockTrade) => t.symbol === card.symbol);
            if (!trade) return card;
            const state = trade.price > card.price ? 'up' : trade.price < card.price ? 'down' : 'same';
            return trade ? {
              ...card,
              ...trade,
              state: state === 'same' ? card.state : state
            } : card;
          })
        );
      });

    this.stockService.getQuotes(this.symbols).subscribe((quotes) => {
      this.cards.set(quotes);
    });
  }
}
