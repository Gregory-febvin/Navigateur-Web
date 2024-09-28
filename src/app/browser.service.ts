import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class BrowserService {

    url = '';
    title = '';
    canGoBack = false;
    canGoForward = false;

    // @ts-ignore
    electronAPI = window.electronAPI;

    captureScreen(rect?: { x: number, y: number, width: number, height: number }) {
        this.electronAPI.captureScreen(rect);
    }

    toogleDevTool() {
        this.electronAPI.toogleDevTool();
    }

    goBack() {
        this.electronAPI.goBack();
        this.updateHistory();
    }

    goForward() {
        this.electronAPI.goForward();
        this.updateHistory();
    }

    refresh() {
        this.electronAPI.refresh();
    }

    goToPage(url: string) {
        this.electronAPI.goToPage(url)
            .then(() => this.updateHistory());
    }

    currentUrl(): Promise<{ url: string, title: string }> {
        return this.electronAPI.currentUrl();
    }

    setToCurrentUrl() {
        this.currentUrl()
            .then((data: { url: string, title: string }) => {
                this.url = data.url;
                this.title = data.title;
            });
        this.currentUrl().then(data => { console.log('currentUrl', data); });
    }

    updateHistory() {
        this.setToCurrentUrl();

        this.electronAPI.canGoBack()
            .then((canGoBack: boolean) => this.canGoBack = canGoBack);

        this.electronAPI.canGoForward()
            .then((canGoForward: boolean) => this.canGoForward = canGoForward);
    }
}
