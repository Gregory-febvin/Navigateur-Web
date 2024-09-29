import { Component, inject } from '@angular/core';
import { BrowserService } from '../../browser.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-incognito',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './incognito.component.html',
  styleUrl: './incognito.component.css'
})
export class incognitoComponent {
  public browserService = inject(BrowserService);
}
