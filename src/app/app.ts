import { Component, OnInit, signal } from '@angular/core';
import { StockCardComponent } from './components/stock-card/stock-card.component';
import { FinnhubService } from './services/finnhub.service';
import { filter, map } from 'rxjs/operators';
import { StockQuote, StockTrade } from './services/finnhub.types';
import { MockService } from './services/mock.service';
import { Subscription } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [StockCardComponent, MatSlideToggleModule, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('live-stocks');

  symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
  stockList = signal<StockQuote[]>([]);

  useMock = signal(false);
  private stream?: Subscription;

  constructor(
    private stockService: FinnhubService,
    private mockService: MockService
  ) { }

  ngOnInit(): void {
    this.initStream();
  }

  toggleStream(checked: boolean): void {
    this.useMock.set(checked);
    this.initStream();
  }


  initStream(): void {

    this.stream?.unsubscribe();
    this.stockService.disconnect();
    this.mockService.disconnect();

    if (this.useMock()) {
      this.symbols.forEach(symbol => this.mockService.addSymbol(symbol));
      const stockList = this.mockService.getQuotes().map(quote => ({
        ...quote,
        disabled: this.stockList().find(stock => stock.symbol === quote.symbol)?.disabled ?? false
      }));
      this.stockList.set(stockList);
    } else {
      this.stockService.getQuotes(this.symbols).subscribe((quotes) => {
        const stockList = quotes.map(quote => ({
          ...quote,
          disabled: this.stockList().find(stock => stock.symbol === quote.symbol)?.disabled ?? false
        }));
        this.stockList.set(stockList);
      });
    }

    this.stream = this[this.useMock() ? 'mockService' : 'stockService'].connect(this.symbols)
      .pipe(
        filter(res => res.type === 'trade'),
        map((res) => res.data ?? [])
      ).subscribe((trades) => {
        this.updateStocks(trades);
      });
  }


  updateStocks(trades: StockTrade[]): void {
    this.stockList.update(stocks =>
      stocks.map(stock => {
        const trade = trades.find((t: StockTrade) => t.symbol === stock.symbol);
        if (!trade || stock.disabled) return stock;
        const state = trade.price > stock.price ? 'up' : trade.price < stock.price ? 'down' : 'same';
        return trade && !stock.disabled ? {
          ...stock,
          ...trade,
          state: state === 'same' ? stock.state : state
        } : stock;
      })
    );
  }

  onStockChange(updatedStock: StockQuote): void {
    this.stockList.update((stocks) =>
      stocks.map((stock) =>
        stock.symbol === updatedStock.symbol
          ? { ...stock, ...updatedStock }
          : stock
      )
    );
  }
}
