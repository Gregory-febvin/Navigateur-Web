import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BrowserService } from '../../browser.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-forward',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './forward.component.html',
  styleUrl: './forward.component.css'
})
export class ForwardComponent implements OnInit {

  public browserService = inject(BrowserService);
  public currentSite: { name: string, url: string } = { name: '', url: '' };
  electronService: any;

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
