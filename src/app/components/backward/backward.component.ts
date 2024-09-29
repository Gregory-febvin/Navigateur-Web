import { Component, inject, OnInit } from '@angular/core';
import { BrowserService } from '../../browser.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-backward',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './backward.component.html',
  styleUrl: './backward.component.css'
})
export class BackwardComponent implements OnInit {

  public browserService = inject(BrowserService);
  public currentSite: { name: string, url: string } = { name: '', url: '' };

  ngOnInit() {
    this.browserService.onPageChange.subscribe((data: { url: string, title: string }) => {
      this.updateCurrentSite();
    });
  }

  updateCurrentSite() {
    this.browserService.currentUrl().then(data => {
      this.currentSite = {
        name: data.title,
        url: data.url
      };
    }).catch(err => {
      console.error(err);
    });
  }

}
