import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserService } from '../../browser.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule],
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.css']
})
export class FavoriteComponent implements OnInit {
  public browserService = inject(BrowserService);
  public favoris: { name: string, url: string }[] = [];
  public currentSite: { name: string, url: string } = { name: '', url: '' };

  constructor(private cdr: ChangeDetectorRef) {}
  
  goToPage(url: string) {
    this.browserService.goToPage(url);
  }

  ngOnInit() {
    const savedFavoris = localStorage.getItem('favoris');
    if (savedFavoris) {
      this.favoris = JSON.parse(savedFavoris);
    }

    this.browserService.onPageChange.subscribe((data: { url: string, title: string }) => {
      this.updateCurrentSite(data);
    });

  }

  updateCurrentSite(data: { url: string, title: string }) {
    this.currentSite.name = data.title;
    this.currentSite.url = data.url;
    this.cdr.detectChanges();
  }

  isFavorite(): boolean {
    return this.favoris.some(favori => favori.url === this.currentSite.url);
  }
  
  toggleFavorite() {
    if (this.isFavorite()) {
      this.favoris = this.favoris.filter(favori => favori.url !== this.currentSite.url);
    } else {
      console.log(this.currentSite);
      this.favoris.push({ name: this.currentSite.name, url: this.currentSite.url });
    }

    localStorage.setItem('favoris', JSON.stringify(this.favoris));
    console.log(this.favoris);
  }
  
}
