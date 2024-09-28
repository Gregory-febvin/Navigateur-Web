import { Component, inject, OnInit } from '@angular/core';
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

  goToPage(url: string) {
    this.browserService.goToPage(url);
  }

  ngOnInit() {
    const savedFavoris = localStorage.getItem('favoris');
    if (savedFavoris) {
      this.favoris = JSON.parse(savedFavoris);
    }

    console.log('favoris', this.favoris);
    this.updateCurrentSite();
  }

  updateCurrentSite() {
    this.browserService.currentUrl().then(data => {
      this.currentSite = {
        name: data.title,
        url: data.url
      };
      console.log('updateCurrentSite', this.currentSite);
    }).catch(err => {
      console.error(err);
    });
  }

  async getCurrentSite() {
    return await this.browserService.currentUrl();
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
