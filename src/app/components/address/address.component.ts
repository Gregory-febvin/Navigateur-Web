import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { BrowserService } from '../../browser.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [MatIconModule, FormsModule, MatInputModule, MatButtonModule],
  templateUrl: './address.component.html',
  styleUrl: './address.component.css'
})
export class AddressComponent implements OnInit {
  @ViewChild('search') searchElement: ElementRef = new ElementRef({});

  public browserService = inject(BrowserService);
  public currentSite: { name: string, url: string } = { name: '', url: '' };

  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit() {
    this.browserService.onPageChange.subscribe((data: { url: string, title: string }) => {
      console.log('onPageChange', data);
      this.updateCurrentSite(data);
    });
  }

  updateCurrentSite(data: { url: string, title: string }) {
    this.currentSite.name = data.title;
    this.currentSite.url = data.url;
    this.cdr.detectChanges();
  }

  onKeyDownEvent(e: any) {
    if (e.key === 'Escape') {
      e.currentTarget.blur();
      this.browserService.setToCurrentUrl();
    } else if (e.key === 'Enter') {
      const value = e.currentTarget.value;
      e.currentTarget.blur();
      this.goToPage(value);
    }
  }

  onMouseDown(e: any) {
    this.searchElement.nativeElement.select();
  };

  goToPage(url: string) {
    // Si pas de https ou http alors ajoute http
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }
    this.browserService.goToPage(url);
  }
}
