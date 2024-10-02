import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BrowserService } from '../../services/browser.service';
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
}
