import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { BrowserService } from '../../services/browser.service';
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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.browserService.onPageChange.subscribe((data: { url: string, title: string }) => {
      this.updateCurrentSite(data);
    });
  }

  updateCurrentSite(data: { url: string, title: string }) {
    this.currentSite.name = data.title;
    this.currentSite.url = data.url;
    this.cdr.detectChanges();
  }

  goBack() {
    this.browserService.goBack();
  }

}
