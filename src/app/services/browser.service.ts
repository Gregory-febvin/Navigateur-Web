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
        if (!this.electronAPI){
            this.electronAPI = {
                onUpdateUrl : ()=>{},
                currentUrl : async ()=>{return ""}
            }
        }

        const updateUrl = (event: any, url: any, title: any) => {
            this.url = url;
            this.title = title;
            this.setToCurrentUrl();
            this.emitPageChange();
        };

        this.electronAPI.onUpdateUrl(updateUrl);
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
            this.setToCurrentUrl(url);
        }).catch((err: any) => console.error(err));
    }

    setToCurrentUrl(url?: string, title?: string) {
        this.url = url || this.url;
        this.title = title || this.title;
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
        this.onPageChange.emit({ url: this.url, title: this.title });
    }
}