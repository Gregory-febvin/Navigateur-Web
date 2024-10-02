import { Component, inject } from '@angular/core';
import { BrowserService } from '../../services/browser.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ad-block',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './ad-block.component.html',
  styleUrl: './ad-block.component.css'
})
export class AdBlockComponent {
  isBlockEnabled: boolean = true;
  public browserService = inject(BrowserService);

  toggleAdBlock() {
    this.browserService.loadBlockList(this.isBlockEnabled);
    this.isBlockEnabled = !this.isBlockEnabled;
  }
}
