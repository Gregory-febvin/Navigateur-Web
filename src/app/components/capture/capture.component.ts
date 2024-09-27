import { Component, inject } from '@angular/core';
import { BrowserService } from '../../browser.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-capture',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './capture.component.html',
  styleUrl: './capture.component.css'
})
export class CaptureComponent {
  public browserService = inject(BrowserService);
}
