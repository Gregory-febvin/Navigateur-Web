import { Component, inject } from '@angular/core';
import { BrowserService } from '../../browser.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  public browserService = inject(BrowserService);

  goHome() {
    this.browserService.goToPage('https://www.google.com');
  }
}
