import { Component, inject } from '@angular/core';
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
export class ForwardComponent {
  public browserService = inject(BrowserService);
}
