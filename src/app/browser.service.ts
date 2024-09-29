// src/app/browser.service.ts
import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class BrowserService {
    url = '';
    title = '';
    canGoBack = false;
    canGoForward = false;

    public onPageChange: EventEmitter<{ url: string, title: string }> = new EventEmitter();

    // @ts-ignore
    electronAPI = window.electronAPI;

    constructor() {
        if (this.electronAPI) {
            console.log('browser.service.ts: electronAPI détecté');
            this.electronAPI.onUpdateUrl((data: { url: string, title: string }) => {
                console.log('browser.service.ts: URL reçue', data.url, data.title);
                this.emitPageChange();
            });
        } else {
            console.error('browser.service.ts: electronAPI non disponible');
        }
    }
    

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
        this.electronAPI.refresh().then(() => {
            this.setToCurrentUrl();
        }).catch((err: any) => console.error(err));
    }

    goToPage(url: string) {
        this.electronAPI.goToPage(url).then(() => {
            this.updateHistory();
            this.setToCurrentUrl();
        }).catch((err: any) => console.error(err));
    }

    currentUrl(): Promise<{ url: string, title: string }> {
        return this.electronAPI.currentUrl();
    }

    setToCurrentUrl() {
        this.currentUrl().then((data: { url: string, title: string }) => {
            this.url = data.url;
            this.title = data.title;
            this.emitPageChange();
        }).catch(err => console.error(err));
    }

    updateHistory() {
        this.electronAPI.canGoBack().then((canGoBack: boolean) => {
            this.canGoBack = canGoBack;
        }).catch((err: any) => console.error(err));

        this.electronAPI.canGoForward().then((canGoForward: boolean) => {
            this.canGoForward = canGoForward;
        }).catch((err: any) => console.error(err));
    }

    setProxy(proxyRules: string) {
        this.electronAPI.setProxy({ proxyRules }).then(() => {
            console.log(`Proxy set to: ${proxyRules}`);
        }).catch((err: any) => console.error(err));
    }

    enableIncognitoMode() {
        localStorage.clear();
        sessionStorage.clear();
        this.clearCookies();
      }

    private clearCookies() {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
    }

    emitPageChange() {
        console.log('emitPageChange', this.url, this.title);
        this.onPageChange.emit({ url: this.url, title: this.title });
    }
}