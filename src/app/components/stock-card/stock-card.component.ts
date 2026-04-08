import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FinnhubService } from '../../service/finnhub.service';
import { filter, map } from 'rxjs/operators';
import { StockQuote, StockTrade } from '../../service/finnhub.types';

@Component({
  selector: 'app-stock-card',
  imports: [MatSlideToggleModule, FormsModule, CommonModule],
  templateUrl: './stock-card.component.html',
  styleUrl: './stock-card.component.scss',
})
/**
 * Renders stock data and subscribes to live market updates.
 */
export class StockCardComponent implements OnInit {

  isChecked = true;
  card = input.required<StockQuote>();

  isFlashing = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private previousState: StockQuote['state'] | null = null;
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;


  constructor() {

    effect(() => {
      const state = this.card()?.state;
      if (!state) return;
      if (this.previousState !== null && this.previousState !== state) {
        this.triggerFlash();
      }
      this.previousState = state;
    });
    this.destroyRef.onDestroy(() => {
      if (this.flashTimeout) clearTimeout(this.flashTimeout);
    });

  }


  ngOnInit(): void {

  }

  private triggerFlash(): void {
    this.isFlashing.set(false); // restart animation if already active
    queueMicrotask(() => {
      this.isFlashing.set(true);
      if (this.flashTimeout) clearTimeout(this.flashTimeout);
      this.flashTimeout = setTimeout(() => this.isFlashing.set(false), 500);
    });
  }



}
