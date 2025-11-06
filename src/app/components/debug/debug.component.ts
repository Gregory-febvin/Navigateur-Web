import { Component, inject } from '@angular/core';
import { BrowserService } from '../../services/browser.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.css'
})
export class DebugComponent {
  public browserService = inject(BrowserService);
  // HAR panel is opened in a dedicated always-on-top window
  async onCreatePdf() {
    try {
      const filePath = await this.browserService.createPdf();
      console.log('PDF created at', filePath);
    } catch (err) {
      console.error('Error creating PDF', err);
    }
  }

  async onExportHtml() {
    try {
      const filePath = await this.browserService.exportHtml();
      console.log('HTML exported to', filePath);
    } catch (err) {
      console.error('Error exporting HTML', err);
    }
  }

  async onExtractMetadata() {
    try {
      const meta = await this.browserService.extractMetadata();
      console.log('Metadata:', meta);
      // Show a simple readable alert for now
      alert(`Title: ${meta.title || ''}\nDescription: ${meta.description || ''}\nOG image: ${meta.openGraph?.image || meta.mainImage || ''}`);
    } catch (err) {
      console.error('Error extracting metadata', err);
      alert('Error extracting metadata: ' + String(err));
    }
  }

  async onStartHar() {
    try {
      const ok = await this.browserService.startHar();
      console.log('HAR started:', ok);
      alert('HAR capture started');
    } catch (err) {
      console.error('Error starting HAR', err);
      alert('Error starting HAR: ' + String(err));
    }
  }

  async onStopHar() {
    try {
      const filePath = await this.browserService.stopHar();
      if (filePath) {
        console.log('HAR saved to', filePath);
        alert('HAR saved to: ' + filePath);
      } else {
        alert('No HAR file created');
      }
    } catch (err) {
      console.error('Error stopping HAR', err);
      alert('Error stopping HAR: ' + String(err));
    }
  }
  async openHarPanel() {
    try {
      await this.browserService.showHarPanel();
    } catch (err) {
      console.error('Error opening HAR panel', err);
      alert('Error opening HAR panel: ' + String(err));
    }
  }

  async openAutomationPanel() {
    try {
      await this.browserService.showAutomationPanel();
    } catch (err) {
      console.error('Error opening automation panel', err);
      alert('Error opening automation panel: ' + String(err));
    }
  }
}
