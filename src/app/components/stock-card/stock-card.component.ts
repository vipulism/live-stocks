import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FinnhubService } from '../../services/finnhub.service';
import { StockQuote } from '../../services/finnhub.types';

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

  private static readonly FLASH_DURATION_MS = 1200;

  isChecked = true;
  stock = model.required<StockQuote>();

  isFlashing = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private previousPrice: number | null = null;
  private flashTimeout: ReturnType<typeof setTimeout> | null = null;
  private flashFrame: number | null = null;


  constructor(private stockService: FinnhubService) {

    effect(() => {
      const price = this.stock()?.price;
      if (price == null) return;
      if (this.previousPrice !== null && this.previousPrice !== price) {
        this.triggerFlash();
      }
      this.previousPrice = price;
    });
    this.destroyRef.onDestroy(() => {
      if (this.flashTimeout) clearTimeout(this.flashTimeout);
      if (this.flashFrame !== null) cancelAnimationFrame(this.flashFrame);
    });

  }

  ngOnInit(): void {
    this.stockService.getProfile(this.stock()?.symbol).subscribe((profile) => {
      console.log(profile);
    });
  }

  private triggerFlash(): void {
    this.isFlashing.set(false);

    // Wait for a paint frame so CSS animation can restart on rapid live updates.
    if (this.flashFrame !== null) cancelAnimationFrame(this.flashFrame);
    this.flashFrame = requestAnimationFrame(() => {
      this.isFlashing.set(true);
      if (this.flashTimeout) clearTimeout(this.flashTimeout);
      this.flashTimeout = setTimeout(
        () => this.isFlashing.set(false),
        StockCardComponent.FLASH_DURATION_MS
      );
      this.flashFrame = null;
    });
  }

  toggleSocketSubs(checked: boolean): void {
    this.stock.update(stock => ({
      ...stock,
      disabled: !checked
    }));

    if (checked) {
      this.stockService.getQuote(this.stock().symbol).subscribe((quote) => {
        this.stock.set({ ...quote, disabled: !checked });
        this.stockService.addSymbol(this.stock().symbol);
      });
    } else {
      this.stockService.removeSymbol(this.stock().symbol);
    }
  }


}
