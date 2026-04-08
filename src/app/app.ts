import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StockCardComponent } from './components/stock-card/stock-card.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StockCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('live-stocks');
}
