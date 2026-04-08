import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FinnhubService } from '../../service/finnhub.service';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-stock-card',
  imports: [MatSlideToggleModule, FormsModule, CommonModule],
  templateUrl: './stock-card.component.html',
  styleUrl: './stock-card.component.scss',
})
export class StockCardComponent implements OnInit {

  isChecked = true;

  constructor(private stockService: FinnhubService) { }


  ngOnInit(): void {
    this.stockService.connect()
      .pipe(
        filter(res => res.type === 'trade'),
        map(res => res.data)
      ).subscribe((res: any) => {
        res.data.forEach((trade: any) => {
          const symbol = trade.s;
          const price = trade.p;
          console.log(symbol, price);
        });
      });
  }
}
